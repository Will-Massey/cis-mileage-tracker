/**
 * Mileage Calculator Service
 * HMRC-compliant mileage calculations with YTD tracking
 */

const { prisma } = require('../config/database');
const {
  getRates,
  getTaxYearForDate,
  getMileageThreshold,
  calculateMileageAmount,
  calculateTripSummary,
} = require('../utils/hmrcRates');

/**
 * Get user's year-to-date mileage for a tax year
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year
 * @returns {Promise<number>} YTD miles
 */
const getUserYtdMiles = async (userId, taxYear) => {
  try {
    // Try to get from cached summary first
    const summary = await prisma.userMileageSummary.findUnique({
      where: {
        userId_taxYear: {
          userId,
          taxYear,
        },
      },
    });

    if (summary) {
      return parseFloat(summary.totalMiles);
    }

    // Calculate from trips if no cached summary
    const result = await prisma.trip.aggregate({
      where: {
        userId,
        taxYear,
      },
      _sum: {
        distanceMiles: true,
      },
    });

    return parseFloat(result._sum.distanceMiles || 0);
  } catch (error) {
    console.error('Error getting YTD miles:', error);
    return 0;
  }
};

/**
 * Calculate mileage amount for a new trip
 * @param {Object} tripData - Trip data
 * @param {string} tripData.userId - User ID
 * @param {Date} tripData.tripDate - Trip date
 * @param {number} tripData.distanceMiles - Distance in miles
 * @param {string} tripData.vehicleType - Vehicle type
 * @returns {Promise<Object>} Calculation result
 */
const calculateTripAmount = async (tripData) => {
  const { userId, tripDate, distanceMiles, vehicleType = 'car' } = tripData;
  
  // Determine tax year from trip date
  const taxYear = getTaxYearForDate(tripDate);
  
  // Get user's current YTD miles for this tax year
  const ytdMiles = await getUserYtdMiles(userId, taxYear);
  
  // Calculate the amount
  const calculation = calculateMileageAmount(
    parseFloat(distanceMiles),
    ytdMiles,
    taxYear,
    vehicleType
  );

  return {
    ...calculation,
    taxYear,
  };
};

/**
 * Recalculate amounts for trips after a change
 * This is needed when a trip is updated or deleted
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year
 */
const recalculateTrips = async (userId, taxYear) => {
  try {
    // Get all trips for user in tax year, ordered by date
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear,
      },
      orderBy: {
        tripDate: 'asc',
      },
    });

    if (trips.length === 0) {
      return;
    }

    // Get rates for this tax year
    const rates = getRates(taxYear, 'car');
    let runningTotal = 0;

    // Recalculate each trip
    for (const trip of trips) {
      const distance = parseFloat(trip.distanceMiles);
      const vehicleType = trip.vehicleType || 'car';
      const vehicleRates = getRates(taxYear, vehicleType);

      let rateApplied;
      let amount;

      // Check if vehicle type has flat rate
      if (vehicleRates.first10000 === vehicleRates.over10000) {
        rateApplied = vehicleRates.first10000;
        amount = distance * rateApplied;
      } else {
        // Variable rate
        if (runningTotal >= getMileageThreshold()) {
          rateApplied = vehicleRates.over10000;
          amount = distance * rateApplied;
        } else if (runningTotal + distance <= getMileageThreshold()) {
          rateApplied = vehicleRates.first10000;
          amount = distance * rateApplied;
        } else {
          // Mixed rate
          const milesAtHigherRate = getMileageThreshold() - runningTotal;
          const milesAtLowerRate = distance - milesAtHigherRate;
          
          const amountAtHigherRate = milesAtHigherRate * vehicleRates.first10000;
          const amountAtLowerRate = milesAtLowerRate * vehicleRates.over10000;
          
          amount = amountAtHigherRate + amountAtLowerRate;
          rateApplied = amount / distance;
        }
      }

      const newYtd = runningTotal + distance;

      // Update trip with new calculations
      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          rateApplied: Math.round(rateApplied * 100) / 100,
          amountGbp: Math.round(amount * 100) / 100,
          userMilesYtd: Math.round(newYtd * 100) / 100,
        },
      });

      runningTotal = newYtd;
    }

    // Update summary
    await updateUserMileageSummary(userId, taxYear);

    return {
      recalculated: trips.length,
      finalYtd: runningTotal,
    };
  } catch (error) {
    console.error('Error recalculating trips:', error);
    throw error;
  }
};

/**
 * Update user's mileage summary for a tax year
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year
 */
const updateUserMileageSummary = async (userId, taxYear) => {
  try {
    // Get all trips for the user and tax year
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear,
      },
    });

    // Calculate summary statistics
    const summary = calculateTripSummary(trips);

    // Upsert the summary
    await prisma.userMileageSummary.upsert({
      where: {
        userId_taxYear: {
          userId,
          taxYear,
        },
      },
      update: {
        totalMiles: summary.totalMiles,
        totalClaimAmount: summary.totalAmount,
        tripCount: summary.tripCount,
        milesAt45p: summary.at45p.miles,
        amountAt45p: summary.at45p.amount,
        milesAt25p: summary.at25p.miles,
        amountAt25p: summary.at25p.amount,
        lastTripDate: trips.length > 0 ? trips[trips.length - 1].tripDate : null,
        calculatedAt: new Date(),
      },
      create: {
        userId,
        taxYear,
        totalMiles: summary.totalMiles,
        totalClaimAmount: summary.totalAmount,
        tripCount: summary.tripCount,
        milesAt45p: summary.at45p.miles,
        amountAt45p: summary.at45p.amount,
        milesAt25p: summary.at25p.miles,
        amountAt25p: summary.at25p.amount,
        lastTripDate: trips.length > 0 ? trips[trips.length - 1].tripDate : null,
      },
    });

    return summary;
  } catch (error) {
    console.error('Error updating mileage summary:', error);
    throw error;
  }
};

