"""
app/__init__.py - Application factory
"""
import logging
import os
from flask import Flask, jsonify, send_from_directory, request

from app.config import Config
from app.extensions import db, migrate, cors, limiter, socketio


def create_app(config_class=None):
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class or Config)

    website_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "website"))

    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})
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
            "version": "v4",
            "ml_enabled": True,
            "stripe_enabled": True,
            "openai_enabled": True,
            "whatsapp_enabled": True,
            "scheduler_enabled": app.config["ENABLE_SCHEDULER"],
        })

    @app.route("/api/info")
    def api_info():
        return jsonify({
            "name": "Solomon API",
            "version": "4.0.0",
            "docs": "/api/v3",
            "routes": len(list(app.url_map.iter_rules())),
            "blueprints": list(app.blueprints.keys()),
        })

    @app.route("/")
    def index():
        if request.args.get("format") == "json":
            return jsonify({
                "name": "Solomon API",
                "version": "4.0.0",
                "docs": "/api/v3",
            })
        index_file = os.path.join(website_dir, "index.html")
        if os.path.exists(index_file):
            return send_from_directory(website_dir, "index.html")
        return jsonify({
            "name": "Solomon API",
            "version": "4.0.0",
            "docs": "/api/v3",
        })

    @app.route("/website/<path:filename>")
    def serve_website_subpath(filename):
        return send_from_directory(website_dir, filename)

    @app.route("/<path:filename>")
    def serve_website_root(filename):
        full_path = os.path.join(website_dir, filename)
        if os.path.isfile(full_path):
            return send_from_directory(website_dir, filename)
        return jsonify({"error": "Not found", "path": filename}), 404

    # Init DB + seed
    with app.app_context():
        from app.models import init_db
        init_db()

        if app.config.get("ENABLE_SCHEDULER"):
            from app.services.scheduler_service import init_scheduler
            init_scheduler(app)

    return app
