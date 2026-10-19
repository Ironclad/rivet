"""app/api/admin.py - Admin operations"""
from flask import Blueprint, jsonify, g
from app.services.auth_service import jwt_required
from app.services.ml_service import ml_estimator

admin_bp = Blueprint("admin", __name__)


def admin_required(f):
    from functools import wraps
    @wraps(f)
    @jwt_required
    def wrapper(*args, **kwargs):
        if g.current_user.role not in ("admin", "manager"):
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return wrapper


@admin_bp.route("/ml/train", methods=["POST"])
@admin_required
def train_model():
    """Retrain ML model on latest sales data."""
    result = ml_estimator.train()
    return jsonify(result)


@admin_bp.route("/ml/status", methods=["GET"])
@admin_required
def ml_status():
    """Get ML model status."""
    return jsonify({
        "trained": ml_estimator.trained,
        "model": type(ml_estimator.model).__name__ if ml_estimator.model else None,
    })


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    from app.models import User
    users = User.query.all()
    return jsonify({"users": [u.to_dict() for u in users]})
