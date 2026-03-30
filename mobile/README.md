# CIS Mileage Tracker - Mobile App

A Capacitor-based mobile application for UK CIS (Construction Industry Scheme) contractors to track mileage, manage construction sites, and calculate tax savings.

## Features

### 🎯 GPS Auto-Tracking
- **Background location tracking** - Automatically records trips
- **Smart trip detection** - Detects starts/stops based on speed and time
- **Battery optimized** - 30-second intervals with movement detection
- **Offline capable** - Stores trips locally, syncs when online

### 💰 CIS Tax Savings Calculator
- **Real-time savings display** - See tax saved as you drive
- **CIS rate support** - 20%, 30%, or Gross payment status
- **Year-to-date tracking** - Monitor annual savings
- **10,000 mile threshold** - Visual progress to rate change

### 🏗️ Construction Site Management
- **Site address database** - Save frequently visited sites
- **Geofencing** - Auto-detect site arrivals/departures
- **24-month rule monitoring** - HMRC compliance alerts
  - Warning at 18 months
  - Urgent at 23 months
  - Expired status after 24 months

### 📸 Receipt Capture
- **Camera integration** - Capture fuel and material receipts
- **OCR (Optical Character Recognition)** - Auto-extract data
- **Categories** - Fuel, Materials, Tools, PPE, Parking, Other
- **Linked to trips** - Associate receipts with specific journeys

### 📱 Beautiful Mobile UI
- **Large touch targets** - Easy to use with work gloves
- **High contrast** - Visible in bright sunlight
- **Swipe classification** - MileIQ-style business/personal swipe
- **Dark mode support** - For outdoor visibility

## Technology Stack

- **Framework**: Capacitor + React
- **Local Storage**: SQLite (via @capacitor-community/sqlite)
- **GPS**: @capacitor-community/background-geolocation
- **Camera**: @capacitor/camera
- **OCR**: Google Vision API

## Installation

### Prerequisites
```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Install dependencies
npm install
```

### Setup

1. **Install Capacitor plugins:**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor-community/background-geolocation
npm install @capacitor/geolocation
npm install @capacitor-community/sqlite
npm install @capacitor/camera
npm install @capacitor/preferences
npm install @capacitor/app
```

2. **Initialize Capacitor:**
```bash
npx cap init
```

3. **Build the web app:**
```bash
npm run build
```

4. **Add mobile platforms:**
```bash
npx cap add android
npx cap add ios
```

5. **Sync web code to native projects:**
```bash
npx cap sync
```

## Running on Device

### iOS
```bash
npx cap open ios
# Then run from Xcode
```

### Android
```bash
npx cap open android
# Then run from Android Studio
```

## Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   ├── GPSTrackingButton.jsx    # Main tracking control
│   │   ├── CISSavingsCard.jsx       # Tax savings display
│   │   ├── SwipeableTripCard.jsx    # Trip list with swipe
│   │   ├── ReceiptCapture.jsx       # Camera & OCR
│   │   └── SiteManager.jsx          # Site management UI
│   │
│   ├── services/
│   │   ├── GPSTrackingService.js    # GPS & trip detection
│   │   ├── SQLiteService.js         # Local database
│   │   └── SiteManagementService.js # Site & 24-month rule
│   │
│   ├── hooks/
│   │   └── useGPSTracking.js        # React hook for GPS
│   │
│   └── utils/
│       └── CISCalculator.js         # Tax calculations
│
├── android/                         # Android project
├── ios/                             # iOS project
└── README.md
```

## Key Components

### GPSTrackingButton
Main control for starting/stopping GPS tracking with visual feedback.

```jsx
import GPSTrackingButton from './components/GPSTrackingButton';

<GPSTrackingButton 
  onStatusChange={({ event, data, isTracking }) => {
    console.log(event, data);
  }}
/>
```

### CISSavingsCard
Displays tax savings with progress to 10,000 mile threshold.

