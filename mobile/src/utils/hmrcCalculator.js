/**
 * HMRC Mileage Calculator
 * UK tax year rates and calculations
 */

// HMRC mileage rates
const HMRC_RATES = {
  car: {
    first10000: 0.45,
    over10000: 0.25
  },
  motorcycle: {
    first10000: 0.24,
    over10000: 0.24
  },
  bicycle: {
    first10000: 0.20,
    over10000: 0.20
  }
};

/**
 * Get current UK tax year
 * Tax year runs from April 6th to April 5th
 */
export const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // If before April 6th, we're in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

/**
 * Calculate mileage claim amount
 * @param {number} miles - Miles traveled
 * @param {number} ytdMiles - Year-to-date miles
 * @param {string} vehicleType - 'car', 'motorcycle', 'bicycle'
 * @param {string} taxYear - Optional tax year
 */
export const calculateMileageClaim = (miles, ytdMiles = 0, vehicleType = 'car', taxYear = null) => {
  const rates = HMRC_RATES[vehicleType] || HMRC_RATES.car;
  const threshold = 10000;
  
  const remainingThreshold = Math.max(0, threshold - ytdMiles);
  
  let atHigherRate = 0;
  let atLowerRate = 0;
  let amount = 0;

  if (remainingThreshold > 0) {
    atHigherRate = Math.min(miles, remainingThreshold);
    atLowerRate = Math.max(0, miles - remainingThreshold);
    amount = (atHigherRate * rates.first10000) + (atLowerRate * rates.over10000);
  } else {
    atLowerRate = miles;
    amount = miles * rates.over10000;
  }

  return {
    miles,
    ytdMiles,
    vehicleType,
    taxYear: taxYear || getCurrentTaxYear(),
    amount: Math.round(amount * 100) / 100,
    rateApplied: remainingThreshold > 0 ? rates.first10000 : rates.over10000,
    breakdown: {
      atHigherRate,
      atLowerRate,
      higherRate: rates.first10000,
      lowerRate: rates.over10000
    }
  };
};

/**
 * Get tax year date range
 */
export const getTaxYearDates = (taxYear = null) => {
  const year = taxYear || getCurrentTaxYear();
  const [startYear, endYearShort] = year.split('-');
  const endYear = `20${endYearShort}`;
  
  return {
    start: `${startYear}-04-06`,
    end: `${endYear}-04-05`,
    year
  };
};

/**
 * Check if date is in current tax year
 */
export const isDateInTaxYear = (date, taxYear = null) => {
  const checkDate = new Date(date);
  const { start, end } = getTaxYearDates(taxYear);
  
  return checkDate >= new Date(start) && checkDate <= new Date(end);
};

/**
 * Calculate 24-month rule status for a site
 * HMRC: Temporary workplace becomes permanent after 24 months
 */
export const calculate24MonthRule = (firstVisitDate, lastVisitDate = null) => {
  const first = new Date(firstVisitDate);
  const last = lastVisitDate ? new Date(lastVisitDate) : new Date();
  const now = new Date();
  
  const daysAttended = Math.floor((last - first) / (1000 * 60 * 60 * 24));
  const daysSinceFirst = Math.floor((now - first) / (1000 * 60 * 60 * 24));
  
  const MONTHS_THRESHOLD = 24;
  const DAYS_THRESHOLD = MONTHS_THRESHOLD * 30; // Approximate
  
  const daysRemaining = Math.max(0, DAYS_THRESHOLD - daysSinceFirst);
  const isExpiring = daysRemaining <= 90; // 3 months warning
  const isExpired = daysRemaining <= 0;
  
  let status = 'active';
  let statusColor = 'green';
  
  if (isExpired) {
    status = 'expired';
    statusColor = 'red';
  } else if (isExpiring) {
    status = 'urgent';
    statusColor = 'red';
  } else if (daysRemaining <= 180) {
    status = 'warning';
    statusColor = 'amber';
  }
  
  return {
    status,
    statusColor,
    daysAttended,
    daysSinceFirst,
    daysRemaining,
    isExpiring,
    isExpired,
    message: isExpired 
      ? '24-month rule expired - mileage no longer claimable'
      : isExpiring 
        ? `${Math.floor(daysRemaining)} days remaining`
        : `${Math.floor(daysRemaining / 30)} months remaining`
  };
};

/**
 * Format miles with proper pluralization
 */
export const formatMiles = (miles) => {
  const num = parseFloat(miles) || 0;
  return `${num.toFixed(1)} mile${num === 1 ? '' : 's'}`;
};

export default {
  getCurrentTaxYear,
  calculateMileageClaim,
  getTaxYearDates,
  isDateInTaxYear,
  calculate24MonthRule,
  formatMiles,
  HMRC_RATES
};
