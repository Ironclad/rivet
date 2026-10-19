"""tests/test_payments.py - Payment service tests"""
import pytest
import hmac
import hashlib


class TestStripeProvider:
    def test_webhook_signature_verification(self):
        from app.services.payment_service import StripeProvider
        provider = StripeProvider(api_key="sk_test_123", webhook_secret="whsec_test")

        payload = b'{"type":"payment_intent.succeeded"}'
        timestamp = "1234567890"
        signed = f"{timestamp}.{payload.decode()}"
        expected = hmac.new(b"whsec_test", signed.encode(), hashlib.sha256).hexdigest()
        sig = f"t={timestamp},v1={expected}"

        assert provider.verify_webhook(payload, sig) is True
        assert provider.verify_webhook(payload, "t=invalid,v1=wrong") is False

    def test_handle_webhook_payment_succeeded(self):
        from app.services.payment_service import StripeProvider
        provider = StripeProvider(api_key="sk_test", webhook_secret="whsec")
        event = {
            "type": "payment_intent.succeeded",
            "data": {"object": {
                "id": "pi_123",
                "amount": 10000,
                "metadata": {"sale_id": "42"},
            }},
        }
        result = provider.handle_webhook(event)
        assert result["action"] == "mark_paid"
        assert result["sale_id"] == 42


class TestCryptoProvider:
    def test_create_intent_with_stablecoin(self):
        from app.services.payment_service import CryptoProvider
        from app.models import Sale, Treasure
        provider = CryptoProvider()

        treasure = Treasure(id="T1", title="Test", price=100, estimated_value=500,
                           profit_pct=400, source="govdeals")
        sale = Sale(id=1, treasure_id="T1", customer_id=1, sold_price=1000,
                   cost_basis=100, payment_method="USDT", invoice_number="INV-1")
        sale.treasure = treasure

        result = provider.create_payment_intent(sale)
        assert result["ok"] is True
        assert result["coin"] == "USDT"
        assert result["amount"] == 1000.0  # 1:1 for stablecoin


class TestWireProvider:
    def test_create_intent_returns_bank_info(self):
        from app.services.payment_service import WireProvider
        from app.models import Sale
        provider = WireProvider({"bank_name": "Test Bank"})
        sale = Sale(id=1, sold_price=5000, payment_method="wire",
                   invoice_number="INV-2024-001")
        result = provider.create_payment_intent(sale)
        assert result["ok"] is True
        assert result["amount"] == 5000
        assert "bank_info" in result


class TestPaymentManager:
    def test_get_provider_routing(self):
        from app.services.payment_service import PaymentManager
        manager = PaymentManager({})
        # Without API key, stripe unavailable
        assert manager.get_provider("crypto") is not None
        assert manager.get_provider("wire") is not None
        assert manager.get_provider("unknown") is None
