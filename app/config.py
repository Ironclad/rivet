"""
app/config.py - Application configuration
"""
import os
from datetime import timedelta


class Config:
    # Core
    SECRET_KEY = os.getenv("SECRET_KEY", "solomon-dev-secret-change-in-prod")
    JWT_SECRET = os.getenv("JWT_SECRET", "jwt-secret-change-in-prod-32bytes")
    JWT_EXPIRY = timedelta(hours=24)
    JWT_REFRESH_EXPIRY = timedelta(days=30)

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///solomon.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API limits
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_DEFAULT = "200 per minute"

    # OpenAI / AI Agent
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Payments
    STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    CRYPTO_BTC_ADDRESS = os.getenv("CRYPTO_BTC_ADDRESS", "")
    CRYPTO_ETH_ADDRESS = os.getenv("CRYPTO_ETH_ADDRESS", "")
    CRYPTO_USDT_ADDRESS = os.getenv("CRYPTO_USDT_ADDRESS", "")
    CRYPTO_USDC_ADDRESS = os.getenv("CRYPTO_USDC_ADDRESS", "")
    BANK_NAME = os.getenv("BANK_NAME", "Solomon Bank")
    BANK_ACCOUNT_NAME = os.getenv("BANK_ACCOUNT_NAME", "Solomon LLC")
    BANK_ACCOUNT_NUMBER = os.getenv("BANK_ACCOUNT_NUMBER", "000000000")
    BANK_ROUTING = os.getenv("BANK_ROUTING", "000000000")
    BANK_SWIFT = os.getenv("BANK_SWIFT", "SOLOMONUS")

    # 2FA
    TOTP_ISSUER = os.getenv("TOTP_ISSUER", "Solomon")

    # Communication
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

    # External APIs
    GOVDEALS_API_KEY = os.getenv("GOVDEALS_API_KEY", "")
    CRYPTOPANIC_API_KEY = os.getenv("CRYPTOPANIC_API_KEY", "")

    # Feature flags
    ENABLE_SCHEDULER = os.getenv("ENABLE_SCHEDULER", "true").lower() == "true"
    ENABLE_WEBSOCKET = os.getenv("ENABLE_WEBSOCKET", "true").lower() == "true"


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    ENABLE_SCHEDULER = False
    TELEGRAM_BOT_TOKEN = ""
    JWT_SECRET = "test-jwt-secret-32-bytes-minimum-aaa"
