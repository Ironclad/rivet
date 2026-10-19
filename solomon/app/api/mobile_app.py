"""
app/api/mobile_app.py - Mobile App (iOS/Android) Backend API + Instant Flip Calculator + Commission Contract Generator
"""
import io
import base64
import uuid
from datetime import datetime
import qrcode
from flask import Blueprint, request, jsonify
from app.services.auth_service import jwt_required
from app.models import Treasure, Customer, Sale
from app.extensions import db

mobile_bp = Blueprint("mobile_app", __name__)


@mobile_bp.route("/summary", methods=["GET"])
@jwt_required
def mobile_summary():
    """Single-request mobile payload for fast iOS & Android startup."""
    treasures = (
        Treasure.query.filter(Treasure.status != "sold")
        .order_by(Treasure.profit_pct.desc())
        .limit(8)
        .all()
    )
    customers = Customer.query.limit(8).all()
    sales = Sale.query.order_by(Sale.sold_at.desc()).limit(6).all()

    total_rev = sum(s.sold_price or 0 for s in Sale.query.all())
    total_profit = sum(s.profit or 0 for s in Sale.query.all())

    return jsonify({
        "ok": True,
        "app_version": "4.1.0-mobile",
        "kpis": {
            "total_revenue": round(total_rev, 2),
            "total_profit": round(total_profit, 2),
            "active_deals": len(treasures),
            "vip_buyers": len(customers),
        },
        "deals": [
            {
                "id": t.id,
                "title": t.title,
                "category": t.category,
                "source": t.source,
                "location": t.location,
                "price": t.price,
                "estimated_value": t.estimated_value,
                "profit_pct": round(t.profit_pct or 0, 1),
                "net_profit": round((t.estimated_value or t.price * 1.3) - t.price, 2),
            }
            for t in treasures
        ],
        "buyers": [
            {
                "id": c.id,
                "name": c.name,
                "interest": c.interest,
                "country": c.country,
                "phone": c.phone or "+966500000001",
            }
            for c in customers
        ],
        "recent_sales": [
            {
                "id": s.id,
                "invoice": s.invoice_number,
                "amount": s.sold_price,
                "profit": s.profit,
                "status": s.status,
                "method": s.payment_method,
            }
            for s in sales
        ],
    })


@mobile_bp.route("/instant-calculator", methods=["POST"])
@jwt_required
def instant_calculator():
    """
    AI Instant Flip & Negotiation Calculator:
    Calculates market value, platform/shipping fees, net profit, and generates a ready-to-send
    negotiation message to get a 12-20% discount from the seller.
    """
    data = request.json or {}
    title = data.get("title", "أصل استثماري")
    category = data.get("category", "Electronics")
    asking_price = float(data.get("asking_price") or 1000)
    condition = data.get("condition", "Good")

    multipliers = {
        "Watches": 1.42,
        "Vehicles": 1.35,
        "Electronics": 1.32,
        "Industrial": 1.48,
        "Real Estate": 1.28,
        "Jewelry": 1.45,
    }
    mult = multipliers.get(category, 1.35)
    if condition.lower() in ("mint", "new", "excellent"):
        mult += 0.08

    estimated_market_value = round(asking_price * mult, 2)
    target_negotiated_buy = round(asking_price * 0.85, 2)
    estimated_fees = round(estimated_market_value * 0.06, 2)
    net_profit_at_asking = round(estimated_market_value - asking_price - estimated_fees, 2)
    net_profit_if_negotiated = round(estimated_market_value - target_negotiated_buy - estimated_fees, 2)
    roi_pct = round((net_profit_if_negotiated / max(target_negotiated_buy, 1)) * 100, 1)

    seller_negotiation_msg = (
        f"السلام عليكم، بخصوص المعروض ({title})، أنا مشتري جاد وجاهز للدفع النقدي/الفوري اليوم. "
        f"بعد مراجعة أسعار السوق الحالية وتكاليف النقل، أستطيع تخليص الصفقة معك فوراً بسعر ${target_negotiated_buy:,.0f}. "
        f"إذا يناسبك أرسل لي بيانات الدفع أو الموقع وننهي الإجراءات خلال ساعة."
    )

    return jsonify({
        "ok": True,
        "title": title,
        "category": category,
        "asking_price": asking_price,
        "target_negotiated_buy": target_negotiated_buy,
        "estimated_market_value": estimated_market_value,
        "estimated_fees": estimated_fees,
        "net_profit_at_asking": net_profit_at_asking,
        "net_profit_if_negotiated": net_profit_if_negotiated,
        "roi_pct": roi_pct,
        "verdict": "صفقة ذهبية 🔥 (اشترِ فوراً)" if roi_pct >= 35 else "صفقة مربحة ✅ (تفاوض أولاً)",
        "seller_negotiation_message": seller_negotiation_msg,
    })


@mobile_bp.route("/generate-contract", methods=["POST"])
@jwt_required
def generate_contract():
    """Generate an instant Brokerage / Commission Agreement & Invoice to protect broker commission."""
    data = request.json or {}
    treasure_id = data.get("treasure_id")
    customer_id = data.get("customer_id")
    commission_pct = float(data.get("commission_pct") or 10.0)

    t = db.session.get(Treasure, treasure_id) if treasure_id else Treasure.query.first()
    c = db.session.get(Customer, customer_id) if customer_id else Customer.query.first()

    if not t or not c:
        return jsonify({"error": "Deal or customer not found"}), 404

    deal_amount = round(t.estimated_value or (t.price * 1.3), 2)
    commission_usd = round(deal_amount * (commission_pct / 100.0), 2)
    contract_ref = f"SLM-CNTR-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    contract_text = (
        f"📜 وثيقة اتفاق وساطة وحفظ عمولة رقم: {contract_ref}\n"
        f"التاريخ: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"• الطرف الأول (الوسيط / المنصة): Solomon AI Brokerage\n"
        f"• الطرف الثاني (المشتري): {c.name} ({c.country or 'International'})\n"
        f"• الأصل محل الصفقة: {t.title} (الفئة: {t.category})\n"
        f"• القيمة الإجمالية المتفق عليها: ${deal_amount:,.2f} USD\n"
        f"• نسبة عمولة الوساطة المستحقة: {commission_pct:.1f}% (${commission_usd:,.2f} USD)\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"يقر الطرف الثاني باستلام بيانات الصفقة عبر منصة Solomon AI وبالتزامه بسداد القيمة أو العمولة المحددة عبر Stripe أو USDT فور إتمام المطابقة."
    )

    return jsonify({
        "ok": True,
        "contract_ref": contract_ref,
        "deal_title": t.title,
        "buyer_name": c.name,
        "deal_amount": deal_amount,
        "commission_pct": commission_pct,
        "commission_usd": commission_usd,
        "contract_text": contract_text,
    })


@mobile_bp.route("/qr", methods=["GET"])
def mobile_qr():
    """Generate a QR code for opening the mobile web app on iOS/Android."""
    url = request.args.get("url") or (request.host_url.rstrip("/") + "/mobile.html")
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return jsonify({
        "ok": True,
        "url": url,
        "qr_base64": f"data:image/png;base64,{b64}",
    })
