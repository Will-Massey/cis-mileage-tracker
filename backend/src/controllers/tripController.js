/**
 * Trip Controller
 * Handles trip CRUD operations and mileage calculations
 */

const { prisma } = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const {
  calculateTripAmount,
  recalculateTrips,
  getComprehensiveStats,
} = require('../services/mileageCalculator');

/**
 * List user's trips with pagination and filtering
 * GET /api/trips
 */
const listTrips = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    vehicleId,
    purpose,
    search,
    sortBy = 'tripDate',
    sortOrder = 'desc',
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    userId: req.user.id,
  };

  if (startDate || endDate) {
    where.tripDate = {};
    if (startDate) where.tripDate.gte = new Date(startDate);
    if (endDate) where.tripDate.lte = new Date(endDate);
  }

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (purpose) {
    where.purposeCategory = purpose;
  }

  if (search) {
    where.OR = [
      { startLocation: { contains: search, mode: 'insensitive' } },
      { endLocation: { contains: search, mode: 'insensitive' } },
      { purpose: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get trips and total count
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            registration: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
    }),
    prisma.trip.count({ where }),
  ]);

  // Calculate summary for filtered trips
  const summaryWhere = { ...where };
  delete summaryWhere.OR; // Remove search for summary

  const summary = await prisma.trip.aggregate({
    where: summaryWhere,
    _sum: {
      distanceMiles: true,
      amountGbp: true,
    },
    _count: {
      id: true,
    },
  });

  res.json({
    success: true,
    data: {
      trips: trips.map((trip) => ({
        id: trip.id,
        tripDate: trip.tripDate,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        startPostcode: trip.startPostcode,
        endPostcode: trip.endPostcode,
        distanceMiles: parseFloat(trip.distanceMiles),
        isRoundTrip: trip.isRoundTrip,
        purpose: trip.purpose,
        purposeCategory: trip.purposeCategory,
        rateApplied: parseFloat(trip.rateApplied),
        amountGbp: parseFloat(trip.amountGbp),
        vehicle: trip.vehicle,
        notes: trip.notes,
        createdAt: trip.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + trips.length < total,
        hasPrev: page > 1,
      },
      summary: {
        totalMiles: parseFloat(summary._sum.distanceMiles || 0),
        totalAmount: parseFloat(summary._sum.amountGbp || 0),
        tripCount: summary._count.id,
      },
    },
  });
});

/**
 * Create a new trip
 * POST /api/trips
 */
const createTrip = asyncHandler(async (req, res) => {
  const {
    tripDate,
    startLocation,
    endLocation,
    startPostcode,
    endPostcode,
    distanceMiles,
    isRoundTrip,
    purpose,
    purposeCategory,
    vehicleId,
    notes,
  } = req.body;

  // Verify vehicle belongs to user if provided
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId: req.user.id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
  }

  // Calculate mileage amount
  // If round trip, double the distance for calculation
  const actualDistance = isRoundTrip 
    ? parseFloat(distanceMiles) * 2 
    : parseFloat(distanceMiles);
  
  const calculation = await calculateTripAmount({
    userId: req.user.id,
    tripDate: new Date(tripDate),
    distanceMiles: actualDistance,
    vehicleType: 'car', // Default, can be extended
  });

  // Create trip
  const trip = await prisma.trip.create({
    data: {
      userId: req.user.id,
      vehicleId: vehicleId || null,
      tripDate: new Date(tripDate),
      startLocation,
      endLocation,
      startPostcode: startPostcode || null,
      endPostcode: endPostcode || null,
      distanceMiles: actualDistance,
      isRoundTrip: isRoundTrip || false,
      purpose,
      purposeCategory: purposeCategory || 'other',
      taxYear: calculation.taxYear,
      vehicleType: 'car',
      rateApplied: calculation.rateApplied,
      amountGbp: calculation.amount,
      userMilesYtd: calculation.ytdMilesAfter,
      notes: notes || null,
      createdBy: req.user.id,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          registration: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Trip created successfully',
    data: {
      id: trip.id,
      tripDate: trip.tripDate,
      startLocation: trip.startLocation,
      endLocation: trip.endLocation,
      distanceMiles: parseFloat(trip.distanceMiles),
      rateApplied: parseFloat(trip.rateApplied),
      amountGbp: parseFloat(trip.amountGbp),
      userMilesYtd: parseFloat(trip.userMilesYtd),
      vehicle: trip.vehicle,
      createdAt: trip.createdAt,
    },
  });
});

