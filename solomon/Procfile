web: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
worker: python -c "from app.services.scheduler_service import init_scheduler; from app import create_app; init_scheduler(create_app())"
