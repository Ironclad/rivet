"""app/api/__init__.py - Register all blueprints"""
from flask import Flask


def register_blueprints(app: Flask):
    from app.api.auth import auth_bp
    from app.api.treasures import treasures_bp
    from app.api.sales import sales_bp
    from app.api.customers import customers_bp
    from app.api.analytics import analytics_bp
    from app.api.admin import admin_bp
    from app.api.export import export_bp
    from app.api.webhooks import webhooks_bp
    from app.api.security import security_bp
    from app.api.payments import payments_bp
    from app.api.ai_agent import ai_bp
    from app.api.stripe_integration import stripe_bp
    from app.api.openai_integration import openai_bp
    from app.api.whatsapp_integration import whatsapp_bp
    from app.api.mobile_app import mobile_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v3/auth")
    app.register_blueprint(treasures_bp, url_prefix="/api/v3/treasures")
    app.register_blueprint(sales_bp, url_prefix="/api/v3/sales")
    app.register_blueprint(customers_bp, url_prefix="/api/v3/customers")
    app.register_blueprint(analytics_bp, url_prefix="/api/v3/analytics")
    app.register_blueprint(admin_bp, url_prefix="/api/v3/admin")
    app.register_blueprint(export_bp, url_prefix="/api/v3/export")
    app.register_blueprint(webhooks_bp, url_prefix="/api/v3/webhooks")
    app.register_blueprint(security_bp, url_prefix="/api/v3/security")
    app.register_blueprint(payments_bp, url_prefix="/api/v3/payments")
    app.register_blueprint(ai_bp, url_prefix="/api/v3/ai")
    app.register_blueprint(stripe_bp, url_prefix="/api/v3/stripe")
    app.register_blueprint(openai_bp, url_prefix="/api/v3/openai")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/v3/whatsapp")
    app.register_blueprint(mobile_bp, url_prefix="/api/v3/mobile")
