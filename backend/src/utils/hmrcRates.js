/**
 * HMRC Rates and Calculations
 * UK tax compliance for business mileage
 */

// HMRC Mileage Rates (per mile)
const HMRC_RATES = {
  '2024-25': { first10000: 0.45, over10000: 0.25 },
  '2023-24': { first10000: 0.45, over10000: 0.25 },
  '2022-23': { first10000: 0.45, over10000: 0.25 },
  '2021-22': { first10000: 0.45, over10000: 0.25 },
  '2020-21': { first10000: 0.45, over10000: 0.25 },
};

const MILEAGE_THRESHOLD = 10000;

/**
 * Get current tax year (runs April 6 - April 5)
 * @param {Date} date - Date to check
 * @returns {string} Tax year in format 'YYYY-YY'
 */
function getTaxYearForDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
  const day = d.getDate();

  // If before April 6, tax year started previous year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
  return `${year}-${String(year + 1).slice(-2)}`;
}

/**
 * Get current tax year
 * @returns {string} Current tax year
 */
function getCurrentTaxYear() {
  return getTaxYearForDate();
}

/**
 * Get rates for tax year
 * @param {string} taxYear - Tax year
 * @param {string} vehicleType - Vehicle type (car, motorcycle, bicycle)
 * @returns {object} Rates object
 */
function getRates(taxYear, vehicleType = 'car') {
  const yearRates = HMRC_RATES[taxYear] || HMRC_RATES['2024-25'];
  
  // Motorcycles and bicycles have flat rates
  if (vehicleType === 'motorcycle') {
    return { first10000: 0.24, over10000: 0.24 };
  }
  if (vehicleType === 'bicycle') {
    return { first10000: 0.20, over10000: 0.20 };
  }
  
  return yearRates;
}

/**
 * Calculate mileage amount with YTD tracking
 * @param {number} miles - Trip miles
 * @param {number} ytdMiles - Year-to-date miles before this trip
 * @param {string} taxYear - Tax year
 * @param {string} vehicleType - Vehicle type
 * @returns {object} Calculation result
 */
function calculateMileageAmount(miles, ytdMiles, taxYear, vehicleType = 'car') {
  const rates = getRates(taxYear, vehicleType);
  
  let rateApplied;
  let amount;
  let milesAt45p = 0;
  let milesAt25p = 0;
  let amountAt45p = 0;
  let amountAt25p = 0;

  // Check if vehicle type has flat rate (same rate for all miles)
  if (rates.first10000 === rates.over10000) {
    rateApplied = rates.first10000;
    amount = miles * rateApplied;
    milesAt45p = 0;
    milesAt25p = miles;
    amountAt45p = 0;
    amountAt25p = amount;
  } else {
    // Variable rate (cars/vans)
    if (ytdMiles >= MILEAGE_THRESHOLD) {
      // All miles at lower rate
      rateApplied = rates.over10000;
      amount = miles * rateApplied;
      milesAt45p = 0;
      milesAt25p = miles;
      amountAt45p = 0;
      amountAt25p = amount;
    } else if (ytdMiles + miles <= MILEAGE_THRESHOLD) {
      // All miles at higher rate
      rateApplied = rates.first10000;
      amount = miles * rateApplied;
      milesAt45p = miles;
      milesAt25p = 0;
      amountAt45p = amount;
      amountAt25p = 0;
    } else {
      // Mixed rate - straddles the threshold
      const milesAtHigherRate = MILEAGE_THRESHOLD - ytdMiles;
      const milesAtLowerRate = miles - milesAtHigherRate;
      
      amountAt45p = milesAtHigherRate * rates.first10000;
      amountAt25p = milesAtLowerRate * rates.over10000;
      amount = amountAt45p + amountAt25p;
      
      rateApplied = amount / miles;
      milesAt45p = milesAtHigherRate;
      milesAt25p = milesAtLowerRate;
    }
  }

  return {
    miles,
    amount: Math.round(amount * 100) / 100,
    rateApplied: Math.round(rateApplied * 100) / 100,
    ytdMilesAfter: Math.round((ytdMiles + miles) * 100) / 100,
    taxYear,
    milesAt45p: Math.round(milesAt45p * 100) / 100,
    milesAt25p: Math.round(milesAt25p * 100) / 100,
    amountAt45p: Math.round(amountAt45p * 100) / 100,
    amountAt25p: Math.round(amountAt25p * 100) / 100,
  };
}

/**
 * Calculate summary for multiple trips
 * @param {Array} trips - Array of trip objects
 * @returns {object} Summary statistics
 */
function calculateTripSummary(trips) {
  const summary = {
    totalMiles: 0,
    totalAmount: 0,
    tripCount: trips.length,
    at45p: { miles: 0, amount: 0 },
    at25p: { miles: 0, amount: 0 },
  };

  trips.forEach(trip => {
    const miles = parseFloat(trip.distanceMiles);
    const amount = parseFloat(trip.amountGbp);
    const rate = parseFloat(trip.rateApplied);

    summary.totalMiles += miles;
    summary.totalAmount += amount;

    // Categorize by rate (approximately)
    if (rate >= 0.40) {
      summary.at45p.miles += miles;
      summary.at45p.amount += amount;
    } else {
      summary.at25p.miles += miles;
      summary.at25p.amount += amount;
    }
  });

  // Round values
  summary.totalMiles = Math.round(summary.totalMiles * 100) / 100;
  summary.totalAmount = Math.round(summary.totalAmount * 100) / 100;
  summary.at45p.miles = Math.round(summary.at45p.miles * 100) / 100;
  summary.at45p.amount = Math.round(summary.at45p.amount * 100) / 100;
  summary.at25p.miles = Math.round(summary.at25p.miles * 100) / 100;
  summary.at25p.amount = Math.round(summary.at25p.amount * 100) / 100;

  return summary;
}

/**
 * Get mileage threshold
 * @returns {number} Mileage threshold (10000)
 */
function getMileageThreshold() {
  return MILEAGE_THRESHOLD;
}

module.exports = {
  HMRC_RATES,
  getTaxYearForDate,
  getCurrentTaxYear,
  getRates,
  calculateMileageAmount,
  calculateTripSummary,
  getMileageThreshold,
};