# Solomon v4.0 💎

> **AI-powered asset discovery & sales automation platform**
> "كنوز الإنترنت → أرباح ذكية" — Internet Treasures → Smart Profits

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)]()
[![Tests](https://img.shields.io/badge/tests-38%2F38%20passing-brightgreen.svg)]()
[![Routes](https://img.shields.io/badge/routes-62-orange.svg)]()
[![Python](https://img.shields.io/badge/python-3.11+-yellow.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

---

## 🌟 What's New in v4.0

### 🔐 Security Suite (NEW)
- **2FA / TOTP** — Google Authenticator-compatible with QR generation
- **Fernet field encryption** — AES-128-CBC + HMAC, PBKDF2 key derivation
- **Password policy** — strength scoring 0-100, configurable rules
- **Brute-force detection** — auto-lock after failed attempts
- **bcrypt** password hashing
- **Full audit log** of every action

### 💰 Multi-Provider Payments (NEW)
- **Stripe** — credit/debit cards, PaymentIntents, signed webhooks
- **Crypto** — BTC, ETH, USDT, USDC with live CoinGecko prices
- **Wire transfer** — manual reconciliation with bank instructions
- **Webhook handlers** — auto-update sale status

### 🤖 AI Agent (NEW)
- **Daily briefing** — Arabic-language insights on opportunities
- **Customer recommendations** — match treasures to buyer interests
- **Treasure analysis** — ML + heuristic risk assessment
- **Marketing content** — Twitter/LinkedIn/Reddit/Email posts
- **Customer insights** — LTV, interest clusters, churn prediction
- **Price optimization** — quartiles from comparable sales
- **LLM-powered** when OPENAI_API_KEY set, falls back to heuristics

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env (optional for demo mode)

# 3. Run development server
python3 wsgi.py
# → http://localhost:5000

# 4. Run tests
pytest tests/ -v
# → 38 passed
```

**Default credentials:** `admin` / `changeme`

---

## 📊 By the Numbers

| Metric | v3.0 | **v4.0** |
|---|---|---|
| Python files | 45 | **45** |
| Lines of code | ~12,800 | **~13,200** |
| API routes | 42 | **62** |
| API blueprints | 8 | **11** |
| Tests | 21 | **38** |
| Payment providers | 0 | **3** |
| Security features | 1 | **6** |
| AI features | 0 | **6** |

---

## 📚 API Endpoints (62 total)

### Core
- `POST /api/v3/auth/login` — Login, returns JWT
- `GET /api/v3/auth/me` — Current user
- `GET /api/v3/treasures` — List treasures
- `POST /api/v3/treasures` — Create treasure
- `GET /api/v3/sales` — List sales
- `POST /api/v3/sales` — Create sale
- `GET /api/v3/customers` — List customers
- `GET /api/v3/analytics/*` — Analytics
- `GET /api/v3/export/*` — CSV/Excel export

### 🔐 Security (NEW)
- `POST /api/v3/security/password/validate`
- `POST /api/v3/security/password/change`
- `POST /api/v3/security/2fa/setup` — Returns QR code
- `POST /api/v3/security/2fa/verify`
- `POST /api/v3/security/2fa/disable`
- `POST /api/v3/security/encrypt` (admin)
- `POST /api/v3/security/decrypt` (admin)
- `GET /api/v3/security/audit-logs`
- `GET /api/v3/security/sessions`

### 💰 Payments (NEW)
- `POST /api/v3/payments/create-intent`
- `POST /api/v3/payments/webhook/<method>`
- `GET /api/v3/payments/methods`

### 🤖 AI Agent (NEW)
- `GET /api/v3/ai/briefing`
- `GET /api/v3/ai/analyze/<treasure_id>`
- `GET /api/v3/ai/recommendations/<customer_id>`
- `POST /api/v3/ai/analyze-all` (admin)
- `POST /api/v3/ai/marketing/<treasure_id>`
- `GET /api/v3/ai/customer-insights`
- `GET /api/v3/ai/price-suggestion/<treasure_id>`

---

## 🐳 Deployment

### Render.com (recommended)
1. Push to GitHub
2. Connect repo to Render
3. Build: `pip install -r requirements.txt`
4. Start: `gunicorn wsgi:app --bind 0.0.0.0:$PORT`

### Docker
```bash
docker-compose up -d
```

---

## 🛠️ Tech Stack

- **Backend:** Flask 3, SQLAlchemy 2, APScheduler, Flask-SocketIO
- **ML/Data:** scikit-learn, pandas, numpy
- **Auth:** JWT (PyJWT), bcrypt, TOTP (pyotp), Fernet
- **Payments:** Stripe, BTC/ETH/USDT/USDC (CoinGecko)
- **Communication:** Twilio, Telegram Bot
- **DevOps:** Docker, gunicorn, GitHub Actions

---

## 📜 Changelog

### v4.0 (Current) — Security + Payments + AI
- 2FA, encryption, password policy, brute-force
- Stripe + Crypto + Wire
- Daily briefings, recommendations, marketing, pricing
- 38 tests, 62 routes, 11 blueprints

### v3.0 — ML + Auth + Real-time
- ML estimation engine
- JWT authentication
- WebSocket real-time alerts
- Docker + CI/CD

### v2.0 — Real APIs
- GovDeals + CryptoPanic live scrapers
- Sales pipeline + commissions
- Customer CRM

---

## 📄 License

Proprietary — © 2026 Solomon. All rights reserved.
