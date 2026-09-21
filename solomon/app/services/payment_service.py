"""
app/services/payment_service.py
Multi-provider payments: Stripe, Crypto (BTC/ETH/USDT/USDC), Wire
"""
import os
import logging
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import requests

from app.models import Sale
from app.extensions import db

log = logging.getLogger(__name__)


class PaymentProvider:
    """Base interface for all payment providers."""
    name = "base"

    def create_payment_intent(self, sale: Sale) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        raise NotImplementedError

    def handle_webhook(self, event: dict) -> Dict[str, Any]:
        raise NotImplementedError


# ============ Stripe ============
class StripeProvider(PaymentProvider):
    name = "stripe"
    BASE_URL = "https://api.stripe.com/v1"

    def __init__(self, api_key: str, webhook_secret: str = ""):
        self.api_key = api_key
        self.webhook_secret = webhook_secret
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/x-www-form-urlencoded",
        })

    def create_payment_intent(self, sale: Sale) -> Dict[str, Any]:
        try:
            r = self.session.post(
                f"{self.BASE_URL}/payment_intents",
                data={
                    "amount": int(sale.sold_price * 100),
                    "currency": "usd",
                    "metadata[sale_id]": str(sale.id),
                    "metadata[invoice]": sale.invoice_number,
                },
            )
            if r.status_code == 200:
                data = r.json()
                return {
                    "ok": True, "payment_intent_id": data["id"],
                    "client_secret": data["client_secret"],
                    "status": data["status"], "amount": data["amount"],
                }
            return {"ok": False, "error": r.text}
        except Exception as e:
            log.error(f"Stripe error: {e}")
            return {"ok": False, "error": str(e)}

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        try:
            elements = dict(e.split("=", 1) for e in signature.split(","))
            timestamp = elements.get("t", "")
            sig = elements.get("v1", "")
            signed_payload = f"{timestamp}.{payload.decode()}"
            expected = hmac.new(
                self.webhook_secret.encode(),
                signed_payload.encode(),
                hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(sig, expected)
        except Exception as e:
            log.error(f"Stripe webhook verify failed: {e}")
            return False

    def handle_webhook(self, event: dict) -> Dict[str, Any]:
        event_type = event.get("type")
        if event_type == "payment_intent.succeeded":
            pi = event["data"]["object"]
            sale_id = pi.get("metadata", {}).get("sale_id")
            if sale_id:
                return {"action": "mark_paid", "sale_id": int(sale_id),
                        "payment_id": pi["id"], "amount": pi["amount"] / 100}
        elif event_type == "payment_intent.payment_failed":
            pi = event["data"]["object"]
            sale_id = pi.get("metadata", {}).get("sale_id")
            if sale_id:
                return {"action": "mark_failed", "sale_id": int(sale_id)}
        return {"action": "ignored"}


# ============ Crypto (BTC/ETH/USDT/USDC) ============
class CryptoProvider(PaymentProvider):
    name = "crypto"
    SUPPORTED_COINS = {
        "BTC": {"name": "Bitcoin", "decimals": 8},
        "ETH": {"name": "Ethereum", "decimals": 18},
        "USDT": {"name": "Tether", "decimals": 6, "stable": True},
        "USDC": {"name": "USD Coin", "decimals": 6, "stable": True},
    }

    def __init__(self, addresses: Dict[str, str] = None):
        self.addresses = addresses or {
            "BTC": os.getenv("CRYPTO_BTC_ADDRESS", "bc1qdemo0000000000000000000000000000000demo"),
            "ETH": os.getenv("CRYPTO_ETH_ADDRESS", "0xdemo0000000000000000000000000000000000"),
            "USDT": os.getenv("CRYPTO_USDT_ADDRESS", "Tdemo0000000000000000000000000000000"),
            "USDC": os.getenv("CRYPTO_USDC_ADDRESS", "0xdemo0000000000000000000000000000000000"),
        }
        self.session = requests.Session()

    def create_payment_intent(self, sale: Sale) -> Dict[str, Any]:
        coin = sale.payment_method.upper() if sale.payment_method.upper() in self.SUPPORTED_COINS else "USDT"
        address = self.addresses.get(coin, "")
        if not address:
            return {"ok": False, "error": f"No receiving address for {coin}"}

        if self.SUPPORTED_COINS[coin].get("stable"):
            amount = sale.sold_price
        else:
            amount = self._convert_usd_to_coin(sale.sold_price, coin)

        payment_id = f"CRYPTO_{sale.id}_{secrets.token_hex(4)}"
        return {
            "ok": True, "payment_id": payment_id, "coin": coin,
            "address": address, "amount": amount, "amount_usd": sale.sold_price,
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "qr_data": f"{coin}:{address}?amount={amount}",
        }

    def _convert_usd_to_coin(self, usd: float, coin: str) -> float:
        try:
            cg_id = "tether" if coin == "USDT" else coin.lower()
            r = self.session.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": cg_id, "vs_currencies": "usd"},
                timeout=10,
            )
            if r.status_code == 200:
                rate = r.json().get(cg_id, {}).get("usd", 0)
                if rate > 0:
                    return round(usd / rate, 8)
        except Exception as e:
            log.warning(f"Price conversion failed: {e}")
        return 0.0

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        return True  # handled differently in production (BTCPay etc.)

    def handle_webhook(self, event: dict) -> Dict[str, Any]:
        return {"action": "manual_verify_required"}


