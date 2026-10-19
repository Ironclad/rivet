"""app/api/ai_agent.py - AI Agent endpoints (v4.0)"""
from flask import Blueprint, jsonify, g
from app.services.auth_service import jwt_required
from app.services.ai_agent import AIAgent

ai_bp = Blueprint("ai", __name__)


def _agent():
    from flask import current_app
    return AIAgent(current_app.config)


@ai_bp.route("/briefing", methods=["GET"])
@jwt_required
def daily_briefing():
    return jsonify(_agent().daily_briefing())


@ai_bp.route("/analyze/<treasure_id>", methods=["GET"])
@jwt_required
def analyze_treasure(treasure_id):
    return jsonify(_agent().analyze_treasure(treasure_id))


@ai_bp.route("/recommendations/<int:customer_id>", methods=["GET"])
@jwt_required
def recommend(customer_id):
    return jsonify(_agent().recommend_for_customer(customer_id))


@ai_bp.route("/analyze-all", methods=["POST"])
@jwt_required
def analyze_all():
    """Bulk analyze pending treasures (admin only)."""
    if g.current_user.role not in ("admin", "manager"):
        return jsonify({"error": "Admin required"}), 403
    return jsonify(_agent().analyze_all_pending())


@ai_bp.route("/marketing/<treasure_id>", methods=["POST"])
@jwt_required
def marketing(treasure_id):
    from flask import request
    platform = request.json.get("platform", "twitter") if request.json else "twitter"
    return jsonify(_agent().generate_marketing_post(treasure_id, platform))


@ai_bp.route("/customer-insights", methods=["GET"])
@jwt_required
def customer_insights():
    return jsonify(_agent().customer_insights())


@ai_bp.route("/price-suggestion/<treasure_id>", methods=["GET"])
@jwt_required
def price_suggestion(treasure_id):
    return jsonify(_agent().suggest_price(treasure_id))
