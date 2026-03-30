# CIS Mileage Tracker - Deployment Guide

## Render Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add mobile features: GPS tracking, sites, offline sync"
git push origin main
```

### 2. Deploy Backend to Render

**Option A: Using Render Dashboard (Recommended)**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `mileage-tracker-api`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter ($7/month)

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<from Neon PostgreSQL>
   JWT_PRIVATE_KEY=<generate>
   JWT_PUBLIC_KEY=<generate>
   JWT_ACCESS_TOKEN_EXPIRY=15m
   JWT_REFRESH_TOKEN_EXPIRY=7d
   COOKIE_SECRET=<generate>
   BCRYPT_ROUNDS=12
   APP_URL=https://mileage-tracker-api.onrender.com
   FRONTEND_URL=https://mileage-tracker.onrender.com
   ALLOWED_ORIGINS=https://mileage-tracker.onrender.com,https://mileage-tracker-api.onrender.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX=5
   LOG_LEVEL=info
   REPORT_EXPIRY_DAYS=30
   DEFAULT_CURRENCY=GBP
   HMRC_RATE_STANDARD=0.45
   HMRC_RATE_REDUCED=0.25
   HMRC_MILEAGE_THRESHOLD=10000
   TAX_YEAR_START_MONTH=4
   TAX_YEAR_START_DAY=6
   MOBILE_SYNC_BATCH_SIZE=100
   MOBILE_MAX_TRIP_AGE_DAYS=365
   GPS_MIN_ACCURACY_METERS=50
   RECEIPT_STORAGE_PROVIDER=local
   MAX_RECEIPT_SIZE_MB=10
   CIS_DEFAULT_RATE=0.20
   ```

6. Click "Create Web Service"

### 3. Deploy Frontend to Render

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `mileage-tracker`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `./frontend/dist`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   VITE_API_URL=https://mileage-tracker-api.onrender.com/api
   VITE_APP_NAME=Mileage Tracker
   VITE_CURRENCY=GBP
   VITE_DEFAULT_MILEAGE_RATE=0.45
   ```

5. Add Rewrite Rules:
   - Source: `/api/*` → Destination: `https://mileage-tracker-api.onrender.com/api/*`
   - Source: `/*` → Destination: `/index.html`

6. Click "Create Static Site"

### 4. Set Up PostgreSQL Database (Neon)

1. Go to https://neon.tech
2. Create new project
3. Copy the connection string
4. Add to Render backend environment variables as `DATABASE_URL`

### 5. Run Database Migrations

**Via Render Shell:**
1. Go to your backend service on Render
2. Click "Shell" tab
3. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

**Or Local → Remote:**
```bash
cd backend
DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
```

## Mobile App Testing

### Prerequisites
- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS - macOS only)
- Capacitor CLI: `npm install -g @capacitor/cli`

### Build Steps

1. **Install Dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Build Web Assets:**
   ```bash
   npm run build
   ```

3. **Sync Capacitor:**
   ```bash
   npx cap sync
   ```

4. **Open in IDE:**
   ```bash
   # For Android
   npx cap open android
   
   # For iOS (macOS only)
   npx cap open ios
   ```

5. **Run on Device:**
   - Connect your phone via USB
   - Enable USB debugging (Android) or Developer Mode (iOS)
   - Run from Android Studio or Xcode

### Environment Configuration

Create `mobile/.env.local`:
```
VITE_API_URL=https://mileage-tracker-api.onrender.com/api
VITE_ENABLE_GPS=true
VITE_SYNC_INTERVAL=30000
```

## Phone Testing Checklist

### GPS Tracking
- [ ] Trip auto-starts when driving >5mph for 30s
- [ ] Trip auto-ends when stationary for 5min
- [ ] Distance calculated accurately
- [ ] Battery usage acceptable (<10% per hour)

### Offline Mode
- [ ] Trips saved when offline
- [ ] Auto-sync when back online
- [ ] No data loss on app close

### CIS Features
- [ ] Tax savings display correctly (20%/30%)
- [ ] 24-month rule warnings appear
- [ ] Site geofencing works

### Receipt Capture
- [ ] Camera opens
- [ ] Photo saved
- [ ] OCR extracts amount

## Post-Deployment Verification

1. **API Health Check:**
   ```bash
   curl https://mileage-tracker-api.onrender.com/health
   ```

2. **Test Authentication:**
   - Register new user
   - Login
   - Verify JWT token refresh

3. **Test Core Features:**
   - Create trip
   - View trips
   - Generate report
   - Upload receipt

4. **Mobile API Test:**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        https://mileage-tracker-api.onrender.com/api/mobile/trips/batch \
        -X POST -d '{"trips":[],"deviceId":"test"}'
   ```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Ensure SSL mode is enabled for production

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check `FRONTEND_URL` matches actual deployed URL

### Mobile Sync Issues
- Check `MOBILE_SYNC_BATCH_SIZE` is set
- Verify JWT tokens aren't expired
- Check rate limiting isn't blocking requests

## Cost Estimate (Render)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Backend API | Starter | $7 |
| PostgreSQL | Neon Free Tier | $0 |
| Frontend | Static (Free) | $0 |
| **Total** | | **$7/month** |

For production with file storage (S3/R2), add ~$5-10/month.
