/**
 * Authentication Controller
 * Handles user registration, login, logout, and password management
 */

const { prisma } = require('../config/database');
const {
  generateTokens,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  generateSecureToken,
  rateLimiters,
} = require('../config/security');
const { normalizeEmail } = require('../utils/validators');
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, companyId } = req.body;

  const normalizedEmail = normalizeEmail(email);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
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
      phone,
      companyId: companyId || null,
      role: 'user',
      isActive: true,
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokens({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  // Send welcome email (don't wait for it)
  sendWelcomeEmail({
    email: user.email,
    firstName: user.firstName,
  }).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes
      },
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is disabled',
    });
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  // Generate tokens
  const tokens = generateTokens({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  // Return user data (excluding password)
  const userData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    phone: user.phone,
    emailVerified: user.emailVerified,
    lastLoginAt: new Date(),
  };

  res.json({
    success: true,
    data: {
      user: userData,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      },
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Revoke refresh token if provided
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  // If user is authenticated, revoke all their refresh tokens
  if (req.user) {
    await prisma.refreshToken.updateMany({
      where: {
        userId: req.user.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }

  // Check if token exists and is valid in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!storedToken || !storedToken.user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new tokens
  const tokens = generateTokens({
    sub: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
    },
  });
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
  }

  // Generate reset token
  const resetToken = generateSecureToken(32);
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: resetExpires,
    },
  });

  // Send reset email
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password`;
  sendPasswordResetEmail(user, resetToken, resetUrl).catch(console.error);

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent',
  });
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Find user with valid reset token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  // Send confirmation email
  sendPasswordChangedEmail(user).catch(console.error);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
      phone: true,
      preferences: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 * PUT /api/auth/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, preferences } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName,
      lastName,
      phone,
      preferences: preferences ? JSON.stringify(preferences) : undefined,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      preferences: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
    },
  });

  // Revoke all refresh tokens except current
  await prisma.refreshToken.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
      token: {
        not: req.body.refreshToken || '',
      },
    },
    data: { revokedAt: new Date() },
  });

  // Send confirmation email
  sendPasswordChangedEmail(user).catch(console.error);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
