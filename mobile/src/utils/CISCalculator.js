/**
 * CIS (Construction Industry Scheme) Calculator
 * Calculates tax savings specific to CIS contractors
 */

import { getCurrentTaxYear, calculateMileageClaim } from './hmrcCalculator';

// CIS deduction rates
const CIS_RATES = {
  REGISTERED: 0.20,    // 20% for registered subcontractors
  UNREGISTERED: 0.30,  // 30% for unregistered subcontractors
  GROSS: 0.00          // 0% for gross payment status
};

/**
 * Calculate CIS tax savings from mileage claim
 * @param {number} mileageClaim - The mileage claim amount (£)
 * @param {string} cisRate - CIS rate ('registered', 'unregistered', 'gross')
 * @returns {Object} Tax savings calculation
 */
export const calculateCISTaxSavings = (mileageClaim, cisRate = 'registered') => {
  const rate = CIS_RATES[cisRate.toUpperCase()] || CIS_RATES.REGISTERED;
  const taxSaved = mileageClaim * rate;

  return {
    mileageClaim,
    cisRate: rate,
    cisRateLabel: getCISRateLabel(rate),
    taxSaved: Math.round(taxSaved * 100) / 100,
    effectiveSaving: rate * 100
  };
};

/**
 * Calculate comprehensive trip savings with CIS
 * @param {number} miles - Miles traveled
 * @param {number} ytdMiles - Year-to-date miles
 * @param {string} cisRate - CIS rate
 * @param {string} taxYear - Tax year
 * @returns {Object} Complete calculation
 */
export const calculateCISTripSavings = (
  miles,
  ytdMiles = 0,
  cisRate = 'registered',
  taxYear = null
) => {
  // Get HMRC mileage calculation
  const mileageCalc = calculateMileageClaim(miles, ytdMiles, 'car', taxYear);
  
  // Calculate CIS tax savings
  const cisSavings = calculateCISTaxSavings(mileageCalc.amount, cisRate);

  return {
    ...mileageCalc,
    cis: cisSavings,
    summary: {
      miles,
      claimAmount: mileageCalc.amount,
      cisRate: cisSavings.cisRateLabel,
      taxSaved: cisSavings.taxSaved,
      effectiveRate: `Save ${cisSavings.cisRateLabel} on £${mileageCalc.amount.toFixed(2)}`
    }
  };
};

/**
 * Get CIS rate label
 */
const getCISRateLabel = (rate) => {
  if (rate === 0.20) return '20%';
  if (rate === 0.30) return '30%';
  if (rate === 0.00) return '0% (Gross)';
  return `${(rate * 100).toFixed(0)}%`;
};

/**
 * Calculate year-to-date CIS savings
 * @param {Array} trips - Array of trip objects
 * @param {string} cisRate - CIS rate
 * @returns {Object} YTD savings
 */
export const calculateYTDCISSavings = (trips, cisRate = 'registered') => {
  const rate = CIS_RATES[cisRate.toUpperCase()] || CIS_RATES.REGISTERED;
  
  let totalMiles = 0;
  let totalClaim = 0;
  let totalTaxSaved = 0;

  trips.forEach(trip => {
    const miles = parseFloat(trip.distanceMiles) || 0;
    const claim = parseFloat(trip.amountGbp) || 0;
    const taxSaved = claim * rate;

    totalMiles += miles;
    totalClaim += claim;
    totalTaxSaved += taxSaved;
  });

  return {
    totalMiles: Math.round(totalMiles * 100) / 100,
    totalClaim: Math.round(totalClaim * 100) / 100,
    totalTaxSaved: Math.round(totalTaxSaved * 100) / 100,
    cisRate: rate,
    tripCount: trips.length,
    averageTaxSavedPerTrip: trips.length > 0 
      ? Math.round((totalTaxSaved / trips.length) * 100) / 100 
      : 0
  };
};

/**
 * Calculate potential annual savings
 * @param {number} weeklyMiles - Average weekly miles
 * @param {string} cisRate - CIS rate
 * @returns {Object} Annual projection
 */
export const calculateAnnualSavings = (weeklyMiles = 200, cisRate = 'registered') => {
  const annualMiles = weeklyMiles * 52;
  const rate = CIS_RATES[cisRate.toUpperCase()] || CIS_RATES.REGISTERED;
  
  // Calculate HMRC claim (first 10k at 45p, rest at 25p)
  let annualClaim = 0;
  if (annualMiles <= 10000) {
    annualClaim = annualMiles * 0.45;
  } else {
    annualClaim = (10000 * 0.45) + ((annualMiles - 10000) * 0.25);
  }

  const annualTaxSaved = annualClaim * rate;

  return {
    weeklyMiles,
    annualMiles,
    annualClaim: Math.round(annualClaim * 100) / 100,
    annualTaxSaved: Math.round(annualTaxSaved * 100) / 100,
    monthlyAverage: Math.round((annualTaxSaved / 12) * 100) / 100,
    cisRate: rate,
    cisRateLabel: getCISRateLabel(rate)
  };
};

