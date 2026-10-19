"""app/api/payments.py - Payment endpoints (v4.0)"""
import json
from flask import Blueprint, request, jsonify, g, current_app
from app.services.auth_service import jwt_required
from app.services.payment_service import PaymentManager
from app.models import Sale, AuditLog
from app.extensions import db

payments_bp = Blueprint("payments", __name__)


def _get_manager():
    return PaymentManager(current_app.config)


@payments_bp.route("/create-intent", methods=["POST"])
@jwt_required
def create_intent():
    """Create a payment intent for a sale."""
    data = request.json or {}
    sale_id = data.get("sale_id")
    if not sale_id:
        return jsonify({"error": "sale_id required"}), 400
    sale = Sale.query.get(sale_id)
    if not sale:
        return jsonify({"error": "Sale not found"}), 404

    manager = _get_manager()
    result = manager.create_intent(sale)

    if result.get("ok"):
        log = AuditLog(
            user_id=g.current_user.id,
            action="payment_intent_created",
            entity_type="sale",
            entity_id=str(sale_id),
            changes=json.dumps({"method": sale.payment_method, "amount": sale.sold_price}),
            ip_address=request.remote_addr,
        )
        db.session.add(log)
        db.session.commit()

    return jsonify(result)


@payments_bp.route("/webhook/<method>", methods=["POST"])
def webhook(method):
    """Receive webhook from payment provider."""
    payload = request.get_data()
    signature = request.headers.get("X-Signature") or request.headers.get("Stripe-Signature", "")
    try:
        event = json.loads(payload)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    manager = _get_manager()
    result = manager.handle_webhook(method, payload, signature, event)

    if result.get("ok"):
        log = AuditLog(
            action="payment_webhook",
            entity_type="payment",
            entity_id=method,
            changes=json.dumps(result),
            ip_address=request.remote_addr,
        )
        db.session.add(log)
        db.session.commit()

    return jsonify(result)


@payments_bp.route("/methods", methods=["GET"])
@jwt_required
def list_methods():
    """List supported payment methods."""
    return jsonify({
        "methods": [
            {"id": "stripe", "name": "Credit Card (Stripe)", "currencies": ["USD", "EUR"],
             "instant": True, "fees": "2.9% + $0.30"},
            {"id": "crypto", "name": "Cryptocurrency", "currencies": ["BTC", "ETH", "USDT", "USDC"],
             "instant": False, "fees": "Network fees only"},
            {"id": "wire", "name": "Wire Transfer", "currencies": ["USD"],
             "instant": False, "fees": "Bank fees may apply"},
        ]
    })
