"""
app/services/license_service.py - Commercial License Key Generator, Verifier & Paywall Protection
Protects Solomon v4.1 intellectual property so unauthorized users cannot run or steal the software for free.
"""
import os
import hmac
import hashlib
import base64
import json
from datetime import datetime, timedelta

PRICING_TIERS = {
    "INDIE": {
        "name": "Solomon Indie License",
        "price_usd": 49.0,
        "max_projects": 1,
        "features": ["Core API", "ML Valuation", "SQLite DB", "Standard Dashboard"],
    },
    "PRO": {
        "name": "Solomon Pro License (Most Popular)",
        "price_usd": 149.0,
        "max_projects": 3,
        "features": [
            "Full 75+ APIs",
            "iOS & Android Mobile App",
            "WhatsApp Broadcast Engine",
            "OpenAI Deal Analyzer",
            "Stripe & USDT Checkout",
        ],
    },
    "AGENCY": {
        "name": "Solomon Agency White-Label License",
        "price_usd": 499.0,
        "max_projects": 25,
        "features": [
            "Full White-Label Rights (Resell to Clients)",
            "iOS & Android React Native Source Code",
            "Unlimited WhatsApp & AI Campaigns",
            "Commercial License Key Generator",
            "Priority VIP Support",
        ],
    },
}


def _master_secret() -> bytes:
    secret = os.getenv("MASTER_LICENSE_SECRET") or os.getenv("SECRET_KEY") or "solomon-master-commercial-secret-2026"
    return secret.encode("utf-8")


def generate_license_key(buyer_email: str, tier: str = "PRO", days_valid: int = 365) -> dict:
    """Generate a cryptographically signed commercial license key."""
    tier = tier.upper()
    if tier not in PRICING_TIERS:
        tier = "PRO"

    issued_at = datetime.utcnow().strftime("%Y-%m-%d")
    expires_at = (datetime.utcnow() + timedelta(days=days_valid)).strftime("%Y-%m-%d")

    payload_str = f"{tier}|{buyer_email.lower().strip()}|{expires_at}"
    sig = hmac.new(_master_secret(), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()[:12].upper()

    encoded_payload = base64.urlsafe_b64encode(payload_str.encode("utf-8")).decode("utf-8").rstrip("=")
    license_key = f"SLM-{tier}-{sig[:4]}-{sig[4:8]}-{sig[8:12]}.{encoded_payload}"

    return {
        "license_key": license_key,
        "tier": tier,
        "tier_name": PRICING_TIERS[tier]["name"],
        "price_usd": PRICING_TIERS[tier]["price_usd"],
        "buyer_email": buyer_email,
        "issued_at": issued_at,
        "expires_at": expires_at,
        "features": PRICING_TIERS[tier]["features"],
    }


def verify_license_key(license_key: str) -> dict:
    """Verify a commercial license key signature and expiration."""
    if not license_key or "." not in license_key or not license_key.startswith("SLM-"):
        return {"valid": False, "error": "مفتاح ترخيص غير صالح — يرجى شراء نسخة مرخصة ($49 - $499)"}

    try:
        header_part, encoded_payload = license_key.split(".", 1)
        parts = header_part.split("-")
        if len(parts) < 5:
            return {"valid": False, "error": "تنسيق المفتاح غير مكتمل"}

        provided_sig = f"{parts[2]}{parts[3]}{parts[4]}".upper()

        padding = "=" * (-len(encoded_payload) % 4)
        payload_str = base64.urlsafe_b64decode(encoded_payload + padding).decode("utf-8")
        tier, buyer_email, expires_at = payload_str.split("|", 2)

        expected_sig = hmac.new(_master_secret(), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()[:12].upper()
        if not hmac.compare_digest(provided_sig, expected_sig):
            return {"valid": False, "error": "توقيع المفتاح غير صحيح (مزوّر)"}

        if datetime.utcnow().strftime("%Y-%m-%d") > expires_at:
            return {"valid": False, "error": "انتهت صلاحية الترخيص — يرجى التجديد"}

        return {
            "valid": True,
            "tier": tier,
            "tier_info": PRICING_TIERS.get(tier, PRICING_TIERS["PRO"]),
            "buyer_email": buyer_email,
            "expires_at": expires_at,
        }
    except Exception as e:
        return {"valid": False, "error": f"خطأ في التحقق من الترخيص: {e}"}
