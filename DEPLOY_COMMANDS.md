# Deployment Commands

## 1. Push to GitHub

```bash
cd mileage-app
git push origin main
```

If that fails, try:
```bash
cd mileage-app
git remote set-url origin https://github.com/Will-Massey/cis-mileage-tracker.git
git push -u origin main
```

## 2. Deploy to Render

### Option A: Using Render Blueprint (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select the `cis-mileage-tracker` repository
5. Render will automatically:
   - Create PostgreSQL database
   - Deploy backend API
   - Deploy frontend static site
   - Set environment variables

### Option B: Manual Setup

**Database:**
1. New + → PostgreSQL
2. Name: `mileage-db`
3. Plan: Starter ($7/month)

**Backend:**
1. New + → Web Service
2. Name: `mileage-api`
3. Build: `cd backend && npm install && npx prisma generate`
4. Start: `cd backend && npm start`
5. Add env vars from render.yaml

**Frontend:**
1. New + → Static Site
2. Name: `mileage-tracker`
3. Build: `cd frontend && npm install && npm run build`
4. Publish: `frontend/dist`

## 3. Run Database Migrations

After first deploy, run:
```bash
# Via Render Shell (in dashboard)
npx prisma migrate deploy

# Or from local with production DB
DATABASE_URL=your-render-db-url npx prisma migrate deploy
```

## 4. Test Deployed App

- Frontend: https://mileage-tracker.onrender.com
- Backend API: https://mileage-api.onrender.com
- Health check: https://mileage-api.onrender.com/health

## URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend | https://mileage-tracker.onrender.com |
| Backend API | https://mileage-api.onrender.com/api |
| Health | https://mileage-api.onrender.com/health |