/**
 * Check if user qualifies for gross payment status
 * @param {Object} criteria - Business criteria
 * @returns {Object} Eligibility assessment
 */
export const checkGrossStatusEligibility = (criteria) => {
  const { 
    turnover = 0, 
    monthsRegistered = 0, 
    complianceHistory = true,
    businessBankAccount = true 
  } = criteria;

  // HMRC criteria for gross payment status:
  // 1. Turnover > £30,000 (for sole traders) or £100,000 (for partnerships/companies)
  // 2. Registered for 12+ months
  // 3. Good compliance history
  // 4. Business bank account

  const checks = {
    turnoverMet: turnover >= 30000,
    registrationMet: monthsRegistered >= 12,
    complianceMet: complianceHistory,
    bankAccountMet: businessBankAccount
  };

  const allMet = Object.values(checks).every(check => check);

  return {
    eligible: allMet,
    checks,
    missingRequirements: Object.entries(checks)
      .filter(([, met]) => !met)
      .map(([key]) => key),
    recommendation: allMet 
      ? 'You qualify for gross payment status. Apply through HMRC.'
      : 'Continue with current CIS rate. Reapply when criteria met.'
  };
};

/**
 * Calculate invoice with CIS deduction
 * @param {number} labourAmount - Labour amount (before VAT)
 * @param {number} materialAmount - Material amount (before VAT)
 * @param {string} cisRate - CIS rate
 * @param {boolean} vatRegistered - Whether VAT registered
 * @returns {Object} Invoice breakdown
 */
export const calculateInvoiceWithCIS = (
  labourAmount,
  materialAmount = 0,
  cisRate = 'registered',
  vatRegistered = false
) => {
  const rate = CIS_RATES[cisRate.toUpperCase()] || CIS_RATES.REGISTERED;
  const subtotal = labourAmount + materialAmount;
  
  // CIS deduction applies to labour only (not materials)
  const cisDeduction = labourAmount * rate;
  
  // VAT calculation
  let vatAmount = 0;
  if (vatRegistered) {
    vatAmount = subtotal * 0.20;
  }

  const grossTotal = subtotal + vatAmount;
  const netPayment = grossTotal - cisDeduction;

  return {
    labourAmount,
    materialAmount,
    subtotal,
    cisRate: rate,
    cisRateLabel: getCISRateLabel(rate),
    cisDeduction: Math.round(cisDeduction * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossTotal: Math.round(grossTotal * 100) / 100,
    netPayment: Math.round(netPayment * 100) / 100,
    breakdown: {
      labour: labourAmount,
      materials: materialAmount,
      cisDeducted: cisDeduction,
      vat: vatAmount,
      youReceive: netPayment
    }
  };
};

/**
 * Get CIS rate options
 */
export const getCISRateOptions = () => [
  { value: 'registered', label: 'Registered - 20%', description: 'Standard rate for registered subcontractors' },
  { value: 'unregistered', label: 'Unregistered - 30%', description: 'Higher rate for unregistered subcontractors' },
  { value: 'gross', label: 'Gross - 0%', description: 'No deduction (qualified subcontractors only)' }
];

/**
 * Format currency with £ symbol
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Generate CIS savings report summary
 */
export const generateCISSummary = (stats, cisRate = 'registered') => {
  const rate = CIS_RATES[cisRate.toUpperCase()] || CIS_RATES.REGISTERED;
  const rateLabel = getCISRateLabel(rate);

  return {
    title: 'Your CIS Tax Savings',
    period: stats.period || 'This Tax Year',
    cisRate: rateLabel,
    summary: [
      { label: 'Total Miles', value: `${stats.totalMiles.toFixed(1)} miles` },
      { label: 'Mileage Claim', value: formatCurrency(stats.totalClaim) },
      { label: 'CIS Rate', value: rateLabel },
      { label: 'Tax Saved', value: formatCurrency(stats.totalTaxSaved), highlight: true }
    ],
    insight: `At ${rateLabel} CIS rate, you've saved ${formatCurrency(stats.totalTaxSaved)} in tax by claiming ${stats.totalMiles.toFixed(1)} business miles.`,
    recommendation: stats.totalMiles < 10000 
      ? 'Keep tracking! You\'re earning 45p per mile on all journeys.'
      : 'You\'ve passed the 10,000 mile threshold. Additional miles earn 25p per mile.'
  };
};

export default {
  calculateCISTaxSavings,
  calculateCISTripSavings,
  calculateYTDCISSavings,
  calculateAnnualSavings,
  checkGrossStatusEligibility,
  calculateInvoiceWithCIS,
  getCISRateOptions,
  formatCurrency,
  generateCISSummary,
  CIS_RATES
};