/**
 * Get user's mileage statistics
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year (optional)
 * @returns {Promise<Object>} Statistics
 */
const getUserStats = async (userId, taxYear = null) => {
  try {
    const targetTaxYear = taxYear || getTaxYearForDate(new Date());

    // Get summary from database
    const summary = await prisma.userMileageSummary.findUnique({
      where: {
        userId_taxYear: {
          userId,
          taxYear: targetTaxYear,
        },
      },
    });

    if (summary) {
      return {
        taxYear: targetTaxYear,
        totalMiles: parseFloat(summary.totalMiles),
        totalAmount: parseFloat(summary.totalClaimAmount),
        tripCount: summary.tripCount,
        breakdown: {
          at45p: {
            miles: parseFloat(summary.milesAt45p),
            amount: parseFloat(summary.amountAt45p),
          },
          at25p: {
            miles: parseFloat(summary.milesAt25p),
            amount: parseFloat(summary.amountAt25p),
          },
        },
        lastTripDate: summary.lastTripDate,
        calculatedAt: summary.calculatedAt,
      };
    }

    // If no summary exists, calculate from trips
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear: targetTaxYear,
      },
    });

    const calculated = calculateTripSummary(trips);

    return {
      taxYear: targetTaxYear,
      totalMiles: calculated.totalMiles,
      totalAmount: calculated.totalAmount,
      tripCount: calculated.tripCount,
      breakdown: {
        at45p: calculated.at45p,
        at25p: calculated.at25p,
      },
      lastTripDate: trips.length > 0 ? trips[trips.length - 1].tripDate : null,
      calculatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

/**
 * Get statistics by category
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year
 * @returns {Promise<Object>} Category statistics
 */
const getStatsByCategory = async (userId, taxYear) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear,
      },
      select: {
        purposeCategory: true,
        distanceMiles: true,
        amountGbp: true,
      },
    });

    const categories = {};

    trips.forEach((trip) => {
      const category = trip.purposeCategory || 'other';
      
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          miles: 0,
          amount: 0,
        };
      }

      categories[category].count++;
      categories[category].miles += parseFloat(trip.distanceMiles);
      categories[category].amount += parseFloat(trip.amountGbp);
    });

    // Round values
    for (const category in categories) {
      categories[category].miles = Math.round(categories[category].miles * 100) / 100;
      categories[category].amount = Math.round(categories[category].amount * 100) / 100;
    }

    return categories;
  } catch (error) {
    console.error('Error getting stats by category:', error);
    throw error;
  }
};

/**
 * Get statistics by month
 * @param {string} userId - User ID
 * @param {string} taxYear - Tax year
 * @returns {Promise<Array>} Monthly statistics
 */
const getStatsByMonth = async (userId, taxYear) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear,
      },
      select: {
        tripDate: true,
        distanceMiles: true,
        amountGbp: true,
      },
      orderBy: {
        tripDate: 'asc',
      },
    });

    const months = {};

    trips.forEach((trip) => {
      const monthKey = trip.tripDate.toISOString().slice(0, 7); // YYYY-MM
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          miles: 0,
          amount: 0,
          count: 0,
        };
      }

      months[monthKey].miles += parseFloat(trip.distanceMiles);
      months[monthKey].amount += parseFloat(trip.amountGbp);
      months[monthKey].count++;
    });

    // Convert to array and round values
    const result = Object.values(months).map((month) => ({
      ...month,
      miles: Math.round(month.miles * 100) / 100,
      amount: Math.round(month.amount * 100) / 100,
    }));

    return result;
  } catch (error) {
    console.error('Error getting stats by month:', error);
    throw error;
  }
};

/**
 * Get comprehensive trip statistics
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Comprehensive statistics
 */
const getComprehensiveStats = async (userId, options = {}) => {
  const { taxYear, startDate, endDate } = options;
  const targetTaxYear = taxYear || getTaxYearForDate(new Date());

  try {
    // Get basic stats
    const basicStats = await getUserStats(userId, targetTaxYear);

    // Get category breakdown
    const byCategory = await getStatsByCategory(userId, targetTaxYear);

    // Get monthly breakdown
    const byMonth = await getStatsByMonth(userId, targetTaxYear);

    return {
      ...basicStats,
      byCategory,
      byMonth,
    };
  } catch (error) {
    console.error('Error getting comprehensive stats:', error);
    throw error;
  }
};

module.exports = {
  getUserYtdMiles,
  calculateTripAmount,
  recalculateTrips,
  updateUserMileageSummary,
  getUserStats,
  getStatsByCategory,
  getStatsByMonth,
  getComprehensiveStats,
};
