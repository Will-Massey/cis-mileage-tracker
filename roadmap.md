# UK Mileage Tracking App - Development Roadmap

## Product Vision

Build the UK's leading mileage tracking app specifically designed for CIS contractors and self-employed professionals, combining HMRC-compliant mileage tracking with construction-specific features and seamless accountant integration.

---

## Phase 1: MVP - Foundation (Months 1-3)

### Goal
Launch a functional, HMRC-compliant mileage tracking app that solves the core problem for UK contractors.

### Key Deliverables

#### Month 1: Core Infrastructure
**Development Focus**: Backend, database, basic tracking

**Features**:
- [ ] User authentication (email, Google, Apple)
- [ ] Database schema design (users, trips, vehicles, sites)
- [ ] Background GPS tracking service (iOS & Android)
- [ ] Minimum speed threshold (5 mph)
- [ ] Automatic trip start/stop detection
- [ ] Basic trip storage with GPS points

**Technical Decisions**:
- Framework: React Native (cross-platform)
- Backend: Node.js + Express
- Database: PostgreSQL
- Maps: Google Maps SDK
- Hosting: AWS or Google Cloud

**Success Criteria**:
- App tracks trips automatically
- Battery usage < 5% per hour
- Trip accuracy within 5%

---

#### Month 2: User Experience & Compliance
**Development Focus**: UI/UX, HMRC compliance

**Features**:
- [ ] Trip list view with swipe classification
- [ ] HMRC-compliant trip details form
  - Date, start/end locations with postcodes
  - Purpose field
  - Miles calculation
- [ ] 45p/25p automatic rate calculation
- [ ] Cumulative mileage tracker (tax year)
- [ ] Vehicle management (add/edit vehicles)
- [ ] Basic PDF report export

**UI/UX Deliverables**:
- Design system (colours, typography, components)
- Trip list screen
- Trip detail/edit screen
- Settings/Profile screen
- Report generation screen

**Success Criteria**:
- User can classify trip in < 3 seconds
- Report contains all HMRC required fields
- App passes HMRC compliance review

---

#### Month 3: Integration & Polish
**Development Focus**: Accounting integration, testing, launch prep

**Features**:
- [ ] Xero OAuth integration
- [ ] Publish mileage to Xero as expense claim
- [ ] CSV/Excel export
- [ ] Offline mode (store trips locally, sync later)
- [ ] App store submission prep
- [ ] Beta testing with 10-20 contractors

**Testing**:
- Unit tests (80%+ coverage)
- Integration tests
- User acceptance testing
- Battery/performance testing

**Launch Deliverables**:
- App Store listing (iOS)
- Google Play listing (Android)
- Landing page website
- Basic help documentation

**Success Criteria**:
- Xero integration working end-to-end
- 50+ beta users actively tracking
- App store approval

---

### Phase 1 Budget Estimate
- Development: £45,000 - £60,000
- Design: £8,000 - £12,000
- Infrastructure: £500/month
- Total: ~£60,000 - £75,000

### Phase 1 Team
- 1 Full-stack developer
- 1 Mobile developer (React Native)
- 1 UI/UX designer
- 1 QA tester (part-time)

---

## Phase 2: Differentiation (Months 4-6)

### Goal
Add CIS-specific features that differentiate from generic mileage apps and increase user value.

### Key Deliverables

#### Month 4: CIS Features
**Development Focus**: CIS contractor-specific functionality

**Features**:
- [ ] CIS tax savings calculator
  - Input gross payment and CIS rate
  - Calculate tax saved from mileage
  - Display "This trip saved you £X"
- [ ] Year-to-date tax savings dashboard
- [ ] Construction site address management
  - Save site addresses with names
  - Quick-select for trip classification
- [ ] Site visit history

**User Value**:
- Clear visibility of tax savings
- Reduced classification time
- Better record keeping

---

#### Month 5: Enhanced Tracking
**Development Focus**: Advanced tracking features

**Features**:
- [ ] Work hours auto-classification
  - Set work schedule
  - Auto-classify trips within hours
- [ ] Route visualization on map
  - Show actual route taken
  - GPS breadcrumbs
- [ ] Multi-stop trip support
  - Track site-to-site travel
  - Split long trips into segments
- [ ] Fuel purchase tracking
  - Record fuel costs
  - Calculate MPG

**Technical Additions**:
- Map route rendering
- Enhanced GPS point storage
- Fuel expense data model

---

