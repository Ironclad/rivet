"""tests/test_api.py - API endpoint tests"""
import pytest
import json


class TestAuth:
    def test_login_success(self, client):
        r = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        })
        assert r.status_code == 200
        data = r.get_json()
        assert "token" in data
        assert data["user"]["username"] == "admin"

    def test_login_wrong_password(self, client):
        r = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "wrong"
        })
        assert r.status_code == 401

    def test_me_with_auth(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.get_json()["username"] == "admin"

    def test_me_without_auth(self, client):
        r = client.get("/api/v3/auth/me")
        assert r.status_code == 401


class TestTreasures:
    def test_list_treasures(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/treasures", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.get_json()
        assert "items" in data
        assert len(data["items"]) > 0


class TestCustomers:
    def test_list_customers(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/customers", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200


class TestSales:
    def test_list_sales(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/sales", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200


class TestAnalytics:
    def test_dashboard(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/analytics/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.get_json()
        assert "treasures" in data
        assert "financials" in data


class TestPayments:
    def test_list_methods(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/payments/methods", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.get_json()
        assert len(data["methods"]) == 3


class TestSecurity:
    def test_password_validate(self, client):
        r = client.post("/api/v3/security/password/validate", json={"password": "MyStr0ng@Pass!"})
        assert r.status_code == 200
        data = r.get_json()
        assert data["valid"] is True

    def test_audit_logs_requires_auth(self, client):
        r = client.get("/api/v3/security/audit-logs")
        assert r.status_code == 401


class TestAI:
    def test_briefing_requires_auth(self, client):
        r = client.get("/api/v3/ai/briefing")
        assert r.status_code == 401

    def test_briefing_with_auth(self, client):
        token = client.post("/api/v3/auth/login", json={
            "username": "admin", "password": "changeme"
        }).get_json()["token"]
        r = client.get("/api/v3/ai/briefing", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
