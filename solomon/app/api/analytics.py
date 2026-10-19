"""app/api/analytics.py - Analytics dashboards"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app.services.auth_service import jwt_required
from app.models import Treasure, Customer, Sale
from app.extensions import db

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/dashboard", methods=["GET"])
@jwt_required
def dashboard():
    """Top-level KPIs."""
    total_treasures = Treasure.query.count()
    total_customers = Customer.query.count()
    total_sales = Sale.query.count()

    total_revenue = db.session.query(db.func.sum(Sale.sold_price)).scalar() or 0
    total_profit = db.session.query(db.func.sum(Sale.net_profit)).scalar() or 0
    avg_profit_pct = db.session.query(db.func.avg(Sale.net_profit / Sale.sold_price * 100)).filter(Sale.sold_price > 0).scalar() or 0

    return jsonify({
        "ok": True,
        "treasures": {"total": total_treasures},
        "customers": {"total": total_customers},
        "sales": {"total": total_sales},
        "financials": {
            "total_revenue": round(total_revenue, 2),
            "total_profit": round(total_profit, 2),
            "avg_profit_pct": round(avg_profit_pct, 2),
        },
    })


@analytics_bp.route("/sales-by-source", methods=["GET"])
@jwt_required
def sales_by_source():
    """Group sales by treasure source."""
    from sqlalchemy import func
    results = db.session.query(
        Treasure.source, func.count(Sale.id), func.sum(Sale.sold_price)
    ).join(Sale).group_by(Treasure.source).all()
    return jsonify({
        "ok": True,
        "by_source": [
            {"source": s, "count": c, "revenue": round(r or 0, 2)}
            for s, c, r in results
        ],
    })


@analytics_bp.route("/top-customers", methods=["GET"])
@jwt_required
def top_customers():
    """Top 10 customers by LTV."""
    customers = Customer.query.order_by(Customer.lifetime_value.desc()).limit(10).all()
    return jsonify({
        "ok": True,
        "customers": [c.to_dict() for c in customers],
    })


@analytics_bp.route("/treasures-by-category", methods=["GET"])
@jwt_required
def by_category():
    """Group treasures by category."""
    from sqlalchemy import func
    results = db.session.query(
        Treasure.category, func.count(Treasure.id)
    ).group_by(Treasure.category).all()
    return jsonify({
        "ok": True,
        "by_category": [{"category": c, "count": cnt} for c, cnt in results],
    })


@analytics_bp.route("/recent-sales", methods=["GET"])
@jwt_required
def recent_sales():
    """Sales in the last 30 days, grouped by day."""
    cutoff = datetime.utcnow() - timedelta(days=30)
    sales = Sale.query.filter(Sale.sold_at >= cutoff).order_by(Sale.sold_at).all()
    by_day = {}
    for s in sales:
        day = s.sold_at.strftime("%Y-%m-%d")
        by_day[day] = by_day.get(day, 0) + s.sold_price
    return jsonify({
        "ok": True,
        "by_day": [{"date": d, "revenue": round(r, 2)} for d, r in sorted(by_day.items())],
    })
