"""tests/test_integrations.py - Tests for Stripe, OpenAI, and WhatsApp integrations"""


def _get_token(client):
    r = client.post("/api/v3/auth/login", json={"username": "admin", "password": "changeme"})
    return r.get_json()["token"]


class TestStripeIntegration:
    def test_stripe_status(self, client):
        token = _get_token(client)
        r = client.get("/api/v3/stripe/status", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.get_json()["ok"] is True

    def test_stripe_checkout_and_refund(self, client):
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        t_id = client.get("/api/v3/treasures?limit=1", headers=headers).get_json()["items"][0]["id"]
        c_id = client.get("/api/v3/customers", headers=headers).get_json()["items"][0]["id"]

        sale_r = client.post("/api/v3/sales", headers=headers, json={
            "treasure_id": t_id,
            "customer_id": c_id,
            "sold_price": 1800,
            "payment_method": "stripe",
        })
        sale_id = sale_r.get_json()["id"]

        co_r = client.post("/api/v3/stripe/checkout", headers=headers, json={"sale_id": sale_id})
        assert co_r.status_code == 200
        co_data = co_r.get_json()
        assert co_data["ok"] is True
        assert "session_id" in co_data

        ref_r = client.post("/api/v3/stripe/refund", headers=headers, json={"sale_id": sale_id})
        assert ref_r.status_code == 200
        assert ref_r.get_json()["ok"] is True


class TestOpenAIIntegration:
    def test_openai_status(self, client):
        token = _get_token(client)
        r = client.get("/api/v3/openai/status", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.get_json()["ok"] is True

    def test_openai_chat_fallback(self, client):
        token = _get_token(client)
        r = client.post(
            "/api/v3/openai/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"prompt": "ما هي أفضل صفقة اليوم؟"},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
        assert "content" in data

    def test_openai_analyze_and_description(self, client):
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        t_id = client.get("/api/v3/treasures?limit=1", headers=headers).get_json()["items"][0]["id"]

        an_r = client.post(f"/api/v3/openai/analyze-treasure/{t_id}", headers=headers)
        assert an_r.status_code == 200
        assert an_r.get_json()["ok"] is True

        desc_r = client.post(f"/api/v3/openai/generate-description/{t_id}", headers=headers, json={"style": "luxury"})
        assert desc_r.status_code == 200
        assert desc_r.get_json()["ok"] is True


class TestWhatsAppIntegration:
    def test_whatsapp_broadcast(self, client):
        token = _get_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        r = client.post("/api/v3/whatsapp/broadcast-top-treasures", headers=headers)
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
        assert data["count"] > 0
        assert "whatsapp_url" in data["campaign"][0]

    def test_whatsapp_webhook(self, client):
        r = client.post("/api/v3/whatsapp/webhook", json={"message": "1", "from": "+966500000001"})
        assert r.status_code == 200
        assert r.get_json()["ok"] is True


class TestMobileAppAPI:
    def test_mobile_summary(self, client):
        token = _get_token(client)
        r = client.get("/api/v3/mobile/summary", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
        assert "deals" in data

    def test_instant_calculator(self, client):
        token = _get_token(client)
        r = client.post(
            "/api/v3/mobile/instant-calculator",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Rolex Submariner", "category": "Watches", "asking_price": 7500},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
        assert data["roi_pct"] > 0

    def test_generate_contract(self, client):
        token = _get_token(client)
        r = client.post(
            "/api/v3/mobile/generate-contract",
            headers={"Authorization": f"Bearer {token}"},
            json={"commission_pct": 10},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data["ok"] is True
        assert "SLM-CNTR-" in data["contract_ref"]

    def test_mobile_qr(self, client):
        r = client.get("/api/v3/mobile/qr?url=https://example.com/mobile.html")
        assert r.status_code == 200
        assert r.get_json()["qr_base64"].startswith("data:image/png;base64,")


class TestCommercialLicensing:
    def test_license_tiers(self, client):
        r = client.get("/api/v3/license/tiers")
        assert r.status_code == 200
        data = r.get_json()
        assert data["commercial_only"] is True
        assert "PRO" in data["tiers"]

    def test_generate_and_verify_license(self, client):
        token = _get_token(client)
        gen_r = client.post(
            "/api/v3/license/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={"buyer_email": "buyer@company.com", "tier": "AGENCY"},
        )
        assert gen_r.status_code == 200
        key = gen_r.get_json()["license_key"]
        assert key.startswith("SLM-AGENCY-")

        ver_r = client.post("/api/v3/license/verify", json={"license_key": key})
        assert ver_r.status_code == 200
        assert ver_r.get_json()["valid"] is True

        bad_r = client.post("/api/v3/license/verify", json={"license_key": "SLM-AGENCY-FAKE-0000-0000.e30"})
        assert bad_r.status_code == 402
        assert bad_r.get_json()["valid"] is False


