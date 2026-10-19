"""
app/api/stripe_integration.py - Full Stripe Checkout & Refund Integration (Live + Test Mode)
"""
import os
import json
import uuid
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, g, current_app, url_for
from app.services.auth_service import jwt_required
from app.models import Sale, AuditLog
from app.extensions import db

try:
    import stripe
except ImportError:
    stripe = None

log = logging.getLogger(__name__)
stripe_bp = Blueprint("stripe_integration", __name__)


@stripe_bp.route("/status", methods=["GET"])
@jwt_required
def stripe_status():
    """Check Stripe configuration status and mode."""
    api_key = current_app.config.get("STRIPE_API_KEY") or os.getenv("STRIPE_API_KEY", "")
    is_live = api_key.startswith("sk_live_")
    is_test = api_key.startswith("sk_test_")
    return jsonify({
        "ok": True,
        "configured": bool(api_key),
        "mode": "live" if is_live else ("test" if is_test else "sandbox_simulation"),
        "webhook_configured": bool(current_app.config.get("STRIPE_WEBHOOK_SECRET") or os.getenv("STRIPE_WEBHOOK_SECRET")),
    })


@stripe_bp.route("/checkout", methods=["POST"])
@jwt_required
def create_checkout_session():
    """Create a Stripe Checkout session for a sale (supports real Stripe keys + sandbox test mode)."""
    data = request.json or {}
    sale_id = data.get("sale_id")
    if not sale_id:
        return jsonify({"error": "sale_id required"}), 400

    sale = db.session.get(Sale, sale_id)
    if not sale:
        return jsonify({"error": "Sale not found"}), 404

    api_key = current_app.config.get("STRIPE_API_KEY") or os.getenv("STRIPE_API_KEY", "")

    # Sandbox simulation mode if no real Stripe key is configured yet
    if not api_key or api_key.startswith("sk_test_demo") or stripe is None:
        session_id = f"cs_test_{uuid.uuid4().hex[:24]}"
        payment_intent_id = f"pi_test_{uuid.uuid4().hex[:16]}"
        sale.payment_id = payment_intent_id
        log_entry = AuditLog(
            user_id=g.current_user.id,
            action="stripe_checkout_created",
            entity_type="sale",
            entity_id=str(sale.id),
            changes=json.dumps({"session_id": session_id, "amount": sale.sold_price, "mode": "test_simulation"}),
            ip_address=request.remote_addr,
        )
        db.session.add(log_entry)
        db.session.commit()

        return jsonify({
            "ok": True,
            "mode": "test_simulation",
            "session_id": session_id,
            "payment_intent": payment_intent_id,
            "checkout_url": f"/api/v3/stripe/success?session_id={session_id}&sale_id={sale.id}",
            "amount": sale.sold_price,
            "currency": "usd",
        })

    stripe.api_key = api_key

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(sale.sold_price * 100),
                    "product_data": {
                        "name": sale.treasure.title if sale.treasure else f"Sale {sale.invoice_number}",
                        "description": f"Invoice: {sale.invoice_number}",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=url_for("stripe_integration.success", _external=True) + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=url_for("stripe_integration.cancel", _external=True),
            metadata={
                "sale_id": str(sale.id),
                "invoice": sale.invoice_number,
            },
            customer_email=sale.customer.email if sale.customer and sale.customer.email else None,
        )

        log_entry = AuditLog(
            user_id=g.current_user.id,
            action="stripe_checkout_created",
            entity_type="sale",
            entity_id=str(sale_id),
            changes=json.dumps({"session_id": session.id, "amount": sale.sold_price, "mode": "stripe"}),
            ip_address=request.remote_addr,
        )
        db.session.add(log_entry)
        db.session.commit()

        return jsonify({
            "ok": True,
            "mode": "stripe",
            "session_id": session.id,
            "checkout_url": session.url,
            "amount": sale.sold_price,
        })

    except Exception as e:
        log.error(f"Stripe checkout error: {e}")
        return jsonify({"error": str(e)}), 400


@stripe_bp.route("/success", methods=["GET"])
def success():
    """Stripe Checkout success callback."""
    session_id = request.args.get("session_id")
    sale_id_param = request.args.get("sale_id")
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    api_key = current_app.config.get("STRIPE_API_KEY") or os.getenv("STRIPE_API_KEY", "")

    if not api_key or session_id.startswith("cs_test_") or stripe is None:
        if sale_id_param:
            sale = db.session.get(Sale, int(sale_id_param))
            if sale and sale.status == "pending":
                sale.status = "paid"
                sale.paid_at = datetime.utcnow()
                db.session.commit()
        return jsonify({
            "ok": True,
            "mode": "test_simulation",
            "message": "Payment successful (Test Mode)!",
            "session_id": session_id,
            "sale_id": sale_id_param,
        })

    stripe.api_key = api_key
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        sale_id = session.metadata.get("sale_id")
        if sale_id:
            sale = db.session.get(Sale, int(sale_id))
            if sale and sale.status == "pending":
                sale.status = "paid"
                sale.paid_at = datetime.utcnow()
                sale.payment_id = session.payment_intent
                db.session.commit()

        return jsonify({
            "ok": True,
            "message": "Payment successful!",
            "session_id": session_id,
            "amount_paid": session.amount_total / 100 if session.amount_total else 0,
        })
    except Exception as e:
        log.error(f"Stripe success handler failed: {e}")
        return jsonify({"error": str(e)}), 500


@stripe_bp.route("/cancel", methods=["GET"])
def cancel():
    """Stripe Checkout cancel callback."""
    return jsonify({
        "ok": False,
        "message": "Payment cancelled",
    })


@stripe_bp.route("/refund", methods=["POST"])
@jwt_required
def refund_sale():
    """Refund a Stripe payment (supports real Stripe + sandbox test mode)."""
    data = request.json or {}
    sale_id = data.get("sale_id")
    if not sale_id:
        return jsonify({"error": "sale_id required"}), 400

    sale = db.session.get(Sale, sale_id)
    if not sale:
        return jsonify({"error": "Sale not found"}), 404

    api_key = current_app.config.get("STRIPE_API_KEY") or os.getenv("STRIPE_API_KEY", "")

    if not api_key or (sale.payment_id and sale.payment_id.startswith("pi_test_")) or stripe is None:
        sale.status = "refunded"
        sale.refunded_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            "ok": True,
            "mode": "test_simulation",
            "refund_id": f"re_test_{uuid.uuid4().hex[:16]}",
            "amount": sale.sold_price,
            "status": "succeeded",
        })

    if not sale.payment_id:
        return jsonify({"error": "No payment_id on sale to refund"}), 400

    stripe.api_key = api_key
    try:
        refund = stripe.Refund.create(
            payment_intent=sale.payment_id,
            reason="requested_by_customer",
        )
        sale.status = "refunded"
        sale.refunded_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "ok": True,
            "refund_id": refund.id,
            "amount": refund.amount / 100,
            "status": refund.status,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400
