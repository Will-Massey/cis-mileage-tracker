# Deploy to Render - Step by Step

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `cis-mileage-tracker`
3. **Description:** "CIS Mileage Tracker - GPS tracking app for UK construction workers"
4. **Make it:** Public
5. **Check:** Add a README file
6. Click **"Create repository"**

---

## Step 2: Push Your Code to GitHub

After creating the repo, run these commands:

```powershell
cd "C:\Users\willi\OneDrive\Desktop\mileage\mileage-app"

# Add the GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cis-mileage-tracker.git

# Rename branch to main
git branch -M main

# Push your code
git push -u origin main
```

---

## Step 3: Create Render Account

1. Go to https://dashboard.render.com
2. Sign up with **GitHub** (easiest option)
3. Authorize Render to access your repos

---

## Step 4: Deploy Frontend (Static Site)

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect your `cis-mileage-tracker` repository
3. Configure:
   - **Name:** `cis-mileage-tracker` (or your preferred name)
   - **Branch:** `main`
   - **Build Command:** `cd mobile && npm install && npm run build`
   - **Publish Directory:** `mobile/dist`
   - **Environment:** Node

4. Click **"Create Static Site"**

Render will build and deploy automatically. You'll get a URL like:
```
https://cis-mileage-tracker.onrender.com
```

---

## Step 5: Deploy Backend (Web Service)

1. Click **"New +"** → **"Web Service"**
2. Connect the same repository
3. Configure:
   - **Name:** `cis-mileage-tracker-api`
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `cd backend && npm install && npx prisma generate`
   - **Start Command:** `cd backend && npm start`

4. **Environment Variables** - Add these:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<get from Neon PostgreSQL - see below>
   JWT_PRIVATE_KEY=<generate random string>
   JWT_PUBLIC_KEY=<generate random string>
   JWT_ACCESS_TOKEN_EXPIRY=15m
   JWT_REFRESH_TOKEN_EXPIRY=7d
   COOKIE_SECRET=<generate random string>
   BCRYPT_ROUNDS=12
   APP_URL=https://cis-mileage-tracker-api.onrender.com
   FRONTEND_URL=https://cis-mileage-tracker.onrender.com
   ALLOWED_ORIGINS=https://cis-mileage-tracker.onrender.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   HMRC_RATE_STANDARD=0.45
   HMRC_RATE_REDUCED=0.25
   CIS_DEFAULT_RATE=0.20
   ```

5. Click **"Create Web Service"**

---

## Step 6: Set Up PostgreSQL Database (Neon)

1. Go to https://neon.tech
2. Sign up (free tier available)
3. Create new project
4. Create database: `mileage_tracker`
5. Copy the connection string
6. Add to Render backend environment variables as `DATABASE_URL`

Format:
```
postgresql://username:password@host/database?sslmode=require
```

---

## Step 7: Run Database Migrations

1. In Render dashboard, go to your backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

## Step 8: Update Frontend API URL

1. In Render dashboard, go to your static site
2. Click **"Environment"** tab
3. Add:
   ```
   VITE_API_URL=https://cis-mileage-tracker-api.onrender.com/api
   ```
4. Click **"Manual Deploy"** → **"Deploy Latest Commit"**

---

## Your Final URLs

| Service | URL |
|---------|-----|
| Frontend (iPhone App) | https://cis-mileage-tracker.onrender.com |
| Backend API | https://cis-mileage-tracker-api.onrender.com |

---

## Test on Your iPhone

1. Open Safari on iPhone
2. Go to: `https://cis-mileage-tracker.onrender.com`
3. Tap Share → "Add to Home Screen"
4. Launch from home screen like a native app!

---

## Troubleshooting

### Build Fails
- Check that `mobile/dist` folder exists after build
- Verify Node version is 18+ in Render settings

### API Connection Fails
- Check `VITE_API_URL` has correct backend URL
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check CORS settings in backend

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Ensure Neon database is active (not paused)
- Check SSL mode is enabled (`?sslmode=require`)

---

## Cost

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| GitHub | Public Repo | Free |
| Render Static Site | Free Tier | Free |
| Render Web Service | Free Tier | Free (sleeps after 15 min idle) |
| Neon PostgreSQL | Free Tier | Free |
| **Total** | | **Free** |

---

## Estimated Time

- Create GitHub repo: 2 minutes
- Push code: 1 minute
- Create Render account: 2 minutes
- Deploy frontend: 5 minutes
- Deploy backend: 5 minutes
- Set up database: 5 minutes
- **Total: ~20 minutes**
