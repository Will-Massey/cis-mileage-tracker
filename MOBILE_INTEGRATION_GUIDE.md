# Mobile App Integration Guide

This guide explains how to integrate the new mobile app (Capacitor) with the existing mileage tracker backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│                    (Capacitor + React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GPS Tracking │  │ Local SQLite │  │   UI comps   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
│                    ┌──────────────┐                            │
│                    │ Sync Service │                            │
│                    └──────────────┘                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS/JSON
┌───────────────────────────┼─────────────────────────────────────┐
│                      BACKEND API                                 │
│                   (Node.js/Express)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Auth API    │  │  Trips API   │  │  Sites API   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                           │                                     │
│                    ┌──────────────┐                            │
│                    │  PostgreSQL  │                            │
│                    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Integration

### Step 1: Update Backend API

Add new endpoints to support mobile features:

#### 1.1 Bulk Sync Endpoint
`POST /api/trips/sync`

Accepts multiple trips from mobile device:

```javascript
// backend/src/routes/trips.js
router.post('/sync', authenticate, async (req, res) => {
  const { trips } = req.body;
  const results = [];
  
  for (const tripData of trips) {
    try {
      // Check for conflicts (trip with same ID)
      const existing = await prisma.trip.findUnique({
        where: { id: tripData.id }
      });
      
      if (existing) {
        // Update if mobile version is newer
        if (new Date(tripData.updatedAt) > existing.updatedAt) {
          await prisma.trip.update({
            where: { id: tripData.id },
            data: tripData
          });
        }
      } else {
        // Create new trip
        await prisma.trip.create({
          data: {
            ...tripData,
            userId: req.user.id
          }
        });
      }
      
      results.push({ id: tripData.id, status: 'synced' });
    } catch (error) {
      results.push({ id: tripData.id, status: 'error', error: error.message });
    }
  }
  
  res.json({ synced: results.length, results });
});
```

#### 1.2 Sites API
`GET /api/sites` - List user's sites
`POST /api/sites` - Create new site
`PUT /api/sites/:id` - Update site
`DELETE /api/sites/:id` - Delete site

```javascript
// backend/src/routes/sites.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../config/database');

// Get all sites for user
router.get('/', authenticate, async (req, res) => {
  const sites = await prisma.site.findMany({
    where: { userId: req.user.id, isActive: true },
    orderBy: { visitCount: 'desc' }
  });
  res.json(sites);
});

// Create site
router.post('/', authenticate, async (req, res) => {
  const site = await prisma.site.create({
    data: {
      ...req.body,
      userId: req.user.id,
      firstVisitDate: new Date()
    }
  });
  res.status(201).json(site);
});

module.exports = router;
```

#### 1.3 Receipts API
`POST /api/receipts` - Upload receipt
`GET /api/receipts` - List receipts
`GET /api/receipts/:id/download` - Download receipt

```javascript
// backend/src/routes/receipts.js
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticate, upload.single('receipt'), async (req, res) => {
  const { tripId, description, amount, category } = req.body;
  const file = req.file;
  
  // Upload to S3
  const key = `receipts/${req.user.id}/${Date.now()}_${file.originalname}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));
  
  // Save to database
  const receipt = await prisma.receipt.create({
    data: {
      userId: req.user.id,
      tripId,
      filename: file.originalname,
      storageKey: key,
      fileType: file.mimetype,
      fileSize: file.size,
      description,
      amount: parseFloat(amount),
      category
    }
  });
  
  res.status(201).json(receipt);
});
```

### Step 2: Update Database Schema

Add new tables to Prisma schema:

```prisma
// backend/src/models/prisma/schema.prisma

model Site {
  id              String   @id @default(uuid())
  userId          String
  name            String
  address         String
  postcode        String?
  latitude        Float?
  longitude       Float?
  radius          Int      @default(100)
  firstVisitDate  DateTime
  lastVisitDate   DateTime?
  visitCount      Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, name])
  @@index([userId])
}

model Receipt {
  id           String   @id @default(uuid())
  userId       String
  tripId       String?
  filename     String
  storageKey   String
  fileType     String
  fileSize     Int
  description  String?
  amount       Float?
  merchant     String?
  receiptDate  DateTime?
  category     String?
  ocrData      Json?
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  trip Trip? @relation(fields: [tripId], references: [id])
  
  @@index([userId])
  @@index([tripId])
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_sites_and_receipts
```

### Step 3: Integrate Mobile App

#### 3.1 Update Existing Frontend

Copy mobile components to existing frontend:

```bash
# Copy mobile services
cp -r mobile/src/services/* frontend/src/services/

# Copy mobile components
cp -r mobile/src/components/* frontend/src/components/

# Copy hooks
cp mobile/src/hooks/* frontend/src/hooks/

# Copy utils
cp mobile/src/utils/CISCalculator.js frontend/src/utils/
```

#### 3.2 Create Mobile Entry Point

Create `frontend/src/MobileApp.jsx`:

```jsx
import React, { useEffect } from 'react';
import { gpsTrackingService } from './services/GPSTrackingService';
import GPSTrackingButton from './components/GPSTrackingButton';
import CISSavingsCard from './components/CISSavingsCard';
import SiteManager from './components/SiteManager';

const MobileApp = () => {
  useEffect(() => {
    // Initialize GPS tracking
    gpsTrackingService.initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">CIS Mileage Tracker</h1>
        <p className="text-sm opacity-80">Track your business miles</p>
      </header>

      <main className="p-4 space-y-6">
        {/* Tax Savings Card */}
        <CISSavingsCard
          totalMiles={8500}
          totalClaim={3250.00}
          taxSaved={650.00}
          cisRate="20%"
        />

        {/* Site Management */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Sites</h2>
          <SiteManager />
        </div>
      </main>

      {/* GPS Tracking Button (Fixed at bottom) */}
      <GPSTrackingButton />
    </div>
  );
};

