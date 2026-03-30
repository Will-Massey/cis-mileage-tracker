/**
 * HMRC Mileage Rate Calculator
 * 
 * Current rates (2024-25 tax year):
 * - Cars and vans: 45p for first 10,000 miles, 25p thereafter
 * - Motorcycles: 24p per mile (flat rate)
 * - Bicycles: 20p per mile (flat rate)
 */

// HMRC rates for 2024-25 tax year
const HMRC_RATES = {
  '2024-25': {
    car: {
      first10000: 0.45,
      over10000: 0.25
    },
    van: {
      first10000: 0.45,
      over10000: 0.25
    },
    motorcycle: {
      flat: 0.24
    },
    bicycle: {
      flat: 0.20
    }
  },
  '2023-24': {
    car: {
      first10000: 0.45,
      over10000: 0.25
    },
    van: {
      first10000: 0.45,
      over10000: 0.25
    },
    motorcycle: {
      flat: 0.24
    },
    bicycle: {
      flat: 0.20
    }
  }
};

const DEFAULT_TAX_YEAR = '2024-25';
const DEFAULT_VEHICLE_TYPE = 'car';

/**
 * Get the current tax year
 * @returns {string} Tax year (e.g., "2024-25")
 */
export const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Tax year runs from April 6th to April 5th
  if (month < 3 || (month === 3 && now.getDate() < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

/**
 * Get tax year for a specific date
 * @param {Date|string} date - Date to get tax year for
 * @returns {string} Tax year
 */
export const getTaxYearForDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

/**
 * Get HMRC rates for a tax year
 * @param {string} taxYear - Tax year (e.g., "2024-25")
 * @returns {object} Rates for the tax year
 */
export const getRatesForTaxYear = (taxYear = DEFAULT_TAX_YEAR) => {
  return HMRC_RATES[taxYear] || HMRC_RATES[DEFAULT_TAX_YEAR];
};

/**
 * Calculate mileage claim amount
 * @param {number} miles - Miles traveled
 * @param {number} ytdMiles - Year-to-date miles (for 10k threshold)
 * @param {string} vehicleType - Vehicle type (car, van, motorcycle, bicycle)
 * @param {string} taxYear - Tax year
 * @returns {object} Calculation result
 */
export const calculateMileageClaim = (
  miles,
  ytdMiles = 0,
  vehicleType = DEFAULT_VEHICLE_TYPE,
  taxYear = DEFAULT_TAX_YEAR
) => {
  const numMiles = parseFloat(miles);
  const numYtdMiles = parseFloat(ytdMiles) || 0;
  
  if (isNaN(numMiles) || numMiles <= 0) {
    return {
      amount: 0,
      rateApplied: 0,
      at45p: 0,
      at25p: 0,
      error: 'Invalid miles'
    };
  }

  const rates = getRatesForTaxYear(taxYear);
  const vehicleRates = rates[vehicleType] || rates.car;

  // For motorcycles and bicycles, flat rate applies
  if (vehicleType === 'motorcycle' || vehicleType === 'bicycle') {
    const rate = vehicleRates.flat;
    const amount = numMiles * rate;
    return {
      amount: Math.round(amount * 100) / 100,
      rateApplied: rate,
      at45p: 0,
      at25p: 0,
      atFlat: numMiles,
      breakdown: {
        miles: numMiles,
        rate: rate,
        amount: Math.round(amount * 100) / 100
      }
    };
  }

  // For cars and vans, 45p/25p split applies
  const threshold = 10000;
  const remainingThreshold = Math.max(0, threshold - numYtdMiles);
  
  let at45p = 0;
  let at25p = 0;
  let rateApplied = 0;

  if (remainingThreshold > 0) {
    at45p = Math.min(numMiles, remainingThreshold);
    at25p = Math.max(0, numMiles - remainingThreshold);
    rateApplied = at45p > 0 ? vehicleRates.first10000 : vehicleRates.over10000;
  } else {
    at25p = numMiles;
    rateApplied = vehicleRates.over10000;
  }

  const amount45p = at45p * vehicleRates.first10000;
  const amount25p = at25p * vehicleRates.over10000;
  const totalAmount = amount45p + amount25p;

  return {
    amount: Math.round(totalAmount * 100) / 100,
    rateApplied,
    at45p,
    at25p,
    breakdown: {
      at45p: {
        miles: at45p,
        rate: vehicleRates.first10000,
        amount: Math.round(amount45p * 100) / 100
      },
      at25p: {
        miles: at25p,
        rate: vehicleRates.over10000,
        amount: Math.round(amount25p * 100) / 100
      }
    }
  };
};

/**
 * Calculate total claim for multiple trips
 * @param {Array} trips - Array of trip objects with distanceMiles
 * @param {string} vehicleType - Vehicle type
 * @param {string} taxYear - Tax year
 * @returns {object} Total calculation
 */
export const calculateTotalClaim = (trips, vehicleType = DEFAULT_VEHICLE_TYPE, taxYear = DEFAULT_TAX_YEAR) => {
  let totalMiles = 0;
  let totalAmount = 0;
  let at45pMiles = 0;
  let at25pMiles = 0;
  let at45pAmount = 0;
  let at25pAmount = 0;

  const rates = getRatesForTaxYear(taxYear);
  const vehicleRates = rates[vehicleType] || rates.car;

  // Sort trips by date for proper YTD calculation
  const sortedTrips = [...trips].sort((a, b) => 
    new Date(a.tripDate) - new Date(b.tripDate)
  );

  let ytdMiles = 0;

  for (const trip of sortedTrips) {
    const miles = parseFloat(trip.distanceMiles) || 0;
    const result = calculateMileageClaim(miles, ytdMiles, vehicleType, taxYear);
    
    totalMiles += miles;
    totalAmount += result.amount;
    at45pMiles += result.at45p;
    at25pMiles += result.at25p;
    at45pAmount += result.breakdown?.at45p?.amount || 0;
    at25pAmount += result.breakdown?.at25p?.amount || 0;
    
    ytdMiles += miles;
  }

  return {
    totalMiles: Math.round(totalMiles * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    tripCount: trips.length,
    breakdown: {
      at45p: {
        miles: Math.round(at45pMiles * 100) / 100,
        rate: vehicleRates.first10000,
        amount: Math.round(at45pAmount * 100) / 100
      },
      at25p: {
        miles: Math.round(at25pMiles * 100) / 100,
        rate: vehicleRates.over10000,
        amount: Math.round(at25pAmount * 100) / 100
      }
    }
  };
};

/**
 * Get rate display text
 * @param {number} rate - Rate value
 * @returns {string} Formatted rate text
 */
export const formatRate = (rate) => {
  return `${(rate * 100).toFixed(0)}p`;
};

/**
 * Get the applicable rate for a trip
 * @param {number} ytdMiles - Year-to-date miles before this trip
 * @param {string} vehicleType - Vehicle type
 * @param {string} taxYear - Tax year
 * @returns {number} Applicable rate
 */
export const getApplicableRate = (ytdMiles = 0, vehicleType = DEFAULT_VEHICLE_TYPE, taxYear = DEFAULT_TAX_YEAR) => {
  const rates = getRatesForTaxYear(taxYear);
  const vehicleRates = rates[vehicleType] || rates.car;

  if (vehicleType === 'motorcycle' || vehicleType === 'bicycle') {
    return vehicleRates.flat;
  }

  return ytdMiles < 10000 ? vehicleRates.first10000 : vehicleRates.over10000;
};

/**
 * Check if user is approaching 10k threshold
 * @param {number} ytdMiles - Current year-to-date miles
 * @returns {boolean} Is approaching threshold
 */
export const isApproachingThreshold = (ytdMiles) => {
  const threshold = 10000;
  const warningRange = 500; // Warn when within 500 miles
  return ytdMiles >= (threshold - warningRange) && ytdMiles < threshold;
};

/**
 * Get miles remaining until rate change
 * @param {number} ytdMiles - Current year-to-date miles
 * @returns {number} Miles remaining
 */
export const getMilesUntilRateChange = (ytdMiles) => {
  const threshold = 10000;
  return Math.max(0, threshold - ytdMiles);
};

/**
 * Get all available tax years
 * @returns {Array} Array of tax years
 */
export const getAvailableTaxYears = () => {
  return Object.keys(HMRC_RATES).sort().reverse();
};

/**
 * Get vehicle type options
 * @returns {Array} Vehicle type options
 */
export const getVehicleTypeOptions = () => [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' }
];
