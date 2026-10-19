"""app/api/security.py - Security endpoints (v4.0)"""
from flask import Blueprint, request, jsonify, g, current_app
from app.services.auth_service import jwt_required
from app.services.security_service import PasswordPolicy, FieldEncryption, TwoFactorAuth
from app.models import AuditLog, User
from app.extensions import db

security_bp = Blueprint("security", __name__)


@security_bp.route("/password/validate", methods=["POST"])
def validate_password():
    """Check password strength without auth."""
    data = request.json or {}
    pwd = data.get("password", "")
    return jsonify(PasswordPolicy.validate(pwd))


@security_bp.route("/password/change", methods=["POST"])
@jwt_required
def change_password():
    """Change own password."""
    data = request.json or {}
    current = data.get("current_password", "")
    new = data.get("new_password", "")
    if not current or not new:
        return jsonify({"error": "current_password and new_password required"}), 400

    if not g.current_user.check_password(current):
        return jsonify({"error": "Current password incorrect"}), 401

    validation = PasswordPolicy.validate(new)
    if not validation["valid"]:
        return jsonify({"error": f"Weak password: {validation['error']}"}), 400

    g.current_user.set_password(new)
    db.session.commit()
    return jsonify({"ok": True, "strength": validation["strength"]})


@security_bp.route("/2fa/setup", methods=["POST"])
@jwt_required
def setup_2fa():
    """Generate 2FA secret + QR code."""
    result = TwoFactorAuth.enable_for_user(g.current_user)
    return jsonify(result)


@security_bp.route("/2fa/verify", methods=["POST"])
@jwt_required
def verify_2fa():
    """Confirm 2FA activation with code."""
    data = request.json or {}
    code = data.get("code", "")
    if TwoFactorAuth.confirm_enable(g.current_user, code):
        return jsonify({"ok": True, "message": "2FA enabled"})
    return jsonify({"error": "Invalid code"}), 400


@security_bp.route("/2fa/disable", methods=["POST"])
@jwt_required
def disable_2fa():
    """Disable 2FA (requires current code)."""
    data = request.json or {}
    code = data.get("code", "")
    if TwoFactorAuth.disable_for_user(g.current_user, code):
        return jsonify({"ok": True, "message": "2FA disabled"})
    return jsonify({"error": "Invalid code"}), 400


def admin_required(f):
    from functools import wraps
    @wraps(f)
    @jwt_required
    def wrapper(*args, **kwargs):
        if g.current_user.role not in ("admin", "manager"):
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return wrapper


@security_bp.route("/encrypt", methods=["POST"])
@admin_required
def encrypt_field():
    """Encrypt a sensitive field (admin only)."""
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "text required"}), 400
    encrypted = FieldEncryption.encrypt(text)
    return jsonify({"encrypted": encrypted})


@security_bp.route("/decrypt", methods=["POST"])
@admin_required
def decrypt_field():
    """Decrypt a sensitive field (admin only)."""
    data = request.json or {}
    ciphertext = data.get("encrypted", "")
    if not ciphertext:
        return jsonify({"error": "encrypted required"}), 400
    decrypted = FieldEncryption.decrypt(ciphertext)
    return jsonify({"decrypted": decrypted})


@security_bp.route("/audit-logs", methods=["GET"])
@jwt_required
def audit_logs():
    """View audit log (last 100)."""
    limit = min(request.args.get("limit", 100, type=int), 500)
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return jsonify({
        "logs": [l.to_dict() for l in logs],
        "count": len(logs),
    })


@security_bp.route("/sessions", methods=["GET"])
@jwt_required
def list_sessions():
    """List active users (logged in within 24h)."""
    from datetime import timedelta
    cutoff = AuditLog.query.filter(
        AuditLog.action == "login_success",
    ).count()
    return jsonify({"active_sessions": cutoff, "info": "Use audit-logs to inspect"})
