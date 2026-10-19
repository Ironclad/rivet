"""
app/api/licensing.py - Commercial Licensing & Paid Access Gate API
"""
import os
import uuid
from flask import Blueprint, request, jsonify
from app.services.auth_service import jwt_required
from app.services.license_service import PRICING_TIERS, generate_license_key, verify_license_key

licensing_bp = Blueprint("licensing", __name__)


@licensing_bp.route("/tiers", methods=["GET"])
def list_tiers():
    """Public endpoint listing paid commercial license tiers."""
    return jsonify({
        "ok": True,
        "commercial_only": True,
        "copyright": "All Rights Reserved © 2026 Namak7678 — Paid Commercial Software",
        "tiers": PRICING_TIERS,
    })


@licensing_bp.route("/generate", methods=["POST"])
@jwt_required
def create_license():
    """Owner/Admin endpoint to issue a paid license key for a buyer."""
    data = request.json or {}
    buyer_email = data.get("buyer_email") or "customer@example.com"
    tier = data.get("tier") or "PRO"
    days_valid = int(data.get("days_valid") or 365)

    lic = generate_license_key(buyer_email=buyer_email, tier=tier, days_valid=days_valid)
    return jsonify({
        "ok": True,
        **lic,
    })


@licensing_bp.route("/verify", methods=["POST"])
def verify_license():
    """Verify if a provided commercial license key is genuine and active."""
    data = request.json or {}
    license_key = data.get("license_key", "")
    res = verify_license_key(license_key)
    status_code = 200 if res.get("valid") else 402
    return jsonify({
        "ok": res.get("valid", False),
        **res,
    }), status_code


@licensing_bp.route("/buy-intent", methods=["POST"])
def buy_license_intent():
    """Create a payment order for a customer buying a Solomon license ($49 / $149 / $499)."""
    data = request.json or {}
    tier = (data.get("tier") or "PRO").upper()
    if tier not in PRICING_TIERS:
        tier = "PRO"
    buyer_email = data.get("buyer_email") or "buyer@example.com"
    payment_method = (data.get("payment_method") or "USDT").upper()

    price_usd = PRICING_TIERS[tier]["price_usd"]
    order_id = f"ORD-LIC-{tier}-{uuid.uuid4().hex[:8].upper()}"
    usdt_addr = os.getenv("CRYPTO_USDT_ADDRESS") or "Tdemo0000000000000000000000000000000"

    return jsonify({
        "ok": True,
        "order_id": order_id,
        "tier": tier,
        "tier_name": PRICING_TIERS[tier]["name"],
        "price_usd": price_usd,
        "buyer_email": buyer_email,
        "payment_method": payment_method,
        "usdt_address": usdt_addr,
        "qr_data": f"USDT:{usdt_addr}?amount={price_usd}",
        "instructions_ar": f"للحصول على مفتاح الترخيص الفوري لباقة {tier} (${price_usd})، أتمم الدفع وسيتم إرسال مفتاح التفعيل المشفّر إلى {buyer_email}.",
    })
