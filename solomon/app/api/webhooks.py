"""app/api/webhooks.py - Incoming webhooks (Telegram, etc.)"""
import json
import logging
from flask import Blueprint, request, jsonify
from app.models import Alert, Treasure
from app.extensions import db

log = logging.getLogger(__name__)
webhooks_bp = Blueprint("webhooks", __name__)


@webhooks_bp.route("/telegram", methods=["POST"])
def telegram():
    """Receive Telegram bot updates."""
    data = request.json or {}
    log.info(f"Telegram webhook: {json.dumps(data)[:200]}")
    # Placeholder — handle commands like /scan, /sales
    return jsonify({"ok": True})


@webhooks_bp.route("/alert", methods=["POST"])
def custom_alert():
    """Create an alert from external system."""
    data = request.json or {}
    treasure_id = data.get("treasure_id")
    message = data.get("message", "")
    level = data.get("level", "info")
    if not treasure_id or not message:
        return jsonify({"error": "treasure_id and message required"}), 400
    if not Treasure.query.get(treasure_id):
        return jsonify({"error": "Treasure not found"}), 404
    alert = Alert(treasure_id=treasure_id, level=level, message=message)
    db.session.add(alert)
    db.session.commit()
    return jsonify({"ok": True, "alert": alert.to_dict()}), 201
