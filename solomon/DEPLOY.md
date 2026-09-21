# 🚀 Solomon v4.0 — Deployment Guide

Complete step-by-step guide to deploy Solomon v4.0 to production.

---

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Deploy to Render.com (Recommended)](#deploy-to-render)
3. [Deploy with Docker](#deploy-with-docker)
4. [Deploy to Heroku](#deploy-to-heroku)
5. [Deploy to Railway.app](#deploy-to-railway)
6. [Custom VPS Deployment](#custom-vps)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Checklist](#post-deployment)

---

## 🖥️ Local Development

### Prerequisites
- Python 3.11+
- pip
- Git

### Steps

```bash
# 1. Clone repository
git clone https://github.com/Namak7678/rivet.git
cd rivet/solomon

# 2. Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env
# Edit .env with your values

# 5. Run the application
python3 wsgi.py

# 6. Open browser
# http://localhost:5000

# 7. Login
# Username: admin
# Password: changeme
```

---

## ☁️ Deploy to Render.com

**Recommended for:** Beginners, free hosting, automatic SSL.

### Steps

1. **Create Render Account**
   - Go to https://render.com/register
   - Sign up with GitHub

2. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account
   - Select repository: `Namak7678/rivet`
   - Branch: `arena/01a07482-rivet`

3. **Configure Service**
   ```
   Name:           solomon
   Region:         Oregon (US West)
   Branch:         arena/01a07482-rivet
   Root Directory: solomon
   Runtime:        Python 3
   Build Command:  pip install -r requirements.txt
   Start Command:  gunicorn wsgi:app --bind 0.0.0.0:$PORT
   Instance Type:  Free
   ```

4. **Add Environment Variables**
   ```
   SECRET_KEY = <generate-random-32-bytes>
   JWT_SECRET = <generate-random-32-bytes>
   FLASK_ENV = production
   ENABLE_SCHEDULER = true
   ENABLE_WEBSOCKET = false
   PYTHON_VERSION = 3.11.0
   ```

5. **Deploy**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for build
   - Your URL: `https://solomon-xxxx.onrender.com`

6. **Custom Domain (Optional)**
   - Settings → Custom Domains → Add
   - Point your domain's CNAME to Render URL

---

## 🐳 Deploy with Docker

**Recommended for:** Production, full control, custom infrastructure.

### Single Container

```bash
# Build image
docker build -t solomon:latest .

# Run container
docker run -d \
  --name solomon \
  -p 5000:5000 \
  -e SECRET_KEY=your-secret-key \
  -e JWT_SECRET=your-jwt-secret \
  -e OPENAI_API_KEY=sk-xxx \
  -v $(pwd)/instance:/app/instance \
  solomon:latest

# View logs
docker logs -f solomon

# Stop
docker stop solomon

# Remove
docker rm solomon
```

### Docker Compose

```bash
# Create .env file
cp .env.example .env
# Edit .env

# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🌐 Deploy to Heroku

```bash
# Login
heroku login

# Create app
heroku create solomon-app

# Add buildpack
heroku buildpacks:set heroku/python

# Set env vars
heroku config:set SECRET_KEY=xxx
heroku config:set JWT_SECRET=xxx

# Deploy
git push heroku arena/01a07482-rivet:main

# Open
heroku open
```

---

## 🚂 Deploy to Railway.app

1. Go to https://railway.app
2. **"New Project"** → **"Deploy from GitHub"**
3. Select `Namak7678/rivet`
4. Add environment variables
5. Railway auto-detects Python and deploys

---

## 🖥️ Custom VPS Deployment

### Prerequisites
- Ubuntu 22.04+ server
- SSH access
- Domain pointed to server IP

### Steps

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install dependencies
sudo apt update
sudo apt install -y python3.11 python3-pip nginx supervisor

# 3. Clone repository
cd /opt
sudo git clone https://github.com/Namak7678/rivet.git
cd rivet/solomon

# 4. Install Python deps
sudo pip3 install -r requirements.txt

# 5. Create .env
sudo cp .env.example .env
sudo nano .env  # Edit values

# 6. Configure Supervisor
sudo nano /etc/supervisor/conf.d/solomon.conf
```

**supervisor config:**
```ini
[program:solomon]
command=/usr/bin/python3 wsgi.py
directory=/opt/rivet/solomon
user=www-data
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/solomon.err.log
stdout_logfile=/var/log/solomon.out.log
environment=
    SECRET_KEY="your-key",
    JWT_SECRET="your-jwt",
    PATH="/usr/bin:%(ENV_PATH)s"
```

```bash
# 7. Start with Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start solomon

# 8. Configure Nginx
sudo nano /etc/nginx/sites-available/solomon
```

**nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 9. Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/solomon /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 10. Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key (32+ bytes) | `a3f8...` |
| `JWT_SECRET` | JWT signing key (32+ bytes) | `b9c2...` |

### Optional (AI Features)

| Variable | Description | Get from |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | Model name (default: gpt-4o-mini) | - |

### Optional (Payments)

| Variable | Description | Get from |
|----------|-------------|----------|
| `STRIPE_API_KEY` | Stripe secret key | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | https://dashboard.stripe.com/webhooks |
| `CRYPTO_BTC_ADDRESS` | Bitcoin receiving address | Your wallet |
| `CRYPTO_ETH_ADDRESS` | Ethereum receiving address | Your wallet |
| `CRYPTO_USDT_ADDRESS` | USDT receiving address | Your wallet |
| `CRYPTO_USDC_ADDRESS` | USDC receiving address | Your wallet |

### Optional (Notifications)

| Variable | Description | Get from |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | https://t.me/BotFather |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | https://api.telegram.org/bot<TOKEN>/getUpdates |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | https://console.twilio.com |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | https://console.twilio.com |
| `TWILIO_FROM_NUMBER` | Twilio phone number | https://console.twilio.com |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_SCHEDULER` | `true` | Run background jobs (auto-scan, ML retrain) |
| `ENABLE_WEBSOCKET` | `false` | Enable WebSocket real-time alerts |
| `FLASK_ENV` | `production` | Flask environment |

---

## ✅ Post-Deployment Checklist

After deploying, verify everything works:

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```
Expected: `{"ok": true, "version": "v3"}`

### 2. Login Test
```bash
curl -X POST https://your-domain.com/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'
```
Expected: `{"token": "eyJ...", "user": {...}}`

### 3. Change Admin Password
```bash
# Login first to get token
TOKEN=$(curl -s -X POST https://your-domain.com/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Change password
curl -X POST https://your-domain.com/api/v3/security/password/change \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"changeme","new_password":"YourNewStrong@Pass123"}'
```

### 4. Enable 2FA
```bash
# Setup 2FA (returns QR code)
curl -X POST https://your-domain.com/api/v3/security/2fa/setup \
  -H "Authorization: Bearer $TOKEN"

# Scan QR with Google Authenticator
# Verify with code:
curl -X POST https://your-domain.com/api/v3/security/2fa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

### 5. Test API Endpoints
```bash
# List treasures
curl https://your-domain.com/api/v3/treasures \
  -H "Authorization: Bearer $TOKEN"

# Get AI briefing
curl https://your-domain.com/api/v3/ai/briefing \
  -H "Authorization: Bearer $TOKEN"

# List customers
curl https://your-domain.com/api/v3/customers \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Setup Stripe Webhooks (if using payments)
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/v3/payments/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

### 7. Monitor Logs
- **Render:** Logs tab in dashboard
- **Docker:** `docker logs -f solomon`
- **Heroku:** `heroku logs --tail`
- **VPS:** `tail -f /var/log/solomon.err.log`

---

## 🔄 Updating After Deployment

### Render.com (auto-deploy)
```bash
# Just push to GitHub
git add -A
git commit -m "update: description"
git push origin arena/01a07482-rivet
# Render auto-detects and redeploys
```

### Docker
```bash
git pull
docker-compose up -d --build
```

### VPS
```bash
cd /opt/rivet
git pull
sudo supervisorctl restart solomon
```

---

## 🆘 Troubleshooting

### "Application failed to start"
- Check logs for specific error
- Verify environment variables are set
- Ensure `SECRET_KEY` is at least 32 bytes

### "Database is locked"
- SQLite doesn't handle concurrent writes well
- For production, consider PostgreSQL

### "Port already in use"
- Change `PORT` environment variable
- Or kill the process using port 5000

### "Tests failing"
- Ensure `FLASK_ENV=testing`
- Ensure `ENABLE_SCHEDULER=false`
- Ensure `TELEGRAM_BOT_TOKEN=""`

---

## 📞 Support

- **GitHub Issues:** https://github.com/Namak7678/rivet/issues
- **Email:** hello@solomon.ai
- **Discord:** [link to community]

---

*Built for Solomon v4.0 — September 2026*
