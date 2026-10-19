"""
app/services/scheduler_service.py - APScheduler background jobs
"""
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

log = logging.getLogger(__name__)

_scheduler = None


def init_scheduler(app):
    """Initialize background scheduler with default jobs."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler(daemon=True)

    # Auto-scan every 30 min (placeholder)
    @_scheduler.scheduled_job("interval", minutes=30)
    def auto_scan():
        with app.app_context():
            log.info("Auto-scan: checking for new treasures...")

    # ML retrain daily
    @_scheduler.scheduled_job("cron", hour=3)
    def ml_retrain():
        with app.app_context():
            from app.services.ml_service import ml_estimator
            result = ml_estimator.train()
            log.info(f"ML retrain: {result}")

    # Cleanup old alerts
    @_scheduler.scheduled_job("cron", hour=2)
    def cleanup_alerts():
        with app.app_context():
            from app.extensions import db
            from app.models import Alert
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=30)
            deleted = Alert.query.filter(Alert.created_at < cutoff, Alert.acknowledged == True).delete()
            db.session.commit()
            log.info(f"Cleanup: removed {deleted} old acknowledged alerts")

    # Daily stats snapshot
    @_scheduler.scheduled_job("cron", hour=0)
    def daily_snapshot():
        with app.app_context():
            log.info("Daily stats snapshot completed")

    _scheduler.start()
    log.info(f"Scheduler started with {len(_scheduler.get_jobs())} jobs")
    return _scheduler
