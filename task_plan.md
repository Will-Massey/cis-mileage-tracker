# Task Plan: CIS Mileage Tracker - Full Featured App

## Goal
Build a complete, production-ready mileage tracking app for UK CIS (Construction Industry Scheme) contractors with GPS auto-tracking, beautiful mobile UI, offline mode, and CIS-specific features including tax savings calculator, 24-month rule monitoring, and site management.

## Success Criteria
- [ ] GPS auto-tracking works on iOS and Android
- [ ] Beautiful, intuitive mobile-first UI
- [ ] HMRC-compliant calculations (45p/25p)
- [ ] CIS tax savings calculator
- [ ] 24-month rule monitoring
- [ ] Site address management with geofencing
- [ ] Offline mode for construction sites
- [ ] Receipt capture with OCR
- [ ] Accountant portal
- [ ] Xero/QuickBooks integration
- [ ] PWA installable on phones

## Phases

### Phase 1: GPS Tracking System ✅ COMPLETE
- [x] Research GPS tracking libraries (Capacitor, React Native, or PWA Geolocation)
- [x] Implement background location tracking
- [x] Build trip detection algorithm (speed threshold, stationary detection)
- [x] Create trip recording service
- [x] Test battery optimization

### Phase 2: Beautiful Mobile UI ✅ COMPLETE
- [x] Design system with construction-friendly colors (high visibility)
- [x] Large touch targets (48px+)
- [x] Swipe trip classification (MileIQ-style)
- [x] Dashboard with big numbers
- [x] Dark mode for outdoor visibility
- [x] Offline indicator

### Phase 3: CIS-Specific Features ✅ COMPLETE
- [x] CIS tax savings calculator (20%/30% deductions)
- [x] 24-month rule monitoring with alerts
- [x] Site address database
- [x] Geofencing for auto-classification
- [x] Home-to-site travel tracking
- [x] Material expense + mileage combined view

### Phase 4: Offline & Sync ✅ COMPLETE (SQLite Implementation)
- [x] Local storage for trips (SQLite with Capacitor)
- [x] Offline queue system
- [x] Background sync when connection restored
- [x] Conflict resolution framework
- [x] Receipt local storage

### Phase 5: Receipt Capture ✅ COMPLETE
- [x] Camera integration (Capacitor Camera)
- [x] Receipt upload to S3/R2
- [x] OCR with Google Vision API
- [x] Auto-link to trips
- [x] Category selection (Fuel, Materials, Tools, PPE)

### Phase 6: Accountant Portal
- [ ] Multi-client dashboard
- [ ] Bulk export (CSV/PDF)
- [ ] Review and approval workflow
- [ ] Notes and queries

### Phase 7: Integrations
- [ ] Xero OAuth integration
- [ ] QuickBooks OAuth integration
- [ ] Auto-publish expenses
- [ ] Bank feed matching

### Phase 8: Polish & Deploy
- [ ] Performance optimization
- [ ] Testing on real devices
- [ ] App store submission (if native)
- [ ] Production deployment

## Status
**Started:** 2026-03-30
**Current Phase:** 6 - Accountant Portal (Next)
**Phases Completed:** 5 of 8
**Last Updated:** 2026-03-30

### Completed Work Summary
- ✅ **15 new files created** (~3,500+ lines of code)
- ✅ **6 major UI components** built
- ✅ **3 core services** implemented
- ✅ **Full GPS tracking** with background location
- ✅ **CIS tax calculator** with real-time savings
- ✅ **24-month rule monitoring** for HMRC compliance
- ✅ **Site management** with geofencing
- ✅ **Receipt capture** with OCR
- ✅ **Offline-first architecture** with SQLite
- ✅ **Complete integration guide** for backend connection

## Context
- Target: 1.5M UK CIS contractors
- Key pain point: Manual logging on construction sites
- Differentiator: CIS-specific features (tax calc, 24-month rule)
- Tech: React + Capacitor for mobile, Node.js backend

## Resources
- Existing backend: Node.js/Express with PostgreSQL
- Existing frontend: React (needs mobile optimization)
- API documentation: api-spec.md
- CIS requirements: cis-market-requirements.md

## Notes
- Use 2-Action Rule: Save findings after every 2 operations
- Log all errors to avoid repetition
- Never repeat failed approaches
- Test on actual construction sites if possible
- Prioritize offline functionality - sites have poor signal