/**
 * Get single trip
 * GET /api/trips/:id
 */
const getTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await prisma.trip.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          registration: true,
          make: true,
          model: true,
        },
      },
      receipts: {
        select: {
          id: true,
          filename: true,
          fileUrl: true,
          fileType: true,
          uploadedAt: true,
        },
      },
    },
  });

  if (!trip) {
    throw new NotFoundError('Trip');
  }

  res.json({
    success: true,
    data: {
      id: trip.id,
      userId: trip.userId,
      tripDate: trip.tripDate,
      startLocation: trip.startLocation,
      endLocation: trip.endLocation,
      startPostcode: trip.startPostcode,
      endPostcode: trip.endPostcode,
      distanceMiles: parseFloat(trip.distanceMiles),
      isRoundTrip: trip.isRoundTrip,
      purpose: trip.purpose,
      purposeCategory: trip.purposeCategory,
      taxYear: trip.taxYear,
      vehicleType: trip.vehicleType,
      rateApplied: parseFloat(trip.rateApplied),
      amountGbp: parseFloat(trip.amountGbp),
      userMilesYtd: parseFloat(trip.userMilesYtd),
      vehicle: trip.vehicle,
      notes: trip.notes,
      receipts: trip.receipts,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    },
  });
});

/**
 * Update a trip
 * PUT /api/trips/:id
 */
const updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check trip exists and belongs to user
  const existingTrip = await prisma.trip.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingTrip) {
    throw new NotFoundError('Trip');
  }

  // Build update object
  const data = {};

  if (updateData.tripDate !== undefined) data.tripDate = new Date(updateData.tripDate);
  if (updateData.startLocation !== undefined) data.startLocation = updateData.startLocation;
  if (updateData.endLocation !== undefined) data.endLocation = updateData.endLocation;
  if (updateData.startPostcode !== undefined) data.startPostcode = updateData.startPostcode;
  if (updateData.endPostcode !== undefined) data.endPostcode = updateData.endPostcode;
  if (updateData.isRoundTrip !== undefined) data.isRoundTrip = updateData.isRoundTrip;
  if (updateData.purpose !== undefined) data.purpose = updateData.purpose;
  if (updateData.purposeCategory !== undefined) data.purposeCategory = updateData.purposeCategory;
  if (updateData.vehicleId !== undefined) data.vehicleId = updateData.vehicleId;
  if (updateData.notes !== undefined) data.notes = updateData.notes;

  // If distance or round trip flag changed, recalculate amount
  const distanceChanged = updateData.distanceMiles !== undefined;
  const roundTripChanged = updateData.isRoundTrip !== undefined && 
    updateData.isRoundTrip !== existingTrip.isRoundTrip;
  
  if (distanceChanged || roundTripChanged) {
    // Calculate actual distance based on round trip flag
    const isRoundTrip = updateData.isRoundTrip !== undefined 
      ? updateData.isRoundTrip 
      : existingTrip.isRoundTrip;
    const baseDistance = distanceChanged 
      ? parseFloat(updateData.distanceMiles) 
      : parseFloat(existingTrip.distanceMiles) / (existingTrip.isRoundTrip ? 2 : 1);
    const newDistance = isRoundTrip ? baseDistance * 2 : baseDistance;
    const oldDistance = parseFloat(existingTrip.distanceMiles);

    // Always update distanceMiles and isRoundTrip when changed
    data.distanceMiles = newDistance;
    if (updateData.isRoundTrip !== undefined) {
      data.isRoundTrip = updateData.isRoundTrip;
    }

    // Save the changes first
    await prisma.trip.update({
      where: { id },
      data: {
        distanceMiles: newDistance,
        isRoundTrip: isRoundTrip,
      },
    });

    // Recalculate all trips for this tax year
    await recalculateTrips(req.user.id, existingTrip.taxYear);

    // Get updated trip
    const updatedTrip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            registration: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Trip updated successfully',
      data: {
        id: updatedTrip.id,
        tripDate: updatedTrip.tripDate,
        startLocation: updatedTrip.startLocation,
        endLocation: updatedTrip.endLocation,
        distanceMiles: parseFloat(updatedTrip.distanceMiles),
        isRoundTrip: updatedTrip.isRoundTrip,
        rateApplied: parseFloat(updatedTrip.rateApplied),
        amountGbp: parseFloat(updatedTrip.amountGbp),
        userMilesYtd: parseFloat(updatedTrip.userMilesYtd),
        vehicle: updatedTrip.vehicle,
        updatedAt: updatedTrip.updatedAt,
      },
    });
  }

  data.updatedBy = req.user.id;

  // Update trip
  const trip = await prisma.trip.update({
    where: { id },
    data,
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          registration: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'Trip updated successfully',
    data: {
      id: trip.id,
      tripDate: trip.tripDate,
      startLocation: trip.startLocation,
      endLocation: trip.endLocation,
      distanceMiles: parseFloat(trip.distanceMiles),
      isRoundTrip: trip.isRoundTrip,
      rateApplied: parseFloat(trip.rateApplied),
      amountGbp: parseFloat(trip.amountGbp),
      userMilesYtd: parseFloat(trip.userMilesYtd),
      vehicle: trip.vehicle,
      updatedAt: trip.updatedAt,
    },
  });
});

