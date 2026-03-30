# GPS Tracking Implementation Guide

## Overview
This document outlines the GPS tracking implementation using Capacitor for the CIS Mileage Tracker app.

## Architecture

### Technology Stack
- **Capacitor**: Cross-platform mobile runtime
- **@capacitor-community/background-geolocation**: Background tracking plugin
- **@capacitor/geolocation**: Foreground tracking
- **@capacitor-community/sqlite**: Local SQLite database
- **Workbox**: PWA offline support

### Trip Detection Algorithm

```
1. Background location updates every 30 seconds
2. Speed threshold: > 5 mph (filter walking)
3. Trip Start: Speed > 5 mph for 30 seconds
4. Trip End: Stationary for 5+ minutes
5. Minimum trip distance: 0.5 miles
6. Save to local SQLite database
7. Sync to cloud when online
```

## Implementation Steps

### 1. Install Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor-community/background-geolocation
npm install @capacitor/geolocation
npm install @capacitor-community/sqlite
npm install @capacitor/app
npm install @capacitor/preferences
```

### 2. Initialize Capacitor
```bash
npx cap init
```

### 3. Build for Mobile
```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

## Battery Optimization

### iOS
- Use `significantLocationChanges` for power efficiency
- Disable continuous tracking when not needed
- Use geofencing for known sites

### Android
- Use Fused Location Provider
- Batch location updates
- Use foreground service with notification

## Privacy & Compliance

### GDPR Considerations
- Explicit consent required for location tracking
- Clear privacy policy explaining data use
- Option to delete location history
- Data retention: 6 years (HMRC requirement), then delete

### User Consent Flow
1. Explain why location is needed
2. Request permission
3. Show settings to control tracking
4. Allow pause/resume tracking

## Testing

### Device Testing Checklist
- [ ] iOS 15+ (iPhone 8 or newer)
- [ ] Android 10+ (various manufacturers)
- [ ] Battery drain < 5% per hour
- [ ] Works offline
- [ ] Accurate distance calculation
- [ ] Trip end detection works
- [ ] Background tracking survives app kill

## Performance Targets
- GPS accuracy: ±10 meters
- Trip detection: < 60 seconds delay
- Battery usage: < 5% per hour
- Sync time: < 5 seconds when online
