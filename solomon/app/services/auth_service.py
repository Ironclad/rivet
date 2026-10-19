"""
app/services/auth_service.py - JWT authentication
"""
import jwt
import logging
from datetime import datetime
from functools import wraps
from flask import request, jsonify, g, current_app

from app.models import User, AuditLog
from app.extensions import db

log = logging.getLogger(__name__)


def jwt_required(f):
    """Decorator: require valid JWT in Authorization header."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth[7:]
        try:
            payload = jwt.decode(
                token, current_app.config["JWT_SECRET"],
                algorithms=["HS256"]
            )
            user = User.query.get(payload["user_id"])
            if not user or not user.active:
                return jsonify({"error": "User not found or inactive"}), 401

            # 2FA check (if enabled, requires x-2fa-code header)
            if user.two_factor_enabled:
                import pyotp
                code = request.headers.get("X-2FA-Code", "")
                totp = pyotp.TOTP(user.two_factor_secret)
                if not totp.verify(code, valid_window=1):
                    return jsonify({"error": "Invalid 2FA code"}), 401

            g.current_user = user
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Invalid token: {e}"}), 401

    return wrapper


def create_token(user: User) -> str:
    """Create JWT for user."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.utcnow() + current_app.config["JWT_EXPIRY"],
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def login_user(username: str, password: str, ip: str = None):
    """Authenticate user and return token + user data."""
    user = User.query.filter_by(username=username).first()
    if not user:
        log.warning(f"Login failed (no user): {username} from {ip}")
        return None, "Invalid credentials"

    if not user.active:
        return None, "Account disabled"

    # Check lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        return None, f"Account locked until {user.locked_until.isoformat()}"

    if not user.check_password(password):
        user.failed_login_count = (user.failed_login_count or 0) + 1
        if user.failed_login_count >= 5:
            from datetime import timedelta
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            log.warning(f"User {username} locked after {user.failed_login_count} failed attempts")
        db.session.commit()
        return None, "Invalid credentials"

    # Success — reset counters
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_token(user)
    log.info(f"User logged in: {username}")
    return {"token": token, "user": user.to_dict()}, None
