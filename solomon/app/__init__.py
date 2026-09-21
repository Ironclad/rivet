"""
app/__init__.py - Application factory
"""
import logging
import os
from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, migrate, cors, limiter, socketio


def create_app(config_class=None):
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class or Config)

    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    limiter.init_app(app)

    if app.config["ENABLE_WEBSOCKET"]:
        socketio.init_app(app)

    # Register blueprints
    from app.api import register_blueprints
    register_blueprints(app)

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({
            "ok": True,
            "version": "v3",
            "ml_enabled": True,
            "scheduler_enabled": app.config["ENABLE_SCHEDULER"],
        })

    @app.route("/")
    def index():
        return jsonify({
            "name": "Solomon API",
            "version": "4.0.0",
            "docs": "/api/v3",
        })

    # Init DB + seed
    with app.app_context():
        from app.models import init_db
        init_db()

        if app.config.get("ENABLE_SCHEDULER"):
            from app.services.scheduler_service import init_scheduler
            init_scheduler(app)

    return app
