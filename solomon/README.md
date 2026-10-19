# 👑 Solomon v4.1 — Commercial AI Asset Discovery & Sales Engine (iOS + Android + Web)

> 🔒 **COMMERCIAL PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED © 2026 Namak7678**
> **This repository is a commercial software product. It is NOT free or open-source.**
> Running or deploying Solomon v4.1 requires an official HMAC-SHA256 signed **`SOLOMON_LICENSE_KEY`** purchased from the owner.

---

## 💎 Purchase a Commercial License Key

To unlock and deploy **Solomon v4.1** (Backend API + Web Dashboard + iOS & Android Mobile App), choose a commercial license tier:

| License Tier | Price (One-Time) | Included Rights & Features |
| :--- | :--- | :--- |
| **🥉 Indie License** | **$49 USD** | 1 Project Deployment • Core API & ML Valuation • Standard Web Dashboard • `SLM-INDIE` Key |
| **🥈 Pro License (Popular)** | **$149 USD** | 3 Commercial Deployments • **iOS & Android Mobile App** • WhatsApp Broadcast Engine • OpenAI Deal Analyzer • Stripe & USDT Checkout • `SLM-PRO` Key |
| **🥇 Agency White-Label** | **$499 USD** | **Full White-Label Resale Rights (Up to 25 Clients)** • React Native iOS/Android Source • License Key Generator • Priority VIP Setup • `SLM-AGENCY` Key |

---

## 🚀 Key Platform Capabilities

1. **📱 Native-Style iOS & Android Mobile App (`/mobile.html` + `mobile-app/` React Native Expo):**
   - Live Deals Radar with 1-tap WhatsApp & Stripe Checkout.
   - Instant AI Flip & Negotiation Calculator (`/api/v3/mobile/instant-calculator`).
   - Instant Brokerage & Commission Contract Generator (`/api/v3/mobile/generate-contract`).
2. **🤖 OpenAI + Scikit-Learn Valuation Engine:**
   - Automated fair-market valuation, profit margin scoring, Arabic/English daily briefings, and high-converting sales copywriting.
3. **💳 Multi-Rail Payments & Licensing Gate:**
   - Built-in Stripe Checkout, Crypto (USDT/BTC/ETH/USDC QR intents), Bank Wire instructions, and Cryptographic License Key Verification (`/api/v3/license/verify`).
4. **🛡️ Bank-Grade Security:**
   - 2FA TOTP (Google Authenticator QR), Fernet AES encryption, JWT Auth, and full Audit Logging.

---

## 🔑 Activating Your License Key

Once you purchase a license key (`SLM-PRO-XXXX-XXXX-XXXX...`), set it in your `.env`:

```bash
SOLOMON_LICENSE_KEY=SLM-PRO-XXXX-XXXX-XXXX.eyJ...
```

Verify your license via the API:
```bash
curl -X POST https://your-domain.com/api/v3/license/verify \
  -H "Content-Type: application/json" \
  -d '{"license_key": "SLM-PRO-XXXX-XXXX-XXXX..."}'
```

---

## ⚖️ Copyright & DMCA Protection

**Copyright © 2026 Namak7678. All Rights Reserved.**
Unauthorized copying, forking, redistribution, or commercial use without a valid paid license key is strictly prohibited under international copyright law and GitHub DMCA policy. See [LICENSE](./LICENSE) for full commercial terms.
