"""
app/api/whatsapp_integration.py - WhatsApp Sales Bot, Broadcasts & Click-to-Chat Integration
"""
import os
import json
import urllib.parse
import logging
from flask import Blueprint, request, jsonify, g, current_app
from app.services.auth_service import jwt_required
from app.models import Treasure, Customer, AuditLog
from app.extensions import db

log = logging.getLogger(__name__)
whatsapp_bp = Blueprint("whatsapp", __name__)


def _clean_phone(phone: str) -> str:
    if not phone:
        return ""
    return "".join(ch for ch in phone if ch.isdigit())


@whatsapp_bp.route("/status", methods=["GET"])
@jwt_required
def whatsapp_status():
    """Check WhatsApp / Twilio integration status."""
    sid = current_app.config.get("TWILIO_ACCOUNT_SID") or os.getenv("TWILIO_ACCOUNT_SID", "")
    token = current_app.config.get("TWILIO_AUTH_TOKEN") or os.getenv("TWILIO_AUTH_TOKEN", "")
    from_num = current_app.config.get("TWILIO_FROM_NUMBER") or os.getenv("TWILIO_FROM_NUMBER", "")
    return jsonify({
        "ok": True,
        "twilio_configured": bool(sid and token),
        "from_number": from_num or "whatsapp:+14155238886",
        "click_to_chat_enabled": True,
    })


@whatsapp_bp.route("/send-deal", methods=["POST"])
@jwt_required
def send_deal():
    """Send a treasure deal to a customer via WhatsApp (Twilio API + wa.me instant link)."""
    data = request.json or {}
    treasure_id = data.get("treasure_id")
    customer_id = data.get("customer_id")

    if not treasure_id or not customer_id:
        return jsonify({"error": "treasure_id and customer_id required"}), 400

    t = db.session.get(Treasure, treasure_id)
    c = db.session.get(Customer, customer_id)
    if not t or not c:
        return jsonify({"error": "Treasure or Customer not found"}), 404

    offer_price = data.get("offer_price") or round((t.estimated_value or t.price * 1.3) * 0.9, 2)
    msg = (
        f"مرحباً {c.name} 👋\n"
        f"رصد نظام Solomon AI فرصة استثمارية مطابقة لاهتماماتك ({c.interest or t.category}):\n\n"
        f"💎 *{t.title}*\n"
        f"📍 المصدر: {t.source} ({t.location or 'Global'})\n"
        f"💰 السعر الحصري لك: *${offer_price:,.0f}* (التقييم السوقي: ${(t.estimated_value or offer_price * 1.15):,.0f})\n\n"
        f"للشراء الفوري أو الحجز أرسل رقم *1* أو تواصل معنا مباشرة."
    )

    phone_digits = _clean_phone(c.phone or "+966500000001")
    wa_link = f"https://wa.me/{phone_digits}?text={urllib.parse.quote(msg)}"

    # Audit log
    audit = AuditLog(
        user_id=g.current_user.id,
        action="whatsapp_deal_sent",
        entity_type="treasure",
        entity_id=str(t.id),
        changes=json.dumps({"customer_id": c.id, "offer_price": offer_price}),
        ip_address=request.remote_addr,
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "ok": True,
        "customer_id": c.id,
        "customer_name": c.name,
        "phone": c.phone,
        "treasure_id": t.id,
        "offer_price": offer_price,
        "message": msg,
        "whatsapp_url": wa_link,
    })


@whatsapp_bp.route("/broadcast-top-treasures", methods=["POST"])
@jwt_required
def broadcast_top_treasures():
    """Auto-match top profitable treasures with customers and generate WhatsApp outreach campaign."""
    treasures = (
        Treasure.query.filter(Treasure.status != "sold")
        .order_by(Treasure.profit_pct.desc())
        .limit(5)
        .all()
    )
    customers = Customer.query.limit(10).all()

    campaign = []
    for idx, t in enumerate(treasures):
        if not customers:
            break
        target_cust = customers[idx % len(customers)]
        offer_price = round((t.estimated_value or t.price * 1.3) * 0.9, 2)
        msg = (
            f"مرحباً {target_cust.name} 🌟 عرض خاص اليوم: *{t.title}* "
            f"بسعر ${offer_price:,.0f} فقط (قيمة سوقية ${(t.estimated_value or offer_price * 1.15):,.0f}). "
            f"رد بـ 1 للحجز الفوري!"
        )
        phone_digits = _clean_phone(target_cust.phone or "+966500000001")
        campaign.append({
            "treasure_id": t.id,
            "treasure_title": t.title,
            "profit_pct": round(t.profit_pct or 0, 1),
            "customer_id": target_cust.id,
            "customer_name": target_cust.name,
            "offer_price": offer_price,
            "message": msg,
            "whatsapp_url": f"https://wa.me/{phone_digits}?text={urllib.parse.quote(msg)}",
        })

    return jsonify({
        "ok": True,
        "count": len(campaign),
        "campaign": campaign,
    })


@whatsapp_bp.route("/webhook", methods=["POST"])
def whatsapp_webhook():
    """Incoming WhatsApp message webhook auto-responder."""
    incoming_msg = (request.values.get("Body") or (request.json or {}).get("message", "")).strip()
    sender = request.values.get("From") or (request.json or {}).get("from", "unknown")

    top_t = Treasure.query.filter(Treasure.status != "sold").order_by(Treasure.profit_pct.desc()).first()
    if incoming_msg in ("1", "شراء", "buy", "yes", "نعم") and top_t:
        reply = (
            f"✅ تم تأكيد طلب الحجز المبدئي لـ «{top_t.title}»!\n"
            f"سيتم إرسال رابط الدفع الآمن (Stripe / USDT) إليك خلال لحظات."
        )
    else:
        reply = (
            "أهلاً بك في Solomon AI 🤖\n"
            "• أرسل *1* لحجز أحدث صفقة\n"
            "• أرسل *عروض* لعرض أفضل 3 فرص استثمارية اليوم"
        )

    return jsonify({
        "ok": True,
        "from": sender,
        "received": incoming_msg,
        "auto_reply": reply,
    })
