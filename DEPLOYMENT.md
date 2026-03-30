# Deployment Guide - UK Business Mileage Tracker

## Overview

This guide covers deploying the UK Business Mileage Tracker to **Render** (backend + frontend) and **Neon** (PostgreSQL database).

---

## Prerequisites

1. **Render Account**: Sign up at https://render.com
2. **Neon Account**: Sign up at https://neon.tech (optional - Render can create DB)
3. **Git Repository**: Push code to GitHub/GitLab

---

## Quick Deploy (One-Click)

### Option 1: Using Render Blueprint

1. Push this repository to GitHub
2. In Render Dashboard, click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically:
   - Create PostgreSQL database
   - Deploy backend API
   - Deploy frontend static site
   - Configure environment variables

### Option 2: Manual Setup

#### Step 1: Create Database

**Using Neon (Recommended for Production):**

1. Go to https://console.neon.tech
2. Create new project: `mileage-tracker`
3. Create database: `mileage_tracker`
4. Copy the connection string

**Using Render PostgreSQL:**

1. In Render Dashboard → **New +** → **PostgreSQL**
2. Name: `mileage-tracker-db`
3. Plan: Starter ($7/month)
4. Copy the **Internal Database URL**

#### Step 2: Deploy Backend

1. In Render Dashboard → **New +** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `mileage-tracker-api`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter ($7/month)

4. Add Environment Variables:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:5432/mileage_tracker
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
COOKIE_SECRET=your-random-secret-here
APP_URL=https://mileage-tracker-api.onrender.com
FRONTEND_URL=https://mileage-tracker.onrender.com
ALLOWED_ORIGINS=https://mileage-tracker.onrender.com
```

5. Click **Create Web Service**

#### Step 3: Deploy Frontend

1. In Render Dashboard → **New +** → **Static Site**
2. Connect your repository
3. Configure:
   - **Name**: `mileage-tracker`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Starter ($7/month)

4. Add Environment Variables:

```bash
VITE_API_URL=https://mileage-tracker-api.onrender.com/api
VITE_APP_NAME=Mileage Tracker
VITE_CURRENCY=GBP
```

5. Click **Create Static Site**

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `JWT_PRIVATE_KEY` | RSA private key for JWT | PEM format |
| `JWT_PUBLIC_KEY` | RSA public key for JWT | PEM format |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `7d` |
| `COOKIE_SECRET` | Cookie signing secret | Random string |
| `APP_URL` | Backend URL | `https://api.example.com` |
| `FRONTEND_URL` | Frontend URL | `https://app.example.com` |
| `ALLOWED_ORIGINS` | CORS origins | Comma-separated URLs |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit | `100` |
| `AUTH_RATE_LIMIT_MAX` | Auth rate limit | `5` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com/api` |
| `VITE_APP_NAME` | App display name | `Mileage Tracker` |
| `VITE_CURRENCY` | Currency symbol | `GBP` |

---

## Generating JWT Keys

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# Copy contents (include BEGIN/END lines)
cat private.pem
cat public.pem
```

---

## Database Migrations

After first deploy, run migrations:

```bash
# Via Render Shell
npx prisma migrate deploy

# Or local with production DB
DATABASE_URL=your-production-url npx prisma migrate deploy
```

---

## Post-Deploy Checklist

- [ ] Database connected (check logs)
- [ ] API health check passes (`GET /api/health`)
- [ ] Frontend loads without errors
- [ ] Registration works
- [ ] Login works
- [ ] Can add a trip
- [ ] Can generate a report
- [ ] PDF download works
- [ ] CSV export works

---

## Custom Domain Setup (Optional)

1. In Render Dashboard → Your Service → **Settings**
2. Click **Add Custom Domain**
3. Follow DNS configuration instructions
4. Update `APP_URL` and `FRONTEND_URL` environment variables
5. Update `ALLOWED_ORIGINS` with new domain

---

## Monitoring & Logs

- **Render Dashboard**: View logs and metrics
- **Health Endpoint**: `GET /api/health`
- **Database**: Neon dashboard for query metrics

---

## Scaling

### Upgrade Plan

1. Render Dashboard → Service → **Settings**
2. Change Plan: Starter → Standard → Pro

### Database Scaling

1. Neon Dashboard → Project → **Branches**
2. Upgrade compute resources
3. Add read replicas for scaling

---

## Backup & Recovery

### Database Backups

**Neon (Automatic):**
- Daily backups included
- Point-in-time recovery
- Retention: 7 days (Starter), 30 days (Pro)

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Prisma connection
npx prisma db pull
```

### JWT Issues

- Verify keys are properly formatted (include headers)
- Check `JWT_ACCESS_TOKEN_EXPIRY` format (e.g., `15m`, `1h`)

### CORS Errors

- Add frontend URL to `ALLOWED_ORIGINS`
- Include protocol (`https://`)

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
```

---

## Security Checklist

- [ ] JWT keys generated (RSA 2048-bit)
- [ ] `COOKIE_SECRET` is random and secure
- [ ] `NODE_ENV=production` in production
- [ ] Database URL uses SSL
- [ ] Rate limiting enabled
- [ ] CORS configured for specific origins only
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

---

## Support

- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://prisma.io/docs

---

## Estimated Costs

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| PostgreSQL (Neon) | Free Tier | £0 |
| Backend API (Render) | Starter | $7 (~£5.50) |
| Frontend (Render) | Starter | $7 (~£5.50) |
| **Total** | | **~£11/month** |

For production with higher traffic:
- Standard Plan: $25/month per service
- Pro Plan: $85/month per service
