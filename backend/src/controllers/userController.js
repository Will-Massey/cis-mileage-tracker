/**
 * User Controller
 * Handles user management (admin only)
 */

const { prisma } = require('../config/database');
const { asyncHandler, NotFoundError, ConflictError } = require('../middleware/errorHandler');
const { hashPassword } = require('../config/security');
const { normalizeEmail } = require('../utils/validators');

/**
 * List all users (admin only)
 * GET /api/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            trips: true,
            vehicles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        stats: {
          tripCount: user._count.trips,
          vehicleCount: user._count.vehicles,
        },
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + users.length < total,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Get single user (admin only)
 * GET /api/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      preferences: true,
      lastLoginAt: true,
      loginCount: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          trips: true,
          vehicles: true,
          reports: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Get recent trips
  const recentTrips = await prisma.trip.findMany({
    where: { userId: id },
    orderBy: { tripDate: 'desc' },
    take: 5,
    select: {
      id: true,
      tripDate: true,
      startLocation: true,
      endLocation: true,
      distanceMiles: true,
      amountGbp: true,
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          tripCount: user._count.trips,
          vehicleCount: user._count.vehicles,
          reportCount: user._count.reports,
        },
      },
      recentTrips: recentTrips.map((trip) => ({
        id: trip.id,
        tripDate: trip.tripDate,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        distanceMiles: parseFloat(trip.distanceMiles),
        amountGbp: parseFloat(trip.amountGbp),
      })),
    },
  });
});

/**
 * Create a new user (admin only)
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role = 'user',
    companyId,
    phone,
    isActive = true,
  } = req.body;

  const normalizedEmail = normalizeEmail(email);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      role,
      companyId: companyId || null,
      phone: phone || null,
      isActive,
      emailVerified: true, // Admin-created users are pre-verified
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

/**
 * Update a user (admin only)
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    role,
    companyId,
    phone,
    isActive,
    emailVerified,
  } = req.body;

  // Check user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new NotFoundError('User');
  }

  // Prevent changing own role (to avoid locking yourself out)
  if (id === req.user.id && role && role !== req.user.role) {
    return res.status(400).json({
      success: false,
      message: 'Cannot change your own role',
    });
  }

  // Build update object
  const data = {};

  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (role !== undefined) data.role = role;
  if (companyId !== undefined) data.companyId = companyId || null;
  if (phone !== undefined) data.phone = phone || null;
  if (isActive !== undefined) data.isActive = isActive;
  if (emailVerified !== undefined) data.emailVerified = emailVerified;

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
});

/**
 * Delete a user (admin only)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account',
    });
  }

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Delete user (cascading deletes will handle related records)
  await prisma.user.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Reset user password (admin only)
 * POST /api/users/:id/reset-password
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update password
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
    },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: {
      userId: id,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

/**
 * Get system statistics (admin only)
 * GET /api/admin/stats
 */
const getSystemStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalTrips,
    totalMileage,
    totalClaims,
    recentUsers,
    recentTrips,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.trip.count(),
    prisma.trip.aggregate({
      _sum: { distanceMiles: true },
    }),
    prisma.trip.aggregate({
      _sum: { amountGbp: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  // Get trips by month
  const tripsByMonth = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', trip_date) as month,
      COUNT(*) as trip_count,
      SUM(distance_miles) as total_miles,
      SUM(amount_gbp) as total_amount
    FROM trips
    WHERE trip_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
    GROUP BY DATE_TRUNC('month', trip_date)
    ORDER BY month DESC
  `;

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      trips: {
        total: totalTrips,
        totalMiles: parseFloat(totalMileage._sum.distanceMiles || 0),
        totalClaims: parseFloat(totalClaims._sum.amountGbp || 0),
      },
      recentActivity: {
        users: recentUsers,
        trips: recentTrips.map((trip) => ({
          id: trip.id,
          userName: `${trip.user.firstName} ${trip.user.lastName}`,
          tripDate: trip.tripDate,
          distanceMiles: parseFloat(trip.distanceMiles),
          amountGbp: parseFloat(trip.amountGbp),
        })),
      },
      tripsByMonth: tripsByMonth.map((month) => ({
        month: month.month,
        tripCount: parseInt(month.trip_count),
        totalMiles: parseFloat(month.total_miles || 0),
        totalAmount: parseFloat(month.total_amount || 0),
      })),
    },
  });
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getSystemStats,
};
