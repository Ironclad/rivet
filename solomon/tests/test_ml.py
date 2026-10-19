"""tests/test_ml.py - ML service tests"""
import pytest
from app.services.ml_service import MLEstimator


def test_bootstrap_training():
    ml = MLEstimator()
    result = ml._bootstrap_train(save=False)
    assert result["ok"] is True
    assert result["samples"] > 0
    assert ml.trained is True


def test_estimate_returns_structure():
    from app.models import Treasure
    ml = MLEstimator()
    ml._bootstrap_train(save=False)

    t = Treasure(id="TEST1", title="Test Item", category="electronics",
                 condition="used", source="manual", price=1000)
    result = ml.estimate(t)
    assert result["ok"] is True
    assert "estimated_value" in result
    assert "profit_pct" in result


def test_categories_supported():
    ml = MLEstimator()
    assert "electronics" in ml.CATEGORIES
    assert "vehicles" in ml.CATEGORIES
    assert "medical" in ml.CATEGORIES


def test_encoders_initialized():
    ml = MLEstimator()
    assert "category" in ml.encoders
    assert "condition" in ml.encoders
    assert "source" in ml.encoders
