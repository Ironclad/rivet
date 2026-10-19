"""app/api/auth.py - Authentication endpoints"""
from flask import Blueprint, request, jsonify, g
from app.services.auth_service import login_user, jwt_required
from app.models import User, AuditLog
from app.extensions import db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    result, error = login_user(username, password, request.remote_addr)
    if error:
        # Log failed attempt
        log = AuditLog(
            action="login_failed", entity_type="user", entity_id=username,
            ip_address=request.remote_addr,
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"error": error}), 401

    # Log success
    log = AuditLog(
        user_id=result["user"]["id"],
        action="login_success", entity_type="user",
        entity_id=username, ip_address=request.remote_addr,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify(result)


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    return jsonify(g.current_user.to_dict())


@auth_bp.route("/api-key", methods=["POST"])
@jwt_required
def rotate_api_key():
    """Generate a new API key for the current user."""
    new_key = g.current_user.generate_api_key()
    db.session.commit()
    return jsonify({"api_key": new_key})
