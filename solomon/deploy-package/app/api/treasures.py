"""app/api/treasures.py - Treasure management"""
from flask import Blueprint, request, jsonify, g
from app.services.auth_service import jwt_required
from app.models import Treasure, Alert
from app.extensions import db
from app.services.ml_service import ml_estimator

treasures_bp = Blueprint("treasures", __name__)


@treasures_bp.route("", methods=["GET"])
@jwt_required
def list_treasures():
    """List treasures with filters, sorting, pagination."""
    query = Treasure.query

    # Filters
    category = request.args.get("category")
    source = request.args.get("source")
    status = request.args.get("status")
    min_profit = request.args.get("min_profit", type=float)

    if category:
        query = query.filter(Treasure.category == category)
    if source:
        query = query.filter(Treasure.source == source)
    if status:
        query = query.filter(Treasure.status == status)
    if min_profit is not None:
        query = query.filter(Treasure.profit_pct >= min_profit)

    # Sort
    sort = request.args.get("sort", "-profit_pct")
    if sort.startswith("-"):
        query = query.order_by(getattr(Treasure, sort[1:]).desc())
    else:
        query = query.order_by(getattr(Treasure, sort))

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("limit", 20, type=int), 100)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [t.to_dict(include_description=False) for t in pagination.items],
        "page": page,
        "per_page": per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    })


@treasures_bp.route("/<treasure_id>", methods=["GET"])
@jwt_required
def get_treasure(treasure_id):
    t = Treasure.query.get(treasure_id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    return jsonify(t.to_dict())


@treasures_bp.route("", methods=["POST"])
@jwt_required
def create_treasure():
    """Create a new treasure and auto-estimate value."""
    data = request.json or {}
    required = ["id", "title", "price"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"Missing field: {f}"}), 400

    t = Treasure(
        id=data["id"],
        title=data["title"],
        description=data.get("description"),
        category=data.get("category", "general"),
        condition=data.get("condition", "used"),
        source=data.get("source", "manual"),
        source_url=data.get("source_url"),
        location=data.get("location"),
        price=float(data["price"]),
        status="pending",
    )
    db.session.add(t)
    db.session.commit()

    # Auto-estimate
    est = ml_estimator.estimate(t)
    if est.get("ok"):
        t.estimated_value = est["estimated_value"]
        t.profit_pct = est["profit_pct"]
        t.ml_confidence = est["confidence"]
        t.status = "analyzed"
        db.session.commit()

    return jsonify(t.to_dict()), 201


@treasures_bp.route("/<treasure_id>/estimate", methods=["POST"])
@jwt_required
def estimate_treasure(treasure_id):
    """Re-run ML estimation for a treasure."""
    t = Treasure.query.get(treasure_id)
    if not t:
        return jsonify({"error": "Not found"}), 404

    est = ml_estimator.estimate(t)
    if est.get("ok"):
        t.estimated_value = est["estimated_value"]
        t.profit_pct = est["profit_pct"]
        t.ml_confidence = est["confidence"]
        t.status = "analyzed"
        db.session.commit()
        return jsonify(est)
    return jsonify(est), 400


@treasures_bp.route("/scan", methods=["POST"])
@jwt_required
def scan_sources():
    """Trigger a manual scan of sources for new treasures."""
    # Placeholder — in production this would call GovDeals + Crypto APIs
    return jsonify({
        "ok": True,
        "message": "Scan triggered",
        "new_treasures": 0,
    })
