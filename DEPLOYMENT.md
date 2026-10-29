# 🚀 MoneyPay Direct Gateway - Production Deployment Guide

This guide details how to deploy **MoneyPay Gateway** to production with high availability, security hardening, automated bank reconciliation, and SSL encryption.

---

## 📋 Production Readiness Architecture

| Feature | Production Implementation |
| :--- | :--- |
| **Framework** | Next.js 14.2+ (App Router, Server Components & Dynamic API Routes) |
| **Security Headers** | HSTS (63M seconds), X-Frame-Options (SAMEORIGIN), X-Content-Type (nosniff), CSP Ready |
| **Rate Limiting** | Sliding window rate limiting on `/api/v1/auth/login`, `/signup`, and `/payin/create` |
| **RBAC Security** | Strict session verification on all `/api/v1/admin/*` routes (`SUPER_ADMIN`, `OPERATIONS_AGENT`) |
| **Data Persistence** | Volume mapped JSON/Database storage under `/app/data` |
| **Health Check** | `/api/health` with database latency diagnostics and container readiness probe |

---

## 🛠️ Option 1: One-Click Docker & Docker Compose (Recommended for Self-Hosting / VPS)

### 1. Requirements:
* A Linux VPS (Ubuntu 22.04 / 24.04 LTS recommended) with Docker & Docker Compose installed.
* A custom domain or subdomain (e.g. `pay.yourcompany.com`) pointing to your server's public IP via an **A Record**.

### 2. Clone & Setup:
```bash
git clone https://github.com/yourusername/Deposit.git /opt/moneypay
cd /opt/moneypay

# Copy environment file
cp .env.example .env
```

### 3. Launch with Docker Compose:
```bash
docker compose up -d --build
```

### 4. Setup Nginx Reverse Proxy with Free SSL (Certbot):
```nginx
# /etc/nginx/sites-available/moneypay
server {
    server_name pay.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and install SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/moneypay /etc/nginx/sites-enabled/
sudo certbot --nginx -d pay.yourdomain.com
```

---

## ☁️ Option 2: Deploy to Vercel

1. Push your repository to **GitHub / GitLab**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   * `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
   * `ADMIN_EMAIL`: `admin@hunarpay.com`
   * `ADMIN_DEFAULT_PASSWORD`: `YourSecurePassword2026`
4. Click **Deploy**. Vercel will automatically build and deploy the gateway on its global Edge Network.

---

## 🚂 Option 3: Deploy to Railway or Render

### Railway:
1. Create a new project on [Railway.app](https://railway.app).
2. Select **Deploy from GitHub repo**.
3. Add a persistent volume under **Settings > Volumes** and mount it to `/app/data` to ensure transactions and accounts persist across redeployments.
4. Set Environment Variables (`PORT=3000`, `NODE_ENV=production`).

### Render:
1. Create a **Web Service** on [Render.com](https://render.com).
2. Select **Docker** environment or Node environment (`npm run build` / `npm start`).
3. Attach a **Persistent Disk** mounted at `/app/data`.

---

## 🔒 Post-Deployment Security Checklist

- [x] Change the default admin password from the Admin Team panel (`/admin/team`).
- [x] Configure your Bank accounts and UPI pool in the **Pool Manager** (`/admin/accounts`).
- [x] Setup your Merchant API keys and Webhook URLs in **Developers** (`/admin/developers`).
- [x] Verify that `/api/health` returns status `200 OK` with diagnostic data.
- [x] Test a sample ₹10 deposit and confirm the receipt generates with zero artifacts.
