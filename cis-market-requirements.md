# UK CIS Market Requirements for Mileage Tracking

## Executive Summary

The Construction Industry Scheme (CIS) represents a significant market opportunity with over 1.5 million registered subcontractors in the UK. CIS contractors have unique requirements that current mileage tracking apps fail to address comprehensively. This document outlines the specific needs, compliance requirements, and opportunities for a CIS-focused mileage tracking solution.

---

## Understanding the CIS Market

### What is CIS?
The Construction Industry Scheme (CIS) is a HMRC scheme where contractors deduct money from subcontractors' payments and pass it to HMRC as advance tax payments. These deductions count toward the subcontractor's tax and National Insurance.

### CIS Deduction Rates
- **Registered Subcontractors**: 20% deduction
- **Unregistered Subcontractors**: 30% deduction
- **Gross Payment Status**: 0% deduction (qualified subcontractors)

### Market Size
- **Registered Subcontractors**: 1.5+ million
- **Monthly CIS Deductions**: £500+ million
- **Average Subcontractor**: Self-employed, mobile, multi-site workers

---

## CIS Contractor Profile

### Typical Characteristics
- **Employment Status**: Self-employed sole traders or limited companies
- **Work Pattern**: Multiple job sites per day/week
- **Vehicle Use**: Personal vehicles for business travel
- **Expense Tracking**: Manual or spreadsheet-based
- **Accountant Usage**: High (most use accountants for tax returns)
- **Tech Comfort**: Moderate (use smartphones, prefer simple apps)

### Daily Workflow
1. Travel to construction site (often different each day)
2. Purchase materials/tools if needed
3. Work on-site
4. Travel to next site or home
5. Record expenses and mileage (often forgotten or delayed)
6. Submit invoices to contractor
7. Receive payment minus CIS deduction

---

## CIS-Specific Mileage Requirements

### 1. Multi-Site Travel Tracking

**Requirement**: Track travel between multiple construction sites in a single day

**Current Pain Points**:
- Manual logging of 3-5 sites per day is tedious
- Forgetting to record trips between sites
- Difficulty proving business purpose for each journey

**Solution Requirements**:
- Automatic detection of site arrivals/departures
- Bulk classification for known construction sites
- Route recording with timestamps
- Site address database/remembering

### 2. Home-to-Site Travel Eligibility

**Key Difference**: Unlike employees, CIS subcontractors CAN claim home-to-site travel because:
- They don't have a permanent workplace
- Each site is a temporary workplace
- Travel is "wholly and exclusively" for business

**HMRC Rules for Temporary Workplace**:
- Location where work is performed
- Expected to work < 24 months at that location
- OR spend < 40% of working time at that location

**App Requirements**:
- Clear documentation of site as temporary workplace
- Date tracking for each site
- Automatic 24-month/40% rule monitoring
- Alert when site becomes permanent workplace

### 3. CIS Deduction Integration

**Unique Need**: Track mileage expenses against CIS-deducted income

**Requirements**:
- Record gross invoice amount
- Record CIS deduction (20% or 30%)
- Calculate net received
- Apply mileage claim against taxable income
- Show tax savings from mileage claims

**Example Workflow**:
```
Invoice: £1,000 (labour) + £200 (VAT) = £1,200
CIS Deduction (20%): £200
Net Received: £1,000

Mileage Claim: 50 miles × £0.45 = £22.50
Taxable Income: £1,000 - £22.50 = £977.50
Tax Saved: £22.50 × 20% = £4.50
```

### 4. Combined Material + Mileage Tracking

**Requirement**: Track both mileage AND material purchases in one app

**Typical Expenses**:
- Fuel (for mileage claim)
- Materials (bricks, timber, fixtures)
- Tools and equipment
- Safety equipment (PPE)
- Parking at sites
- Tolls

**App Requirements**:
- Receipt capture for materials
- Categorization (materials vs mileage vs other)
- Link materials to specific jobs/sites
- VAT tracking on materials
- Integration with job costing

---

## HMRC Compliance Requirements for CIS

### Record Keeping Requirements

**Mandatory Information**:
1. **Date** of each journey
2. **Start location** (full address with postcode)
3. **End location** (full address with postcode)
4. **Purpose** of the trip (e.g., "Plumbing work at Smith residence")
5. **Total miles** travelled
6. **Vehicle registration** number

**Retention Period**: 5 years from submission deadline

**Format**: Digital or paper, but must be contemporaneous (recorded at time of travel or shortly after)

### HMRC Mileage Rates (2024/25)

| Vehicle Type | First 10,000 Miles | Over 10,000 Miles |
|--------------|-------------------|-------------------|
| Cars & Vans | 45p per mile | 25p per mile |
| Motorcycles | 24p per mile | 24p per mile |
| Bicycles | 20p per mile | 20p per mile |

**Additional**: 5p per mile per passenger (fellow employee on business journey)

### VAT Considerations

**For CIS Subcontractors**:
- Most are NOT VAT registered (below £85,000 threshold)
- Cannot reclaim VAT on fuel
- Use simplified mileage rates (no VAT component)

**For VAT-Registered CIS Contractors**:
- Can reclaim VAT on fuel portion only
- Use Advisory Fuel Rates (AFR) to calculate fuel element
- Must keep fuel receipts
- Current AFR (March 2025): 11-23p per mile depending on fuel type and engine size

### Audit-Proof Requirements

**What Makes a Claim "Audit-Proof"**:

1. **Contemporaneous Records**
   - Recorded at time of journey or same day
   - Not reconstructed weeks/months later
   - GPS timestamps provide proof

