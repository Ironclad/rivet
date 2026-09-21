"""tests/test_ai_agent.py - AI Agent tests (heuristic fallback)"""
import pytest
from app import create_app
from app.config import TestConfig
from app.services.ai_agent import AIAgent
from app.extensions import db


@pytest.fixture(autouse=True)
def setup_app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


class TestAIAgent:
    def setup_method(self):
        self.agent = AIAgent({"OPENAI_API_KEY": ""})  # no LLM

    def test_daily_briefing_returns_structure(self):
        result = self.agent.daily_briefing()
        assert result["ok"] is True
        assert "stats" in result
        assert "treasures_found" in result["stats"]
        assert "llm_powered" in result

    def test_recommend_for_customer(self):
        result = self.agent.recommend_for_customer(1)
        assert result["ok"] is True
        assert "recommendations" in result

    def test_analyze_treasure_not_found(self):
        result = self.agent.analyze_treasure("nonexistent")
        assert result["ok"] is False

    def test_customer_insights(self):
        result = self.agent.customer_insights()
        assert result["ok"] is True
        assert "total_customers" in result

    def test_suggest_price_not_found(self):
        result = self.agent.suggest_price("nonexistent")
        assert result["ok"] is False
