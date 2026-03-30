---
name: hmrc-compliance
description: UK HMRC mileage and tax compliance calculations. Use when calculating business mileage claims, applying HMRC rates (45p/25p), determining tax years (Apr 6-Apr 5), or generating HMRC-compliant reports for self-assessment.
---

# HMRC Compliance

UK tax rules for business mileage and expense claims.

## HMRC Mileage Rates

### Current Rates (2023/24 onwards)

| Vehicle | First 10,000 miles | Over 10,000 miles |
|---------|-------------------|-------------------|
| Car/Van | 45p per mile      | 25p per mile      |
| Motorcycle | 24p per mile   | 24p per mile      |
| Bicycle | 20p per mile      | 20p per mile      |

### Historical Rates

```javascript
const hmrcRates = {
  '2023-24': { first10000: 0.45, over10000: 0.25 },
  '2022-23': { first10000: 0.45, over10000: 0.25 },
  '2021-22': { first10000: 0.45, over10000: 0.25 },
  '2020-21': { first10000: 0.45, over10000: 0.25 }
}
```

## Tax Year Calculation

```javascript
// Tax year runs April 6 to April 5
function getTaxYear(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() // 0-indexed
  const day = d.getDate()
  
  // If before April 6, tax year is previous year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${String(year).slice(-2)}`
  }
  return `${year}-${String(year + 1).slice(-2)}`
}

// Examples:
// 2026-03-30 -> 2025-26
// 2026-04-06 -> 2026-27
```

## Mileage Calculation

```javascript
function calculateMileageClaim(miles, ytdMiles, taxYear = '2024-25') {
  const rates = hmrcRates[taxYear] || hmrcRates['2024-25']
  const threshold = 10000
  
  let rateApplied
  let amount
  
  if (ytdMiles >= threshold) {
    // All miles at lower rate
    rateApplied = rates.over10000
    amount = miles * rateApplied
  } else if (ytdMiles + miles <= threshold) {
    // All miles at higher rate
    rateApplied = rates.first10000
    amount = miles * rateApplied
  } else {
    // Mixed rate
    const milesAtHigher = threshold - ytdMiles
    const milesAtLower = miles - milesAtHigher
    
    amount = (milesAtHigher * rates.first10000) + 
             (milesAtLower * rates.over10000)
    rateApplied = amount / miles
  }
  
  return {
    miles,
    amount: Math.round(amount * 100) / 100,
    rateApplied: Math.round(rateApplied * 100) / 100,
    ytdMilesAfter: ytdMiles + miles
  }
}
```

## Round Trip Handling

```javascript
function processTrip(distance, isRoundTrip) {
  const actualDistance = isRoundTrip ? distance * 2 : distance
  return {
    distance: actualDistance,
    displayDistance: distance,
    isRoundTrip
  }
}
```

## CIS Contractor Rules

### Record Requirements
HMRC requires for each journey:
- Date of trip
- Start and end locations
- Purpose of journey
- Total miles
- Calculated claim amount

### Simplified Expenses
CIS contractors can use simplified expenses:
- Claim mileage at HMRC rates
- Cannot also claim fuel receipts (double dipping)

### Tax Return Integration

```javascript
function generateTaxReturnSummary(trips, taxYear) {
  const summary = {
    taxYear,
    totalMiles: 0,
    totalClaim: 0,
    milesAt45p: 0,
    milesAt25p: 0,
    amountAt45p: 0,
    amountAt25p: 0
  }
  
  let ytdMiles = 0
  
  for (const trip of trips.sort((a, b) => a.date - b.date)) {
    const result = calculateMileageClaim(trip.miles, ytdMiles, taxYear)
    
    summary.totalMiles += trip.miles
    summary.totalClaim += result.amount
    
    if (result.rateApplied === 0.45) {
      summary.milesAt45p += trip.miles
      summary.amountAt45p += result.amount
    } else if (result.rateApplied === 0.25) {
      summary.milesAt25p += trip.miles
      summary.amountAt25p += result.amount
    }
    
    ytdMiles += trip.miles
  }
  
  return summary
}
```

## Report Format

HMRC-compliant report includes:
```
Tax Year: 2024-25
Total Business Miles: XXXX
Total Claim Amount: £XXX.XX

Breakdown:
- Miles at 45p: XXX (£XXX.XX)
- Miles at 25p: XXX (£XXX.XX)

Trips:
Date | From | To | Miles | Amount
```

## Compliance Checklist

- [ ] All trips have date, locations, purpose
- [ ] Miles are business miles only
- [ ] Correct rates applied (45p/25p)
- [ ] Tax year correctly calculated (Apr 6-Apr 5)
- [ ] Records kept for 5 years
- [ ] No duplicate claims (fuel + mileage)
