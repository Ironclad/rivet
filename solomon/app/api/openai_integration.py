"""
app/api/openai_integration.py - Full OpenAI GPT Integration + Smart Bilingual Heuristic Fallback
"""
import os
import logging
import requests
from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import jwt_required
from app.models import Treasure, Sale, Customer
from app.extensions import db

log = logging.getLogger(__name__)
openai_bp = Blueprint("openai", __name__)


def _call_openai_chat(messages, max_tokens=450, temperature=0.7):
    """Call OpenAI Chat Completions API via HTTPS (no external SDK lock-in required)."""
    api_key = current_app.config.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    model = current_app.config.get("OPENAI_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not api_key:
        return None, model, "heuristic_fallback"

    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return {"content": content, "usage": usage}, data.get("model", model), "openai_live"


@openai_bp.route("/status", methods=["GET"])
@jwt_required
def openai_status():
    """Check OpenAI configuration status."""
    api_key = current_app.config.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    model = current_app.config.get("OPENAI_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return jsonify({
        "ok": True,
        "configured": bool(api_key),
        "model": model,
        "mode": "openai_live" if api_key else "heuristic_fallback",
    })


@openai_bp.route("/chat", methods=["POST"])
@jwt_required
def chat():
    """General-purpose AI assistant endpoint with live DB awareness."""
    data = request.json or {}
    messages = data.get("messages", [])
    prompt = data.get("prompt", "")
    if prompt and not messages:
        messages = [{"role": "user", "content": prompt}]

    if not messages:
        return jsonify({"error": "messages or prompt required"}), 400

    try:
        res, model, mode = _call_openai_chat(
            messages=messages,
            max_tokens=data.get("max_tokens", 500),
            temperature=data.get("temperature", 0.7),
        )
        if res:
            return jsonify({
                "ok": True,
                "mode": mode,
                "model": model,
                "content": res["content"],
                "usage": res["usage"],
            })
    except Exception as e:
        log.warning(f"OpenAI live call failed, using smart fallback: {e}")

    # Smart DB-backed fallback response
    treasures_count = Treasure.query.count()
    top_t = Treasure.query.order_by(Treasure.profit_pct.desc()).first()
    user_msg = messages[-1].get("content", "")
    reply = (
        f"🤖 [Solomon AI Assistant] بخصوص سؤالك: «{user_msg[:80]}» — "
        f"يوجد حالياً {treasures_count} فرصة مسجلة في قاعدة البيانات. "
        + (
            f"أعلى فرصة ربحية حالياً هي «{top_t.title}» بسعر شراء ${top_t.price:,.0f} "
            f"وقيمة سوقية مقدرة ${top_t.estimated_value or 0:,.0f} (ربح متوقع {top_t.profit_pct or 0:.1f}%)."
            if top_t else ""
        )
    )
    return jsonify({
        "ok": True,
        "mode": "heuristic_fallback",
        "model": "solomon-heuristic-v4",
        "content": reply,
    })


@openai_bp.route("/analyze-treasure/<treasure_id>", methods=["POST"])
@jwt_required
def analyze_with_gpt(treasure_id):
    """Deep market, risk, and negotiation analysis of a treasure."""
    t = db.session.get(Treasure, treasure_id)
    if not t:
        return jsonify({"error": "Treasure not found"}), 404

    prompt = f"""Analyze this reselling opportunity in 3 short sections:
Title: {t.title}
Category: {t.category}
Condition: {t.condition}
Source: {t.source}
Asking price: ${t.price:,.0f}
ML estimated value: ${t.estimated_value or 0:,.0f}
Profit margin: {t.profit_pct or 0:.1f}%
Location: {t.location}

Provide:
1. Market Demand & Liquidity
2. Risk Factors
3. Recommended Action & Target Buy Price"""

    try:
        res, model, mode = _call_openai_chat(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.5,
        )
        if res:
            return jsonify({
                "ok": True,
                "mode": mode,
                "model": model,
                "treasure_id": t.id,
                "title": t.title,
                "ai_analysis": res["content"],
            })
    except Exception as e:
        log.warning(f"OpenAI analyze fallback: {e}")

    profit_pct = t.profit_pct or 0
    est = t.estimated_value or (t.price * 1.35)
    net_profit = est - t.price
    target_buy = round(t.price * 0.92, 2)
    verdict = "شراء فوري (STRONG BUY)" if profit_pct >= 35 else ("تفاوض (NEGOTIATE)" if profit_pct >= 20 else "مراقبة (HOLD)")

    analysis = (
        f"📊 **تحليل السوق والسيولة ({t.category}):**\n"
        f"الأصل «{t.title}» من مصدر {t.source} في {t.location or 'السوق العالمي'} يُظهر هامش ربح قدره {profit_pct:.1f}% "
        f"(صافي ربح تقديري ${net_profit:,.0f}). الطلب في فئة {t.category} مرتفع حالياً.\n\n"
        f"⚠️ **عوامل المخاطرة:**\n"
        f"• الحالة المعلنة: {t.condition or 'Good'} — يُنصح بالتحقق من الرقم التسلسلي وتكاليف الشحن.\n"
        f"• عمولة المنصة والرسوم المقدرة: ~5-8%.\n\n"
        f"✅ **التوصية النهائية: {verdict}**\n"
        f"• السعر المعروض: ${t.price:,.0f} | السعر المستهدف للتفاوض: ${target_buy:,.0f} | سعر البيع المتوقع: ${est:,.0f}."
    )
    return jsonify({
        "ok": True,
        "mode": "heuristic_fallback",
        "model": "solomon-analyst-v4",
        "treasure_id": t.id,
        "title": t.title,
        "verdict": verdict,
        "target_buy_price": target_buy,
        "ai_analysis": analysis,
    })