export default MobileApp;
```

#### 3.3 Update Routes

Modify `frontend/src/routes.jsx`:

```jsx
import MobileApp from './MobileApp';

// Add mobile route
<Route path="/mobile" element={<MobileApp />} />
```

### Step 4: Environment Configuration

Create `.env` for mobile:

```bash
# frontend/.env
REACT_APP_API_URL=https://your-api.com/api
REACT_APP_ENABLE_GPS=true
REACT_APP_GOOGLE_VISION_API_KEY=your_key_here
```

### Step 5: Build and Deploy

#### 5.1 Build Web App
```bash
cd frontend
npm run build
```

#### 5.2 Initialize Capacitor
```bash
npx cap init
```

#### 5.3 Add Platforms
```bash
npx cap add android
npx cap add ios
```

#### 5.4 Sync Code
```bash
npx cap sync
```

#### 5.5 Open and Build
```bash
# iOS
npx cap open ios

# Android
npx cap open android
```

## API Reference

### Trip Sync Format

```json
{
  "trips": [
    {
      "id": "trip_123456",
      "startTime": "2024-03-30T08:00:00Z",
      "endTime": "2024-03-30T08:30:00Z",
      "startLocation": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "address": "Home Address"
      },
      "endLocation": {
        "latitude": 51.5200,
        "longitude": -0.1300,
        "address": "Construction Site"
      },
      "distance": 12.5,
      "purpose": "Site visit",
      "vehicleId": "veh_123",
      "amount": 5.63,
      "rateApplied": 0.45,
      "taxYear": "2024-25",
      "createdAt": "2024-03-30T08:00:00Z",
      "updatedAt": "2024-03-30T08:30:00Z"
    }
  ]
}
```

### Site Format

```json
{
  "id": "site_123456",
  "name": "Smith Residence",
  "address": "123 Main St, London",
  "postcode": "SW1A 1AA",
  "latitude": 51.5200,
  "longitude": -0.1300,
  "radius": 100,
  "firstVisitDate": "2024-01-15T00:00:00Z",
  "lastVisitDate": "2024-03-30T00:00:00Z",
  "visitCount": 15
}
```

## Testing Integration

### 1. Test Sync
1. Record trip on mobile (offline)
2. Verify trip in local SQLite
3. Go online
4. Verify trip appears in backend

### 2. Test Sites
1. Create site on mobile
2. Verify site syncs to backend
3. Check 24-month rule calculation

### 3. Test Receipts
1. Capture receipt on mobile
2. Verify OCR extracts data
3. Check receipt uploads to S3
4. Verify database entry

## Troubleshooting

### Sync Failures
- Check network connectivity
- Verify auth token not expired
- Check server logs for errors
- Verify CORS settings

### GPS Issues
- Check location permissions
- Verify background location enabled
- Check battery optimization settings
- Test on physical device (not emulator)

### Database Errors
- Run migrations: `npx prisma migrate dev`
- Check connection string
- Verify permissions

## Performance Optimization

### Backend
- Add indexes for frequent queries
- Implement request rate limiting
- Use connection pooling
- Enable caching for read operations

### Mobile
- Batch sync operations
- Compress images before upload
- Use lazy loading for lists
- Implement virtual scrolling

## Security Considerations

1. **Authentication**
   - Use JWT with short expiry
   - Implement refresh tokens
   - Store tokens securely

2. **Data Encryption**
   - HTTPS for all API calls
   - Encrypt local SQLite database
   - Secure file storage

3. **Privacy**
   - Anonymize location data
   - Implement data retention policies
   - Provide data export/deletion

## Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Database migrations applied
- [ ] S3 bucket configured
- [ ] Environment variables set
- [ ] Mobile app built
- [ ] iOS app tested on device
- [ ] Android app tested on device
- [ ] App store submissions prepared
- [ ] Documentation updated

## Support

For integration issues:
1. Check server logs
2. Review mobile console logs
3. Test API endpoints with curl/Postman
4. Verify environment configuration