#### Month 6: Expense Integration
**Development Focus**: Receipt capture and expense tracking

**Features**:
- [ ] Receipt photo capture
- [ ] Basic OCR (amount, date, merchant)
- [ ] Link receipts to trips
- [ ] Categorize expenses (fuel, materials, tools, PPE)
- [ ] Job costing (basic)
  - Create jobs
  - Assign expenses to jobs
- [ ] QuickBooks and Sage integration

**OCR Solution**:
- Start with Google Vision API
- Train custom model later if needed

**Success Criteria**:
- OCR accuracy > 80%
- 3 accounting integrations live
- Users can track materials + mileage

---

### Phase 2 Budget Estimate
- Development: £40,000 - £50,000
- OCR/API costs: £1,000/month
- Total: ~£45,000 - £55,000

### Phase 2 Team
- 2 Full-stack developers
- 1 Mobile developer
- 1 UI/UX designer
- 1 QA tester

---

## Phase 3: Scale & Optimize (Months 7-9)

### Goal
Add advanced features, improve retention, and prepare for scale.

### Key Deliverables

#### Month 7: Compliance & Intelligence
**Development Focus**: Advanced compliance and automation

**Features**:
- [ ] 24-month rule monitoring
  - Track site first visit date
  - Alerts at 18 and 23 months
  - 40% time rule tracking
- [ ] Duplicate trip detection
- [ ] Bulk classification rules
  - "Always business to Site X"
  - Machine learning from patterns
- [ ] VAT calculation for registered users
  - Advisory Fuel Rate integration
  - VAT reclaim report

**ML/AI Introduction**:
- Pattern recognition for auto-classification
- Anomaly detection for duplicates

---

#### Month 8: Accountant Features
**Development Focus**: Accountant integration and team features

**Features**:
- [ ] Accountant portal
  - Accountant invitation system
  - Multi-client dashboard
  - Bulk export
- [ ] Review and approval workflow
- [ ] Notes and queries system
- [ ] Team management (basic)
  - Add team members
  - View team mileage

**B2B Expansion**:
- Target accounting firms
- Partner program development

---

#### Month 9: Performance & Polish
**Development Focus**: Optimization and user experience

**Features**:
- [ ] App performance optimization
- [ ] Battery usage reduction
- [ ] Enhanced offline mode
- [ ] Push notifications
  - Daily reminder to classify trips
  - Weekly summary
  - Tax year-end reminder
- [ ] In-app help and tutorials
- [ ] Customer support integration

**Success Metrics**:
- App load time < 2 seconds
- Battery usage < 3% per hour
- User retention > 60% at 30 days

---

### Phase 3 Budget Estimate
- Development: £35,000 - £45,000
- ML infrastructure: £2,000/month
- Total: ~£40,000 - £50,000

---

## Phase 4: Premium & Enterprise (Months 10-12)

### Goal
Launch premium features and enterprise offering for larger contractor firms.

### Key Deliverables

#### Month 10: Advanced Features
**Development Focus**: Premium functionality

**Features**:
- [ ] Route optimization
  - Multi-stop route planning
  - Time/distance savings calculation
- [ ] Advanced AI receipt categorization
  - Train custom model
  - Construction-specific categories
- [ ] Retrospective trip recovery
  - Google Maps Timeline import
  - Calendar integration
- [ ] iBeacon hardware integration (optional)

**Hardware Partnership**:
- Partner with beacon manufacturer
- Or build custom hardware

---

#### Month 11: Enterprise Features
**Development Focus**: Team and enterprise functionality

**Features**:
- [ ] Advanced team management
  - Role-based permissions
  - Department/group organization
- [ ] Approval workflows
  - Manager approval for claims
  - Expense policy enforcement
- [ ] Consolidated reporting
  - Company-wide mileage reports
  - Cost center allocation
- [ ] API for enterprise integrations

**Enterprise Sales**:
- Dedicated sales process
- Custom onboarding
- SLA agreements

---

#### Month 12: Scale & Expansion
**Development Focus**: Growth and market expansion

**Features**:
- [ ] Web dashboard (full-featured)
- [ ] Advanced analytics
  - Mileage trends
  - Cost analysis
  - Tax savings over time
- [ ] Integration marketplace
  - Job management software
  - Construction-specific tools
- [ ] White-label option

**Market Expansion**:
- Ireland (similar tax system)
- Consider other English-speaking markets

---

### Phase 4 Budget Estimate
- Development: £50,000 - £70,000
- Hardware (if building): £20,000
- Total: ~£55,000 - £75,000

