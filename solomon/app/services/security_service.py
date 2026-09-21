"""
app/services/security_service.py - Security features
PasswordPolicy, FieldEncryption, TwoFactorAuth, SecurityMonitor
"""
import os
import base64
import hashlib
import secrets
import logging
from datetime import datetime
from typing import Tuple, Dict, Any

import pyotp
import qrcode
from io import BytesIO
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.models import User, AuditLog
from app.extensions import db

log = logging.getLogger(__name__)


# ============ Password Policy ============
class PasswordPolicy:
    """Password strength validator + hasher."""

    MIN_LENGTH = 12

    @classmethod
    def validate(cls, password: str) -> Dict[str, Any]:
        """Return {'valid': bool, 'strength': 0-100, 'error': str, 'issues': []}"""
        issues = []
        score = 0

        if not password:
            return {"valid": False, "strength": 0, "error": "Password required", "issues": ["empty"]}

        # Length (max 40 points)
        length = len(password)
        if length < cls.MIN_LENGTH:
            issues.append(f"too_short (min {cls.MIN_LENGTH})")
        score += min(40, length * 3)

        # Has uppercase
        if any(c.isupper() for c in password):
            score += 15
        else:
            issues.append("missing_uppercase")

        # Has lowercase
        if any(c.islower() for c in password):
            score += 15
        else:
            issues.append("missing_lowercase")

        # Has digit
        if any(c.isdigit() for c in password):
            score += 15
        else:
            issues.append("missing_digit")

        # Has special
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 15
        else:
            issues.append("missing_special")

        # Penalty for common patterns
        if password.lower() in ["password", "123456", "qwerty", "admin", "changeme"]:
            score = 10
            issues.append("common_password")

        score = min(100, max(0, score))
        # Too short ALWAYS fails regardless of score
        too_short = "too_short" in str(issues)
        valid = (score >= 60 and len(issues) <= 1) and not too_short

        return {
            "valid": valid,
            "strength": score,
            "error": "" if valid else "; ".join(issues),
            "issues": issues,
        }


# ============ Field Encryption (Fernet) ============
class FieldEncryption:
    """AES-128-CBC + HMAC encryption via Fernet, PBKDF2 key derivation."""

    @staticmethod
    def _get_key() -> bytes:
        """Derive encryption key from SECRET_KEY using PBKDF2."""
        secret = os.getenv("SECRET_KEY", "solomon-dev-secret")
        salt = b"solomon-fixed-salt-v1"  # In prod: per-field random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100_000,
        )
        return base64.urlsafe_b64encode(kdf.derive(secret.encode()))

    @staticmethod
    def encrypt(plaintext: str) -> str:
        if not plaintext:
            return ""
        f = Fernet(FieldEncryption._get_key())
        return f.encrypt(plaintext.encode()).decode()

    @staticmethod
    def decrypt(ciphertext: str) -> str:
        if not ciphertext:
            return ""
        try:
            f = Fernet(FieldEncryption._get_key())
            return f.decrypt(ciphertext.encode()).decode()
        except Exception as e:
            log.error(f"Decryption failed: {e}")
            return ""


# ============ 2FA (TOTP) ============
class TwoFactorAuth:
    """TOTP-based 2FA compatible with Google Authenticator, Authy, etc."""

    @staticmethod
    def generate_secret() -> str:
        """Generate random base32 secret."""
        return pyotp.random_base32()

    @staticmethod
    def get_qr_code(secret: str, username: str, issuer: str = "Solomon") -> str:
        """Return base64-encoded PNG QR code."""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=username, issuer_name=issuer
        )
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        # Convert to PNG bytes
        try:
            from PIL import Image
            buf = BytesIO()
            img.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode()
        except Exception:
            # Fallback: try direct PNG
            buf = BytesIO()
            if hasattr(img, "save"):
                img.save(buf)
            else:
                # older qrcode API
                img.get_image().save(buf)
            return base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """Verify 6-digit TOTP code (allows 30s window drift)."""
        if not secret or not code:
            return False
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)

    @staticmethod
    def enable_for_user(user: User) -> Dict[str, Any]:
        """Generate secret + QR for user. User must verify before activate."""
        secret = TwoFactorAuth.generate_secret()
        user.two_factor_secret = secret
        # DON'T enable yet — wait for verify
        db.session.commit()
        return {
            "secret": secret,
            "qr_code": TwoFactorAuth.get_qr_code(secret, user.username),
            "issuer": "Solomon",
        }

    @staticmethod
    def confirm_enable(user: User, code: str) -> bool:
        """Confirm 2FA activation with valid code."""
        if not user.two_factor_secret:
            return False
        if not TwoFactorAuth.verify_code(user.two_factor_secret, code):
            return False
        user.two_factor_enabled = True
        db.session.commit()
        return True

    @staticmethod
    def disable_for_user(user: User, code: str) -> bool:
        """Disable 2FA — requires current valid code."""
        if not user.two_factor_enabled or not user.two_factor_secret:
            return True  # already off
        if not TwoFactorAuth.verify_code(user.two_factor_secret, code):
            return False
        user.two_factor_enabled = False
        user.two_factor_secret = None
        db.session.commit()
        return True


# ============ Security Monitor ============
class SecurityMonitor:
    """Brute-force detection + audit log queries."""

    BRUTE_FORCE_WINDOW_MIN = 15
    BRUTE_FORCE_THRESHOLD = 5

    @classmethod
    def record_failed_login(cls, user: User, ip: str = None):
        """Record failed login + check for brute force."""
        user.failed_login_count = (user.failed_login_count or 0) + 1
        log_entry = AuditLog(
            user_id=user.id,
            action="login_failed",
            entity_type="user",
            entity_id=str(user.id),
            ip_address=ip,
        )
        db.session.add(log_entry)

        if user.failed_login_count >= cls.BRUTE_FORCE_THRESHOLD:
            from datetime import timedelta
            user.locked_until = datetime.utcnow() + timedelta(minutes=cls.BRUTE_FORCE_WINDOW_MIN)
            log.warning(f"Brute force detected: user={user.username} count={user.failed_login_count}")
        db.session.commit()

    @classmethod
    def get_recent_failed_logins(cls, user_id: int = None, minutes: int = 60) -> int:
        """Count failed logins in recent window."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        q = AuditLog.query.filter(
            AuditLog.action == "login_failed",
            AuditLog.created_at >= cutoff,
        )
        if user_id:
            q = q.filter(AuditLog.user_id == user_id)
        return q.count()
