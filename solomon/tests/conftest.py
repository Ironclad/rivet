"""tests/conftest.py - Pytest configuration"""
import os
import sys
import pytest

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["FLASK_ENV"] = "testing"
os.environ["ENABLE_SCHEDULER"] = "false"
os.environ["ENABLE_WEBSOCKET"] = "false"
os.environ["TELEGRAM_BOT_TOKEN"] = ""
os.environ["SECRET_KEY"] = "test-secret-key-32-bytes-aaaaaaaaaaaaaaaaa"
os.environ["JWT_SECRET"] = "test-jwt-secret-32-bytes-aaaaaaaaaaaaaaaa"

from app import create_app
from app.config import TestConfig
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db
