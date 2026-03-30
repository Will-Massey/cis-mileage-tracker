/**
 * HMRC Mileage Rates Utility
 * UK HMRC approved mileage rates for business travel
 * 
 * Current Rates (2024-25 Tax Year):
 * - Cars & Vans: 45p for first 10,000 miles, 25p thereafter
 * - Motorcycles: 24p per mile (flat rate)
 * - Bicycles: 20p per mile (flat rate)
 */

// HMRC Mileage Rate Configuration
const HMRC_RATES = {
  // 2024-25 Tax Year (April 6, 2024 - April 5, 2025)
  '2024-25': {
    car: {
      first10000: 0.45,
      over10000: 0.25,
    },
    van: {
      first10000: 0.45,
      over10000: 0.25,
    },
    motorcycle: {
      first10000: 0.24,
      over10000: 0.24, // Flat rate
    },
    bicycle: {
      first10000: 0.20,
      over10000: 0.20, // Flat rate
    },
  },
  // 2023-24 Tax Year (April 6, 2023 - April 5, 2024)
  '2023-24': {
    car: {
      first10000: 0.45,
      over10000: 0.25,
    },
    van: {
      first10000: 0.45,
      over10000: 0.25,
    },
    motorcycle: {
      first10000: 0.24,
      over10000: 0.24,
    },
    bicycle: {
      first10000: 0.20,
      over10000: 0.20,
    },
  },
};

// Default rates if tax year not found
const DEFAULT_RATES = {
  car: { first10000: 0.45, over10000: 0.25 },
  van: { first10000: 0.45, over10000: 0.25 },
  motorcycle: { first10000: 0.24, over10000: 0.24 },
  bicycle: { first10000: 0.20, over10000: 0.20 },
};

// Threshold for rate change
const MILEAGE_THRESHOLD = 10000;

/**
 * Get HMRC rates for a specific tax year and vehicle type
 * @param {string} taxYear - Tax year (e.g., '2024-25')
 * @param {string} vehicleType - Vehicle type (car, van, motorcycle, bicycle)
 * @returns {Object} Rate configuration
 */
const getRates = (taxYear, vehicleType = 'car') => {
  const yearRates = HMRC_RATES[taxYear] || DEFAULT_RATES;
  return yearRates[vehicleType] || yearRates.car;
};

/**
 * Get current tax year based on date
 * UK tax year runs from April 6 to April 5
 * @param {Date} date - Date to check (defaults to today)
 * @returns {string} Tax year string (e.g., '2024-25')
 */
const getCurrentTaxYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // UK tax year starts April 6
  // If before April 6, we're in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
  
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

/**
 * Calculate tax year for a specific date
 * @param {Date} date - Date to calculate tax year for
 * @returns {string} Tax year string
 */
const getTaxYearForDate = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return getCurrentTaxYear(date);
};

/**
 * Calculate mileage claim amount using HMRC rates
 * @param {number} distance - Distance in miles
 * @param {number} ytdMiles - Year-to-date miles already claimed
 * @param {string} taxYear - Tax year
 * @param {string} vehicleType - Vehicle type
 * @returns {Object} Calculation result
 */
const calculateMileageAmount = (distance, ytdMiles = 0, taxYear, vehicleType = 'car') => {
  const rates = getRates(taxYear, vehicleType);
  
  let rateApplied;
  let amount;
  let newYtdMiles = ytdMiles + distance;

  // Check if vehicle type has flat rate (motorcycle, bicycle)
  if (rates.first10000 === rates.over10000) {
    rateApplied = rates.first10000;
    amount = distance * rateApplied;
  } else {
    // Variable rate (car, van)
    if (ytdMiles >= MILEAGE_THRESHOLD) {
      // Already over threshold, use lower rate for all miles
      rateApplied = rates.over10000;
      amount = distance * rates.over10000;
    } else if (newYtdMiles <= MILEAGE_THRESHOLD) {
      // Still under threshold, use higher rate for all miles
      rateApplied = rates.first10000;
      amount = distance * rates.first10000;
    } else {
      // Crossing the threshold - mixed rate calculation
      const milesAtHigherRate = MILEAGE_THRESHOLD - ytdMiles;
      const milesAtLowerRate = distance - milesAtHigherRate;
      
      const amountAtHigherRate = milesAtHigherRate * rates.first10000;
      const amountAtLowerRate = milesAtLowerRate * rates.over10000;
      
      amount = amountAtHigherRate + amountAtLowerRate;
      
      // Calculate effective rate for this trip
      rateApplied = amount / distance;
    }
  }

  return {
    distance: Math.round(distance * 100) / 100,
    ytdMilesBefore: Math.round(ytdMiles * 100) / 100,
    ytdMilesAfter: Math.round(newYtdMiles * 100) / 100,
    rateApplied: Math.round(rateApplied * 100) / 100,
    amount: Math.round(amount * 100) / 100,
    taxYear,
    vehicleType,
    thresholdCrossed: ytdMiles < MILEAGE_THRESHOLD && newYtdMiles > MILEAGE_THRESHOLD,
  };
};

/**
 * Calculate summary statistics for a set of trips
 * @param {Array} trips - Array of trip objects
 * @returns {Object} Summary statistics
 */
const calculateTripSummary = (trips) => {
  if (!trips || trips.length === 0) {
    return {
      totalMiles: 0,
      totalAmount: 0,
      tripCount: 0,
      at45p: { miles: 0, amount: 0 },
      at25p: { miles: 0, amount: 0 },
    };
  }

  let totalMiles = 0;
  let totalAmount = 0;
  let milesAt45p = 0;
  let amountAt45p = 0;
  let milesAt25p = 0;
  let amountAt25p = 0;

  trips.forEach((trip) => {
    const miles = parseFloat(trip.distanceMiles || trip.distance_miles || 0);
    const amount = parseFloat(trip.amountGbp || trip.amount_gbp || 0);
    const rate = parseFloat(trip.rateApplied || trip.rate_applied || 0);

    totalMiles += miles;
    totalAmount += amount;

    if (rate >= 0.40) {
      milesAt45p += miles;
      amountAt45p += amount;
    } else {
      milesAt25p += miles;
      amountAt25p += amount;
    }
  });

  return {
    totalMiles: Math.round(totalMiles * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    tripCount: trips.length,
    at45p: {
      miles: Math.round(milesAt45p * 100) / 100,
      amount: Math.round(amountAt45p * 100) / 100,
    },
    at25p: {
      miles: Math.round(milesAt25p * 100) / 100,
      amount: Math.round(amountAt25p * 100) / 100,
    },
  };
};

/**
 * Get all available tax years
 * @returns {Array} Array of tax year strings
 */
const getAvailableTaxYears = () => {
  return Object.keys(HMRC_RATES);
};

/**
 * Get mileage threshold
 * @returns {number} Mileage threshold (10000)
 */
const getMileageThreshold = () => {
  return MILEAGE_THRESHOLD;
};

/**
 * Format amount as GBP currency string
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

/**
 * Format miles with proper pluralization
 * @param {number} miles - Number of miles
 * @returns {string} Formatted miles string
 */
const formatMiles = (miles) => {
  const rounded = Math.round(miles * 100) / 100;
  return `${rounded} mile${rounded === 1 ? '' : 's'}`;
};

module.exports = {
  HMRC_RATES,
  DEFAULT_RATES,
  MILEAGE_THRESHOLD,
  getRates,
  getCurrentTaxYear,
  getTaxYearForDate,
  calculateMileageAmount,
  calculateTripSummary,
  getAvailableTaxYears,
  getMileageThreshold,
  formatCurrency,
  formatMiles,
};