@openai_bp.route("/generate-description/<treasure_id>", methods=["POST"])
@jwt_required
def generate_description(treasure_id):
    """Generate a high-converting sales listing description for a treasure."""
    t = db.session.get(Treasure, treasure_id)
    if not t:
        return jsonify({"error": "Treasure not found"}), 404

    data = request.json or {}
    style = data.get("style", "professional")

    prompt = f"""Write a compelling sales listing description for:
Title: {t.title} ({t.category}, Condition: {t.condition})
Estimated Market Value: ${t.estimated_value or 0:,.0f}
Style: {style}"""

    try:
        res, model, mode = _call_openai_chat(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.8,
        )
        if res:
            return jsonify({
                "ok": True,
                "mode": mode,
                "treasure_id": t.id,
                "style": style,
                "description": res["content"],
            })
    except Exception as e:
        log.warning(f"OpenAI description fallback: {e}")

    est = t.estimated_value or round(t.price * 1.4, 2)
    desc = (
        f"✨ **{t.title}** — فرصة استثنائية في فئة {t.category}!\n\n"
        f"الحالة: {t.condition or 'ممتازة'} | الموقع: {t.location or 'متاح للشحن الدولي'}.\n"
        f"تم فحص هذا الأصل وتقييمه عبر محرك Solomon ML بقيمة سوقية تصل إلى ${est:,.0f}. "
        f"متاح الآن للتسليم الفوري مع ضمان التوثيق الكامل والدفع الآمن (Stripe / USDT / تحويل بنكي).\n\n"
        f"📩 تواصل معنا الآن لحجز الأصل قبل نفاد الكمية!"
    )
    return jsonify({
        "ok": True,
        "mode": "heuristic_fallback",
        "treasure_id": t.id,
        "style": style,
        "description": desc,
    })


@openai_bp.route("/customer-email/<int:customer_id>", methods=["POST"])
@jwt_required
def draft_email(customer_id):
    """Draft a personalized sales outreach email/message to a customer."""
    customer = db.session.get(Customer, customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    data = request.json or {}
    purpose = data.get("purpose", "new_offer")

    top_t = Treasure.query.filter(Treasure.status != "sold").order_by(Treasure.profit_pct.desc()).first()

    email_text = (
        f"Subject: عرض خاص لك {customer.name} — فرصة جديدة في {customer.interest or 'الأصول المميزة'}\n\n"
        f"مرحباً {customer.name}،\n\n"
        f"بناءً على اهتمامك السابق بقطاع ({customer.interest or 'الاستثمار'})، رصد نظام Solomon v4.0 اليوم فرصة حصرية قبل طرحها للعامة:\n"
        + (
            f"🔹 **{top_t.title}** — بسعر خاص ${round((top_t.estimated_value or top_t.price * 1.25) * 0.9, 2):,.0f} "
            f"(أقل من التقييم السوقي البالغ ${top_t.estimated_value or 0:,.0f}).\n\n"
            if top_t else ""
        )
        + "هل ترغب في استلام التقرير الفني ورابط الدفع المباشر؟\n\n"
        "مع خالص التحية،\nفريق Solomon AI"
    )
    return jsonify({
        "ok": True,
        "mode": "heuristic_fallback",
        "customer_id": customer_id,
        "customer_name": customer.name,
        "purpose": purpose,
        "email": email_text,
    })
