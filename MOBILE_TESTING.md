# CIS Mileage Tracker - Mobile Testing Guide

## ✅ What's Ready

### Backend API (Ready for Render Deploy)
- [x] Mobile-specific routes created (`/api/mobile/*`)
- [x] Database schema updated with `Site` table
- [x] Migration applied successfully
- [x] `render.yaml` updated with mobile env vars

### Mobile App Components
- [x] GPS tracking service with smart trip detection
- [x] GPSTrackingButton component
- [x] CIS tax savings calculator
- [x] 24-month rule monitoring
- [x] Site management with geofencing
- [x] Offline SQLite storage architecture
- [x] Mobile package.json with Capacitor dependencies

---

## 📱 Phone Testing Steps

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Set Up Environment
Create `mobile/.env.local`:
```
VITE_API_URL=https://mileage-tracker-api.onrender.com/api
VITE_ENABLE_GPS=true
VITE_SYNC_INTERVAL=30000
```

### Step 3: Build Web Assets
```bash
npm run build
```

### Step 4: Initialize Capacitor (First Time Only)
```bash
# For Android
npx cap add android

# For iOS (Mac only)
npx cap add ios
```

### Step 5: Sync Native Projects
```bash
npx cap sync
```

### Step 6: Open in IDE
```bash
# Android (opens Android Studio)
npx cap open android

# iOS (opens Xcode - Mac only)
npx cap open ios
```

### Step 7: Run on Physical Device

**Android:**
1. Enable USB debugging on your phone (Settings > Developer Options)
2. Connect phone via USB
3. Click "Run" in Android Studio
4. Select your device from the dropdown

**iOS:**
1. Connect iPhone via USB
2. In Xcode: Window > Devices and Simulators
3. Select your device
4. Click the Run button (▶)
5. May need to trust the developer certificate on your phone

---

## 🔍 Testing Checklist

### GPS Tracking Tests
| Test | Expected Result |
|------|-----------------|
| Drive >5mph for 30s | Trip auto-starts, button turns red with pulse |
| Stop for 5+ minutes | Trip auto-ends, saved to local SQLite |
| Airplane mode during trip | Trip saved locally, syncs when back online |
| Battery usage | <10% per hour of tracking |
| Distance accuracy | Within 5% of actual distance |

### CIS Features Tests
| Test | Expected Result |
|------|-----------------|
| Complete trip | Shows "This trip saved you £X.XX in tax" |
| Site >18 months old | Shows amber warning badge |
| Site >23 months old | Shows red warning badge |
| Site >24 months old | Shows "EXPIRED" - mileage not claimable |

### Offline Sync Tests
| Test | Expected Result |
|------|-----------------|
| Create trip offline | Saved to SQLite, shows "Pending sync" |
| Add receipt offline | Queued for upload |
| Return online | Auto-sync within 30 seconds |
| Close app while offline | Data persists in SQLite |

---

## 🚀 Deploy to Render (Before Phone Testing)

### Option 1: Manual Deploy via Dashboard
1. Push code to GitHub:
   ```bash
   git push origin master
   ```

2. Go to https://dashboard.render.com

3. Create Web Service:
   - Connect your GitHub repo
   - Name: `mileage-tracker-api`
   - Build: `cd backend && npm install && npx prisma generate`
   - Start: `cd backend && npm start`

4. Add environment variables from `DEPLOY.md`

5. Create PostgreSQL database (or use Neon)

6. Run migrations:
   ```bash
   # In Render shell
   cd backend
   npx prisma migrate deploy
   ```

### Option 2: Deploy Button (Blueprints)
Use the `render.yaml` in the repo for one-click deploy.

---

## 🔧 Common Issues

### "capacitor.config.json not found"
Create `mobile/capacitor.config.json`:
```json
{
  "appId": "com.cismileage.app",
  "appName": "CIS Mileage Tracker",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

### "Gradle sync failed" (Android)
1. In Android Studio: File > Sync Project with Gradle Files
2. Check that `minSdkVersion` is 22 or higher in `build.gradle`

### "Developer not trusted" (iOS)
1. On iPhone: Settings > General > VPN & Device Management
2. Tap your developer certificate > Trust

### GPS not working
- Ensure location permissions granted
- Check that `AndroidManifest.xml` includes:
  ```xml
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  ```

---

## 📊 Expected Timeline

| Task | Time |
|------|------|
| Install dependencies | 2-3 min |
| Build web assets | 30 sec |
| Add Android platform | 1 min |
| First Android build | 3-5 min |
| Deploy to Render | 5-10 min |
| **Total to first test** | **~15 min** |

---

## 🎯 Success Criteria

Before calling it "working on my phone":

- [ ] App opens without crashes
- [ ] Can login/register
- [ ] GPS button responds to touch (glove-friendly size)
- [ ] Trip auto-starts when driving
- [ ] Trip auto-ends when parked
- [ ] Distance matches car odometer (±5%)
- [ ] CIS tax savings displayed correctly
- [ ] Works offline (airplane mode test)
- [ ] Syncs when back online
- [ ] Battery drain acceptable

---

## 📝 Debug Tips

### View logs while testing:
**Android:**
```bash
adb logcat | grep -i "capacitor\|mileage"
```

**iOS:**
- In Xcode: Window > Devices and Simulators > Open Console
- Or use Safari Developer Tools

### Check API connectivity:
```bash
curl https://your-api.render.com/health
```

### Verify database:
```bash
# In Render shell
cd backend
npx prisma studio
```
