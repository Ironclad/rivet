"""
app/services/ai_agent.py - AI Agent with LLM + heuristic fallback
"""
import os
import json
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import requests

from app.models import Treasure, Customer, Sale, Alert
from app.extensions import db

log = logging.getLogger(__name__)


class AIAgent:
    """AI-powered insights, recommendations, and content generation."""

    def __init__(self, config: Dict[str, Any] = None):
        config = config or {}
        self.api_key = config.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
        self.model = config.get("OPENAI_MODEL", "gpt-4o-mini")
        self.session = requests.Session()

    def _llm(self, prompt: str, max_tokens: int = 300) -> Optional[str]:
        """Call OpenAI API. Returns None if not configured or fails."""
        if not self.api_key:
            return None
        try:
            r = self.session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                },
                timeout=20,
            )
            if r.status_code == 200:
                return r.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            log.warning(f"LLM call failed: {e}")
        return None

    # ============ Daily Briefing ============
    def daily_briefing(self) -> Dict[str, Any]:
        """Generate today's insight summary in Arabic."""
        treasures = Treasure.query.filter(Treasure.status.in_(["pending", "analyzed"])).all()
        sales_today = Sale.query.filter(
            Sale.sold_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count()
        high_profit = [t for t in treasures if t.profit_pct and t.profit_pct >= 300]
        by_source = {}
        for t in treasures:
            by_source[t.source] = by_source.get(t.source, 0) + 1

        # Try LLM
        llm_prompt = f"""لخّص وضع كنوز اليوم بالعربية:
- إجمالي الكنوز: {len(treasures)}
- عالية الربح (300%+): {len(high_profit)}
- مبيعات اليوم: {sales_today}
- أفضل فرصة: {high_profit[0].title if high_profit else 'لا يوجد'}

اكتب summary قصير (جملتين) + 3 insights + 2 actions."""
        llm_response = self._llm(llm_prompt, max_tokens=400)

        if llm_response:
            return {
                "ok": True,
                "summary": llm_response,
                "stats": {
                    "treasures_found": len(treasures),
                    "high_profit_count": len(high_profit),
                    "sales_today": sales_today,
                    "by_source": by_source,
                },
                "top_opportunities": [
                    {"id": t.id, "title": t.title, "profit": t.profit_pct}
                    for t in sorted(treasures, key=lambda x: x.profit_pct or 0, reverse=True)[:3]
                ],
                "llm_powered": True,
            }

        # Heuristic fallback
        summary = f"تم اكتشاف {len(treasures)} كنز، {len(high_profit)} منها بربح عالي"
        insights = []
        if high_profit:
            insights.append(f"🔥 {len(high_profit)} كنوز بربح 300%+ اليوم — فرصة استثنائية")
        if sales_today > 0:
            insights.append(f"💰 {sales_today} مبيعات اليوم — momentum جيد")
        if high_profit:
            best = max(high_profit, key=lambda t: t.profit_pct or 0)
            insights.append(f"🎯 أفضل فرصة: {best.title} (ربح {best.profit_pct:.0f}%)")
        actions = [
            "فكّر في ترويج الفرص 300%+ على Twitter/Reddit",
            "تحقق من محافظ الكريبتو الجديدة — بعضها قد يحوي ETH/BTC كبير",
        ]

        return {
            "ok": True,
            "summary": summary,
            "insights": insights,
            "actions": actions,
            "stats": {
                "treasures_found": len(treasures),
                "high_profit_count": len(high_profit),
                "sales_today": sales_today,
                "by_source": by_source,
            },
            "top_opportunities": [
                {"id": t.id, "title": t.title, "profit": t.profit_pct}
                for t in sorted(treasures, key=lambda x: x.profit_pct or 0, reverse=True)[:3]
            ],
            "llm_powered": False,
        }

    # ============ Customer Recommendations ============
    def recommend_for_customer(self, customer_id: int) -> Dict[str, Any]:
        """Recommend treasures matching customer's interest."""
        customer = Customer.query.get(customer_id)
        if not customer:
            return {"ok": False, "error": "Customer not found"}

        # Match by category
        query = Treasure.query.filter(Treasure.status.in_(["pending", "analyzed"]))
        if customer.interest and customer.interest != "general":
            query = query.filter(Treasure.category == customer.interest)

        candidates = query.order_by(Treasure.profit_pct.desc()).limit(10).all()
        # If no category matches, fall back to all
        if not candidates:
            candidates = Treasure.query.filter(
                Treasure.status.in_(["pending", "analyzed"])
            ).order_by(Treasure.profit_pct.desc()).limit(10).all()

        return {
            "ok": True,
            "customer": customer.to_dict(),
            "recommendations": [t.to_dict(include_description=False) for t in candidates],
            "count": len(candidates),
        }

    # ============ Treasure Analysis ============
    def analyze_treasure(self, treasure_id: str) -> Dict[str, Any]:
        """ML + heuristic risk assessment."""
        t = Treasure.query.get(treasure_id)
        if not t:
            return {"ok": False, "error": "Treasure not found"}

        risk = t.risk_score or 0.5
        factors = []
        score = 100

        # Heuristic scoring
        if t.profit_pct and t.profit_pct > 500:
            score -= 30
            factors.append("ربح مرتفع جداً (>500%) — احذر من الاحتيال")
        elif t.profit_pct and t.profit_pct > 300:
            score -= 15
            factors.append("ربح عالٍ — تحقق من المصدر")

        if t.condition == "used" and t.category in ["electronics", "vehicles"]:
            score -= 10
            factors.append("حالة مستعملة في فئة عالية المخاطر")

        if t.risk_score and t.risk_score > 0.3:
            score -= 20
            factors.append(f"Risk score مرتفع: {t.risk_score:.2f}")

        if not t.source_url:
            score -= 15
            factors.append("لا يوجد رابط مصدر للتحقق")

        if t.ml_confidence and t.ml_confidence < 0.7:
            score -= 10
            factors.append("ثقة ML منخفضة في التقييم")

        score = max(0, score)
        verdict = "EXCELLENT" if score >= 80 else "GOOD" if score >= 60 else "RISKY" if score >= 40 else "AVOID"

        # Update treasure
        t.risk_score = risk
        t.status = "analyzed"
        db.session.commit()

        return {
            "ok": True,
            "treasure_id": t.id,
            "title": t.title,
            "score": score,
            "verdict": verdict,
            "risk_factors": factors,
            "estimated_value": t.estimated_value,
            "profit_pct": t.profit_pct,
            "recommendation": "اشترِ" if score >= 70 else "تحقق أكثر" if score >= 40 else "تجنّب",
        }

    # ============ Marketing Content Generation ============
    def generate_marketing_post(self, treasure_id: str, platform: str = "twitter") -> Dict[str, Any]:
        """Generate marketing copy for the treasure."""
        t = Treasure.query.get(treasure_id)
        if not t:
            return {"ok": False, "error": "Treasure not found"}

        # Try LLM
        llm_prompt = f"""Write a {platform} post for this listing:
Title: {t.title}
Category: {t.category}
Asking: ${t.price:,.0f}
Estimated value: ${t.estimated_value:,.0f}
Profit: {t.profit_pct:.0f}%
Location: {t.location}

Make it engaging, include emojis, and a call-to-action. Max 280 chars for Twitter."""
        llm_response = self._llm(llm_prompt, max_tokens=200)

        if llm_response:
            return {
                "ok": True,
                "platform": platform,
                "content": llm_response,
                "llm_powered": True,
            }

        # Heuristic fallback
        templates = {
            "twitter": f"🔥 {t.title[:80]}\n💰 ${t.price:,.0f} → est. ${t.estimated_value:,.0f} ({t.profit_pct:.0f}% ROI)\n📍 {t.location}\n\nDM to buy! #wholesale #liquidation",
            "linkedin": f"Opportunity: {t.title}\n\nAsking ${t.price:,.0f}, estimated value ${t.estimated_value:,.0f} ({t.profit_pct:.0f}% ROI).\n\nCategory: {t.category}\nLocation: {t.location}\n\nContact for details.",
            "reddit": f"[For Sale] {t.title}\n\n- Price: ${t.price:,.0f}\n- Est. value: ${t.estimated_value:,.0f}\n- Margin: {t.profit_pct:.0f}%\n- Location: {t.location}\n\nSerious inquiries only. Will provide photos and documentation.",
            "email": f"Subject: {t.profit_pct:.0f}% ROI opportunity — {t.category}\n\nHi,\n\nI came across {t.title} at ${t.price:,.0f} with an estimated value of ${t.estimated_value:,.0f}.\n\nLocated in {t.location}, this could be a strong addition to your inventory.\n\nReply if interested.\n\nBest",
        }
        content = templates.get(platform, templates["twitter"])

        return {
            "ok": True,
            "platform": platform,
            "content": content,
            "llm_powered": False,
        }

    # ============ Bulk Analyze ============
    def analyze_all_pending(self) -> Dict[str, Any]:
        """Analyze all pending treasures."""
        pending = Treasure.query.filter_by(status="pending").all()
        results = []
        for t in pending:
            r = self.analyze_treasure(t.id)
            results.append(r)
        return {"ok": True, "analyzed_count": len(results), "results": results}

    # ============ Customer Insights ============
    def customer_insights(self) -> Dict[str, Any]:
        """Cluster analysis + LTV + churn signals."""
        customers = Customer.query.all()
        if not customers:
            return {"ok": True, "total": 0}

        ltv_values = [c.lifetime_value or 0 for c in customers]
        avg_ltv = sum(ltv_values) / len(ltv_values) if ltv_values else 0

        # Interest distribution
        interests = {}
        for c in customers:
            interests[c.interest] = interests.get(c.interest, 0) + 1

        # Active in last 30d
        cutoff = datetime.utcnow() - timedelta(days=30)
        active_30d = sum(1 for c in customers if c.last_purchase_at and c.last_purchase_at >= cutoff)

        # Top customers
        top = sorted(customers, key=lambda c: c.lifetime_value or 0, reverse=True)[:5]
        top_list = [{"name": c.name, "spent": c.lifetime_value, "interest": c.interest} for c in top]

        # Suggestions
        suggestions = []
        for c in customers:
            if (c.lifetime_value or 0) > 50000 and (not c.last_purchase_at or c.last_purchase_at < cutoff):
                suggestions.append(f"⚠️ {c.name} عميل VIP لم يشترِ منذ 30+ يوم — تواصل معه")

        return {
            "ok": True,
            "total_customers": len(customers),
            "active_30d": active_30d,
            "avg_ltv": round(avg_ltv, 2),
            "interests": interests,
            "top_customers": top_list,
            "suggestions": suggestions,
        }

    # ============ Price Suggestion ============
    def suggest_price(self, treasure_id: str) -> Dict[str, Any]:
        """Suggest optimal pricing from comparable sales."""
        t = Treasure.query.get(treasure_id)
        if not t:
            return {"ok": False, "error": "Treasure not found"}

        # Find similar sales (same category)
        similar = db.session.query(Sale).join(Treasure).filter(
            Treasure.category == t.category,
            Sale.status == "delivered",
        ).limit(50).all()

        if not similar:
            # Fallback to estimated value
            est = t.estimated_value or t.price * 2
            return {
                "ok": True,
                "treasure_id": t.id,
                "conservative": round(est * 0.7, 2),
                "market": round(est, 2),
                "aggressive": round(est * 1.2, 2),
                "samples": 0,
                "method": "estimated_value_fallback",
            }

        prices = sorted([s.sold_price for s in similar])
        n = len(prices)
        q1 = prices[n // 4]
        q2 = prices[n // 2]
        q3 = prices[3 * n // 4]

        return {
            "ok": True,
            "treasure_id": t.id,
            "conservative": q1,
            "market": q2,
            "aggressive": q3,
            "samples": n,
            "method": "quartile_analysis",
        }