```jsx
import CISSavingsCard from './components/CISSavingsCard';

<CISSavingsCard
  totalMiles={8500}
  totalClaim={3250.00}
  taxSaved={650.00}
  cisRate="20%"
  monthlyMiles={1200}
  monthlyClaim={480.00}
  monthlyTaxSaved={96.00}
/>
```

### SwipeableTripCard
Trip list item with MileIQ-style swipe classification.

```jsx
import SwipeableTripCard from './components/SwipeableTripCard';

<SwipeableTripCard
  trip={trip}
  onClassify={(tripId, category) => {
    // category: 'business' | 'personal'
  }}
  onEdit={(trip) => {}}
  onDelete={(trip) => {}}
/>
```

### SiteManager
Construction site management with 24-month rule monitoring.

```jsx
import SiteManager from './components/SiteManager';

<SiteManager
  onSiteSelect={(site) => {
    console.log('Selected site:', site);
  }}
/>
```

## GPS Configuration

### iOS Permissions
Add to `ios/App/App/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track business mileage for tax purposes.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need background location to automatically record your trips even when the app is closed.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Background location is required for automatic trip detection.</string>
```

### Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

## Trip Detection Algorithm

```
Speed Threshold: 5 mph (filters walking)
Trip Start: 30 seconds of movement above threshold
Trip End: 5 minutes stationary
Minimum Distance: 0.5 miles
Update Interval: 30 seconds
```

## 24-Month Rule

HMRC considers a workplace "temporary" if:
- You work there less than 24 months, OR
- You spend less than 40% of your time there

The app tracks:
- First visit date
- Days since first visit
- Warning at 18 months
- Urgent alert at 23 months
- Expired status after 24 months

## Database Schema

### Trips
- id, user_id, start_time, end_time
- start_lat, start_lng, start_address
- end_lat, end_lng, end_address
- distance, purpose, amount, rate_applied
- is_synced

### Sites
- id, user_id, name, address, postcode
- latitude, longitude, radius
- first_visit_date, last_visit_date, visit_count

### Receipts
- id, user_id, trip_id, filename
- amount, merchant, category, ocr_data
- is_synced

## API Integration

The mobile app syncs with the existing Node.js backend:

```javascript
// Environment variable
REACT_APP_API_URL=https://your-api.com/api

// Sync happens automatically when:
// 1. Trip ends
// 2. App comes to foreground
// 3. Device comes online
```

## Testing

### GPS Testing
1. Start tracking
2. Drive above 5 mph for 30+ seconds
3. Stop for 5+ minutes
4. Verify trip is created

### Offline Testing
1. Enable airplane mode
2. Record a trip
3. Verify trip saved locally
4. Disable airplane mode
5. Verify trip syncs

### 24-Month Rule Testing
1. Add a site with first visit 17 months ago
2. Verify "warning" status
2. Update to 23 months ago
3. Verify "urgent" status

## Troubleshooting

### GPS not tracking
- Check location permissions in device settings
- Verify background location permission granted
- Check battery optimization settings (disable for app)

### Trips not syncing
- Check internet connection
- Verify auth token is valid
- Check API URL configuration

### OCR not working
- Verify Google Vision API key is set
- Check camera permissions
- Ensure receipt is well-lit and in focus

## Performance

- Battery usage: < 5% per hour when tracking
- GPS accuracy: ±10 meters
- Sync time: < 5 seconds when online
- Local storage: Handles 10,000+ trips

## Roadmap

### Phase 4: Polish
- [ ] Push notifications for trip reminders
- [ ] Widget for quick trip start
- [ ] Siri Shortcuts / Google Assistant

### Phase 5: Accountant Portal
- [ ] Multi-client dashboard
- [ ] Bulk export (CSV/PDF)
- [ ] Review workflow

### Phase 6: Integrations
- [ ] Xero
- [ ] QuickBooks
- [ ] Sage

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.