# ============ Wire Transfer ============
class WireProvider(PaymentProvider):
    name = "wire"

    def __init__(self, bank_info: dict = None):
        self.bank_info = bank_info or {
            "bank_name": os.getenv("BANK_NAME", "Solomon Bank"),
            "account_name": os.getenv("BANK_ACCOUNT_NAME", "Solomon LLC"),
            "account_number": os.getenv("BANK_ACCOUNT_NUMBER", "000000000"),
            "routing_number": os.getenv("BANK_ROUTING", "000000000"),
            "swift": os.getenv("BANK_SWIFT", "SOLOMONUS"),
            "reference_instructions": "Use invoice number as reference",
        }

    def create_payment_intent(self, sale: Sale) -> Dict[str, Any]:
        return {
            "ok": True, "payment_method": "wire", "amount": sale.sold_price,
            "invoice": sale.invoice_number, "bank_info": self.bank_info,
            "instructions": f"حوّل ${sale.sold_price:,.2f} لحسابنا. استخدم رقم الفاتورة {sale.invoice_number} كمرجع.",
        }

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        return True

    def handle_webhook(self, event: dict) -> Dict[str, Any]:
        return {"action": "manual_reconcile"}


# ============ Payment Manager ============
class PaymentManager:
    """Unified payment router."""

    def __init__(self, config):
        self.providers = {}
        if config.get("STRIPE_API_KEY"):
            self.providers["stripe"] = StripeProvider(
                config["STRIPE_API_KEY"],
                config.get("STRIPE_WEBHOOK_SECRET", ""),
            )
        self.providers["crypto"] = CryptoProvider()
        self.providers["wire"] = WireProvider()

    def get_provider(self, method: str) -> Optional[PaymentProvider]:
        if not method:
            return None
        m = method.lower()
        if m in ("credit_card", "card", "stripe"):
            return self.providers.get("stripe")
        elif m in ("btc", "eth", "usdt", "usdc", "crypto"):
            return self.providers.get("crypto")
        elif m in ("wire", "bank"):
            return self.providers.get("wire")
        return None

    def create_intent(self, sale: Sale) -> Dict[str, Any]:
        provider = self.get_provider(sale.payment_method)
        if not provider:
            return {"ok": False, "error": f"Unknown payment method: {sale.payment_method}"}
        return provider.create_payment_intent(sale)

    def handle_webhook(self, method: str, payload: bytes, signature: str, event: dict) -> Dict[str, Any]:
        provider = self.get_provider(method)
        if not provider:
            return {"ok": False, "error": "Unknown provider"}
        if not provider.verify_webhook(payload, signature):
            return {"ok": False, "error": "Invalid signature"}
        result = provider.handle_webhook(event)
        if result.get("action") == "mark_paid" and result.get("sale_id"):
            sale = Sale.query.get(result["sale_id"])
            if sale and sale.status == "pending":
                sale.status = "paid"
                sale.paid_at = datetime.utcnow()
                sale.payment_id = result.get("payment_id")
                db.session.commit()
                log.info(f"Sale {sale.id} auto-marked paid via webhook")
        return {"ok": True, **result}