/**
 * Delete a trip
 * DELETE /api/trips/:id
 */
const deleteTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check trip exists and belongs to user
  const trip = await prisma.trip.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!trip) {
    throw new NotFoundError('Trip');
  }

  const taxYear = trip.taxYear;

  // Delete trip
  await prisma.trip.delete({
    where: { id },
  });

  // Recalculate remaining trips for this tax year
  await recalculateTrips(req.user.id, taxYear);

  res.json({
    success: true,
    message: 'Trip deleted successfully',
  });
});

/**
 * Get trip statistics
 * GET /api/trips/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const { taxYear, startDate, endDate } = req.query;

  const stats = await getComprehensiveStats(req.user.id, {
    taxYear,
    startDate,
    endDate,
  });

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Get trip summary (for dashboard)
 * GET /api/trips/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const taxYear = req.query.taxYear || null;
  const targetTaxYear = taxYear || require('../utils/hmrcRates').getCurrentTaxYear();

  // Get summary from database
  const summary = await prisma.userMileageSummary.findUnique({
    where: {
      userId_taxYear: {
        userId: req.user.id,
        taxYear: targetTaxYear,
      },
    },
  });

  if (summary) {
    return res.json({
      success: true,
      data: {
        taxYear: targetTaxYear,
        totalMiles: parseFloat(summary.totalMiles),
        totalAmount: parseFloat(summary.totalClaimAmount),
        tripCount: summary.tripCount,
        milesAt45p: parseFloat(summary.milesAt45p),
        amountAt45p: parseFloat(summary.amountAt45p),
        milesAt25p: parseFloat(summary.milesAt25p),
        amountAt25p: parseFloat(summary.amountAt25p),
        lastTripDate: summary.lastTripDate,
      },
    });
  }

  // Calculate from trips if no summary
  const result = await prisma.trip.aggregate({
    where: {
      userId: req.user.id,
      taxYear: targetTaxYear,
    },
    _sum: {
      distanceMiles: true,
      amountGbp: true,
    },
    _count: {
      id: true,
    },
  });

  res.json({
    success: true,
    data: {
      taxYear: targetTaxYear,
      totalMiles: parseFloat(result._sum.distanceMiles || 0),
      totalAmount: parseFloat(result._sum.amountGbp || 0),
      tripCount: result._count.id,
      milesAt45p: 0,
      amountAt45p: 0,
      milesAt25p: 0,
      amountAt25p: 0,
      lastTripDate: null,
    },
  });
});

module.exports = {
  listTrips,
  createTrip,
  getTrip,
  updateTrip,
  deleteTrip,
  getStats,
  getSummary,
};
