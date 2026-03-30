---
name: render-deploy
description: Deploy Node.js applications to Render.com. Use when setting up web services, PostgreSQL databases, environment variables, or creating render.yaml blueprints for infrastructure-as-code deployment.
---

# Render Deploy

Deploy full-stack applications to Render.com.

## Quick Deploy with Blueprint

Create `render.yaml` in project root:

```yaml
# render.yaml
services:
  # Backend API
  - type: web
    name: mileage-api
    runtime: node
    plan: starter
    buildCommand: cd backend && npm install && npx prisma generate
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: mileage-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://mileage-app.onrender.com

  # Frontend Static Site
  - type: static
    name: mileage-app
    plan: starter
    buildCommand: cd frontend && npm install && npm run build
    publishDir: frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://mileage-api.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: mileage-db
    plan: starter
    databaseName: mileage
    user: mileage
```

## Manual Setup

### 1. Database

1. Dashboard → New + → PostgreSQL
2. Name: `mileage-db`
3. Plan: Starter ($7/month)
4. Copy Internal Database URL

### 2. Backend Web Service

1. New + → Web Service
2. Connect GitHub repo
3. Configure:
   - **Name:** mileage-api
   - **Runtime:** Node
   - **Build:** `cd backend && npm install && npx prisma generate`
   - **Start:** `cd backend && npm start`
   - **Plan:** Starter

4. Environment Variables:
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:5432/mileage
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://your-frontend.onrender.com
```

### 3. Frontend Static Site

1. New + → Static Site
2. Configure:
   - **Name:** mileage-app
   - **Build:** `cd frontend && npm install && npm run build`
   - **Publish:** `frontend/dist`

3. Environment:
```bash
VITE_API_URL=https://mileage-api.onrender.com/api
```

## Database Migrations

```bash
# Via Render Shell (after first deploy)
npx prisma migrate deploy

# Or local with production DB
DATABASE_URL=your-render-db-url npx prisma migrate deploy
```

## Environment Variables Reference

### Backend
| Variable | Purpose | Example |
|----------|---------|---------|
| NODE_ENV | Environment mode | production |
| PORT | Server port | 10000 |
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| JWT_SECRET | JWT signing secret | 32+ char string |
| CORS_ORIGIN | Allowed frontend URL | https://... |

### Frontend
| Variable | Purpose | Example |
|----------|---------|---------|
| VITE_API_URL | Backend API URL | https://.../api |
| VITE_APP_NAME | App display name | Mileage Tracker |

## Health Checks

```javascript
// Add to your backend
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' // check actual DB status
  })
})
```

## Custom Domain

1. Service Settings → Custom Domain
2. Add domain (e.g., `mileage.yourdomain.com`)
3. Update DNS with provided CNAME
4. Update environment variables:
   - Backend: `CORS_ORIGIN=https://mileage.yourdomain.com`
   - Frontend: `VITE_API_URL=https://api.yourdomain.com`

## Troubleshooting

### Build Failures
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Check DATABASE_URL format
- Ensure SSL is enabled for production
- Verify database is in same region as service

### CORS Errors
- Add frontend URL to CORS_ORIGIN
- Include `https://` protocol

## Cost Estimation

| Component | Plan | Monthly |
|-----------|------|---------|
| PostgreSQL | Starter | $7 |
| Backend | Starter | $7 |
| Frontend | Starter | $7 (or free) |
| **Total** | | **~$14-21** |

For production:
- Standard Plan: $25/month per service
- Includes more RAM, CPU, bandwidth