---

## Full Year Summary

### Timeline Overview

```
Month:  1   2   3   4   5   6   7   8   9   10  11  12
        |---MVP---|----Differentiation----|----Scale----|--Premium--|
        
Launch:     v MVP Launch
                v CIS Features
                        v Expense Integration
                                    v Accountant Portal
                                            v Premium Launch
```

### Budget Summary

| Phase | Duration | Budget Range |
|-------|----------|--------------|
| Phase 1: MVP | Months 1-3 | £60,000 - £75,000 |
| Phase 2: Differentiation | Months 4-6 | £45,000 - £55,000 |
| Phase 3: Scale | Months 7-9 | £40,000 - £50,000 |
| Phase 4: Premium | Months 10-12 | £55,000 - £75,000 |
| **Total Year 1** | | **£200,000 - £255,000** |

### Team Growth

| Month | Team Size | Roles |
|-------|-----------|-------|
| 1-3 | 3.5 | 2 devs, 1 designer, 0.5 QA |
| 4-6 | 5 | 3 devs, 1 designer, 1 QA |
| 7-9 | 6 | 3 devs, 1 designer, 1 QA, 1 PM |
| 10-12 | 8 | 4 devs, 1 designer, 1 QA, 1 PM, 1 sales |

---

## Key Milestones & Success Metrics

### Launch Milestones

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| MVP Beta | Month 2 | 20 active beta users |
| App Store Launch | Month 3 | Live on iOS & Android |
| 100 Users | Month 4 | 100 registered users |
| 1,000 Users | Month 6 | 1,000 registered users |
| 5,000 Users | Month 9 | 5,000 registered users |
| 10,000 Users | Month 12 | 10,000 registered users |

### Engagement Metrics

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Daily Active Users | 30% | 40% | 50% |
| Monthly Active Users | 60% | 70% | 75% |
| Trips per user/month | 20 | 25 | 30 |
| Classification rate | 70% | 80% | 85% |

### Revenue Targets

| Metric | Month 6 | Month 12 |
|--------|---------|----------|
| Free Users | 800 | 7,000 |
| Paid Users | 200 | 3,000 |
| MRR | £800 | £12,000 |
| ARR | £9,600 | £144,000 |

*Assuming £4/month average revenue per paid user*

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| GPS accuracy issues | Test extensively; use accelerometer fusion; provide manual correction |
| Battery drain | Optimize location updates; offer manual tracking option; educate users |
| iOS/Android differences | React Native helps; thorough testing on both platforms |
| Scaling issues | Cloud infrastructure; database optimization; caching |

### Market Risks

| Risk | Mitigation |
|------|------------|
| Competitor response | Focus on CIS niche; build community; excellent support |
| Low adoption | Free tier; partner with accountants; content marketing |
| Price sensitivity | Start low; demonstrate value; tiered pricing |

### Compliance Risks

| Risk | Mitigation |
|------|------------|
| HMRC rules change | Build flexible rate system; monitor HMRC updates |
| Audit rejection | Clear documentation; accurate tracking; user education |
| Data privacy | GDPR compliance; secure storage; clear privacy policy |

---

## Go-to-Market Strategy

### Phase 1: Launch (Months 1-3)
- Beta testing with personal network
- App store optimization
- Basic landing page with SEO
- Social media presence

### Phase 2: Growth (Months 4-6)
- Content marketing (CIS guides, tax tips)
- Accountant partnership program
- Construction industry forums/groups
- Google Ads (targeted)

### Phase 3: Scale (Months 7-9)
- Referral program
- Case studies and testimonials
- Construction trade show presence
- Expanded paid advertising

### Phase 4: Enterprise (Months 10-12)
- Direct sales to large contractors
- Accountant firm partnerships
- White-label opportunities
- API/developer program

---

## Conclusion

This roadmap provides a structured 12-month path from MVP to a feature-rich, market-leading mileage tracking app for UK CIS contractors. The phased approach allows for:

1. **Early validation** with MVP launch
2. **Differentiation** through CIS-specific features
3. **Retention** through enhanced functionality
4. **Growth** through premium and enterprise offerings

Success depends on:
- Maintaining HMRC compliance as foundation
- Building strong accountant relationships
- Focusing on the underserved CIS market
- Delivering exceptional user experience

Total Year 1 investment: £200,000 - £255,000
Target Year 1 ARR: £144,000
Break-even: Month 18-24 (projected)