2. **Complete Information**
   - All required fields present
   - No missing journeys
   - Consistent recording pattern

3. **Business Purpose Documentation**
   - Clear description of business reason
   - Links to invoices/jobs where possible
   - Site addresses recorded

4. **Vehicle Documentation**
   - Registration number recorded
   - Vehicle type specified
   - Multi-vehicle tracking if applicable

5. **Reasonable Mileage**
   - Matches typical routes
   - No inflated claims
   - Consistent with business activities

---

## CIS vs Employee Mileage: Key Differences

| Aspect | CIS Subcontractor | Employee |
|--------|-------------------|----------|
| **Home to Site** | Usually claimable (temporary workplace) | Not claimable (commuting) |
| **Tax Treatment** | Business expense on Self Assessment | Mileage Allowance Relief or employer reimbursement |
| **Record Keeping** | Self-responsibility | Employer may have systems |
| **CIS Deduction** | Deducted at source (20%/30%) | PAYE tax |
| **VAT** | Often not registered | Employer handles VAT |
| **Payment Timing** | Net after CIS deduction | Gross pay minus tax |
| **Mileage Method** | Can choose simplified or actual | Usually employer's method |

---

## Pain Points for CIS Contractors

### Current Challenges

1. **Manual Record Keeping**
   - Paper logbooks get lost/damaged
   - Forgotten journeys = lost tax savings
   - Time-consuming to maintain

2. **CIS Complexity**
   - Don't understand how mileage reduces tax
   - Confusion about gross vs net payments
   - Difficulty calculating actual tax savings

3. **Multi-Site Tracking**
   - Multiple sites per day hard to track
   - Forgetting to log between-site travel
   - Proving business purpose

4. **Material Expense Separation**
   - Mileage and materials tracked separately
   - No single view of job costs
   - Difficulty linking expenses to jobs

5. **Accountant Integration**
   - Manual handover of records
   - Delays in getting information
   - Additional accountant fees for data entry

6. **Technology Barriers**
   - Current apps too complex
   - Not designed for construction
   - Poor battery life

---

## Feature Requirements for CIS-Focused App

### Must-Have Features

1. **Automatic GPS Tracking**
   - Background tracking without manual start/stop
   - Minimum speed threshold (avoid walking tracking)
   - Offline capability (construction sites often have poor signal)

2. **HMRC-Compliant Reports**
   - All required fields included
   - 45p/25p split automatic calculation
   - PDF and Excel export
   - 5-year record retention

3. **Site-Based Classification**
   - Save construction site addresses
   - Auto-classify trips to known sites
   - Site visit history
   - 24-month rule tracking

4. **CIS Integration**
   - Record gross/net payments
   - Calculate tax savings from mileage
   - Show CIS deduction impact

5. **Xero/QuickBooks/Sage Integration**
   - Direct publishing of mileage claims
   - Match to invoices
   - Accountant access

### Should-Have Features

1. **Receipt Capture**
   - Photo capture for materials
   - OCR for automatic data extraction
   - Link receipts to jobs/sites

2. **Multi-Vehicle Support**
   - Track multiple vehicles
   - Separate logs per vehicle
   - Vehicle expense tracking

3. **Job Costing**
   - Assign expenses to jobs
   - Job profitability tracking
   - Client-based reporting

4. **Fuel Cost Tracking**
   - Record fuel purchases
   - MPG calculation
   - Fuel vs mileage comparison

5. **Passenger Tracking**
   - 5p per passenger calculation
   - Employee passenger records

### Nice-to-Have Features

1. **Route Optimization**
   - Suggest efficient routes
   - Multi-stop planning
   - Time estimates

2. **Weather Integration**
   - Record weather conditions
   - Justify delays/cancellations

3. **Integration with Construction Apps**
   - Connect to job management software
   - Import job schedules

4. **Team Features**
   - Multiple subcontractors
   - Manager dashboard
   - Approval workflows

---

## Market Opportunity Summary

### Target Market Size
- **CIS Subcontractors**: 1.5+ million
- **Average Mileage Claim**: £2,000-£5,000 per year
- **Potential Tax Savings**: £400-£1,000 per year per user
- **Addressable Market Value**: £600+ million in annual tax savings

### Competitive Advantage Opportunities

1. **CIS-Specific Features**: No competitor focuses on this market
2. **Combined Expense Tracking**: Mileage + materials in one app
3. **UK Compliance First**: Built for HMRC from the ground up
4. **Construction-Focused**: Site-based features, job costing
5. **Accountant Integration**: Streamlined workflow for CIS accountants

### Pricing Considerations

- **TripCatcher**: £1.49/mo (UK-focused, basic)
- **Market Range**: £4-£11/mo for premium features
- **CIS-Specific Value**: Higher willingness to pay for CIS features
- **Recommended Range**: £3-£6/mo for individual CIS contractors
- **Team Plans**: £5-£10/user/mo for contractor firms

---

## Conclusion

The CIS market represents a significant, underserved opportunity in the UK mileage tracking space. Current solutions are either too generic (global apps) or too limited (UK apps without CIS features). A purpose-built solution addressing CIS-specific needs—particularly the combination of mileage and material tracking, CIS deduction integration, and site-based classification—could capture significant market share in this 1.5+ million user market.

Success factors include:
1. HMRC compliance as foundation
2. CIS-specific features as differentiator
3. Xero/Sage/QuickBooks integration for adoption
4. Simple, reliable mobile experience
5. Clear value proposition (tax savings visibility)
