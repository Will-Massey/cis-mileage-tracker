/**
 * Authentication Controller
 * UK Business Mileage Tracking Web App
 * 
 * This controller handles all authentication-related operations including
 * user registration, login, logout, password reset, and email verification.
 * 
 * Security Features:
 * - bcrypt password hashing (cost factor 12)
 * - JWT-based authentication with RS256
 * - Email verification with secure tokens
 * - Password reset with time-limited tokens
 * - Rate limiting on sensitive endpoints
 * - Comprehensive audit logging
 * - GDPR-compliant data handling
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  revokeToken,
  setAuthCookies,
  clearAuthCookies,
  extractRefreshToken
} = require('./auth-middleware');

// Configuration
const AUTH_CONFIG = {
  // bcrypt cost factor (2^12 = 4096 iterations)
  BCRYPT_ROUNDS: 12,
  
  // Token expiry times
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TOKEN_EXPIRY: 60 * 60 * 1000,    // 1 hour
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate cryptographically secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex-encoded token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash token for database storage
 * @param {string} token - Raw token
 * @returns {string} SHA-256 hash
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Get client IP address
 * @param {Object} req - Express request
 * @returns {string} IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.ip 
    || 'unknown';
}

/**
 * Hash IP for privacy-compliant logging
 * @param {string} ip - IP address
 * @returns {string} Hashed IP
 */
function hashIp(ip) {
  return crypto.createHash('sha256')
    .update(ip + (process.env.LOG_SALT || 'salt'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Log security event
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
function logSecurityEvent(event, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'security',
    event,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Check if password meets complexity requirements
 * @param {string} password - Password to check
 * @returns {Object} Validation result
 */
function validatePasswordComplexity(password) {
  const errors = [];
  
  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`);
  }
  
  if (password.length > AUTH_CONFIG.PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${AUTH_CONFIG.PASSWORD_MAX_LENGTH} characters`);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, companyName, acceptTerms, acceptPrivacy } = req.body;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Check if terms and privacy policy are accepted (GDPR requirement)
    if (!acceptTerms || !acceptPrivacy) {
      return res.status(400).json({
        success: false,
        error: 'You must accept the Terms of Service and Privacy Policy'
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      // Don't reveal that email exists (security through obscurity)
      return res.status(409).json({
        success: false,
        error: 'Registration failed. Please try again or contact support.'
      });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordCheck.errors
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + AUTH_CONFIG.VERIFICATION_TOKEN_EXPIRY);

    // Create user
    const result = await db.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, company_name,
        is_email_verified, email_verification_token, email_verification_expires,
        roles, is_active, created_at, updated_at,
        accepted_terms_at, accepted_privacy_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW(), NOW())
      RETURNING id, email, first_name, last_name, roles, created_at`,
      [
        normalizedEmail,
        passwordHash,
        firstName.trim(),
        lastName.trim(),
        companyName?.trim() || null,
        false, // is_email_verified
        verificationTokenHash,
        verificationExpires,
        JSON.stringify(['user']), // Default role
        true // is_active
      ]
    );

    const user = result.rows[0];

    // Record consent (GDPR requirement)
    await db.query(
      `INSERT INTO user_consents (
        user_id, consent_type, given, given_at, ip_address, user_agent
      ) VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [
        user.id,
        'terms_of_service',
        true,
        hashIp(getClientIp(req)),
        req.headers['user-agent']?.substring(0, 255) || null
      ]
    );

    await db.query(
      `INSERT INTO user_consents (
        user_id, consent_type, given, given_at, ip_address, user_agent
      ) VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [
        user.id,
        'privacy_policy',
        true,
        hashIp(getClientIp(req)),
        req.headers['user-agent']?.substring(0, 255) || null
      ]
    );

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken, {
      firstName: user.first_name
    });

    // Log registration
    logSecurityEvent('user_registered', {
      userId: user.id,
      ipAddress: hashIp(getClientIp(req)),
      userAgent: req.headers['user-agent']?.substring(0, 100)
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        userId: user.id,
        email: user.email,
        requiresEmailVerification: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again later.'
    });
  }
}

/**
 * Verify email address
 * GET /api/auth/verify-email/:token
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const db = req.app.locals.db;

    // Hash token for lookup
    const tokenHash = hashToken(token);

    // Find user with matching token
    const result = await db.query(
      `SELECT id, email, is_email_verified, email_verification_expires 
       FROM users 
       WHERE email_verification_token = $1 
       AND is_email_verified = false`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired. Please request a new one.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Mark email as verified
    await db.query(
      `UPDATE users 
       SET is_email_verified = true, 
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Log verification
    logSecurityEvent('email_verified', {
      userId: user.id,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      redirectTo: '/login'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
}

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Rate limiting check
    const rateKey = `resend_verification:${hashIp(getClientIp(req))}`;
    const attempts = await redis?.get(rateKey) || 0;
    
    if (parseInt(attempts) >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const result = await db.query(
      'SELECT id, first_name, is_email_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Don't reveal if email exists or is already verified
    if (result.rows.length === 0 || result.rows[0].is_email_verified) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    const user = result.rows[0];

    // Generate new verification token
    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + AUTH_CONFIG.VERIFICATION_TOKEN_EXPIRY);

    // Update user with new token
    await db.query(
      `UPDATE users 
       SET email_verification_token = $1, 
           email_verification_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [verificationTokenHash, verificationExpires, user.id]
    );

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken, {
      firstName: user.first_name
    });

    // Update rate limit
    if (redis) {
      await redis.incr(rateKey);
      await redis.expire(rateKey, 3600);
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resend verification email'
    });
  }
}

/**
 * User login
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const clientIp = getClientIp(req);

    // Rate limiting check
    const rateKey = `login_attempts:${hashIp(clientIp)}`;
    const attempts = await redis?.get(rateKey) || 0;
    
    if (parseInt(attempts) >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      logSecurityEvent('login_rate_limited', {
        email: email.toLowerCase().trim(),
        ipAddress: hashIp(clientIp)
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.floor(AUTH_CONFIG.LOCKOUT_DURATION / 1000)
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const result = await db.query(
      `SELECT id, email, password_hash, first_name, last_name, 
              roles, is_active, is_email_verified, failed_login_attempts,
              locked_until, last_login_at
       FROM users 
       WHERE email = $1`,
      [normalizedEmail]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      // Increment rate limit even for non-existent users (prevents enumeration)
      if (redis) {
        await redis.incr(rateKey);
        await redis.expire(rateKey, Math.floor(AUTH_CONFIG.LOCKOUT_DURATION / 1000));
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(401).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.locked_until
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;

      if (newFailedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + AUTH_CONFIG.LOCKOUT_DURATION);
      }

      await db.query(
        `UPDATE users 
         SET failed_login_attempts = $1, 
             locked_until = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [newFailedAttempts, lockedUntil, user.id]
      );

      // Increment rate limit
      if (redis) {
        await redis.incr(rateKey);
        await redis.expire(rateKey, Math.floor(AUTH_CONFIG.LOCKOUT_DURATION / 1000));
      }

      logSecurityEvent('login_failed', {
        userId: user.id,
        reason: 'invalid_password',
        attempts: newFailedAttempts,
        ipAddress: hashIp(clientIp)
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        resendLink: '/api/auth/resend-verification'
      });
    }

    // Generate session ID
    const sessionId = generateSecureToken();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      sessionId
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
      rememberMe: rememberMe === true
    });

    // Store session in database
    await db.query(
      `INSERT INTO user_sessions (
        id, user_id, refresh_token_hash, ip_address, user_agent,
        expires_at, created_at, last_used_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        sessionId,
        user.id,
        hashToken(refreshToken.token),
        hashIp(clientIp),
        req.headers['user-agent']?.substring(0, 255) || null,
        refreshToken.expiresAt
      ]
    );

    // Update user login info
    await db.query(
      `UPDATE users 
       SET last_login_at = NOW(),
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Clear rate limit on successful login
    if (redis) {
      await redis.del(rateKey);
    }

    // Set cookies
    setAuthCookies(res, { accessToken, refreshToken });

    // Log successful login
    logSecurityEvent('login_success', {
      userId: user.id,
      sessionId,
      ipAddress: hashIp(clientIp),
      userAgent: req.headers['user-agent']?.substring(0, 100)
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles,
          lastLoginAt: user.last_login_at
        },
        accessToken: accessToken.token,
        expiresAt: accessToken.expiresAt,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again later.'
    });
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
async function refreshAccessToken(req, res) {
  try {
    const { refreshContext } = req;
    const db = req.app.locals.db;

    if (!refreshContext) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh context',
        code: 'REFRESH_FAILED'
      });
    }

    const { userId, sessionId, user } = refreshContext;

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId,
      email: user.email,
      roles: user.roles,
      sessionId
    });

    const newRefreshToken = generateRefreshToken({
      userId,
      sessionId,
      rememberMe: true // Maintain remember me status
    });

    // Update session with new refresh token hash
    await db.query(
      `UPDATE user_sessions 
       SET refresh_token_hash = $1,
           last_used_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [hashToken(newRefreshToken.token), sessionId, userId]
    );

    // Set new cookies
    setAuthCookies(res, { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken 
    });

    logSecurityEvent('token_refreshed', {
      userId,
      sessionId,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken.token,
        expiresAt: newAccessToken.expiresAt,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
}

/**
 * User logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const { user, tokenInfo } = req;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    if (user) {
      // Delete session from database
      await db.query(
        'DELETE FROM user_sessions WHERE user_id = $1 AND id = $2',
        [user.userId, user.sessionId]
      );

      // Revoke tokens in Redis
      if (redis && tokenInfo) {
        const ttl = Math.floor((tokenInfo.expiresAt - Date.now()) / 1000);
        if (ttl > 0) {
          await revokeToken(tokenInfo.tokenId, ttl, redis);
        }
      }

      logSecurityEvent('logout', {
        userId: user.userId,
        sessionId: user.sessionId,
        ipAddress: hashIp(getClientIp(req))
      });
    }

    // Clear cookies regardless of auth status
    clearAuthCookies(res);

    return res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies on error
    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
async function logoutAll(req, res) {
  try {
    const { user } = req;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Delete all sessions for user
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [user.userId]
    );

    // Revoke all tokens for user in Redis
    if (redis) {
      await redis.setex(
        `user_revoked:${user.userId}`,
        86400, // 24 hours
        Date.now().toString()
      );
    }

    // Clear cookies
    clearAuthCookies(res);

    logSecurityEvent('logout_all', {
      userId: user.userId,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Rate limiting
    const rateKey = `password_reset:${hashIp(getClientIp(req))}`;
    const attempts = await redis?.get(rateKey) || 0;
    
    if (parseInt(attempts) >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user (don't reveal if exists)
    const result = await db.query(
      'SELECT id, first_name, email FROM users WHERE email = $1 AND is_active = true',
      [normalizedEmail]
    );

    // Always return success (prevent email enumeration)
    if (result.rows.length === 0) {
      // Still increment rate limit
      if (redis) {
        await redis.incr(rateKey);
        await redis.expire(rateKey, 3600);
      }

      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);
    const resetExpires = new Date(Date.now() + AUTH_CONFIG.PASSWORD_RESET_TOKEN_EXPIRY);

    // Store reset token
    await db.query(
      `UPDATE users 
       SET password_reset_token = $1,
           password_reset_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [resetTokenHash, resetExpires, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(normalizedEmail, resetToken, {
      firstName: user.first_name
    });

    // Update rate limit
    if (redis) {
      await redis.incr(rateKey);
      await redis.expire(rateKey, 3600);
    }

    logSecurityEvent('password_reset_requested', {
      userId: user.id,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset request failed'
    });
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordCheck.errors
      });
    }

    // Hash token for lookup
    const tokenHash = hashToken(token);

    // Find user with valid reset token
    const result = await db.query(
      `SELECT id, email, password_reset_expires 
       FROM users 
       WHERE password_reset_token = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.password_reset_expires)) {
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new one.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await db.query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           password_changed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Delete all sessions (force re-login)
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [user.id]
    );

    // Revoke all tokens
    if (redis) {
      await redis.setex(
        `user_revoked:${user.id}`,
        86400,
        Date.now().toString()
      );
    }

    // Send confirmation email
    await sendPasswordChangedEmail(user.email);

    logSecurityEvent('password_reset_completed', {
      userId: user.id,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
      redirectTo: '/login'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
}

/**
 * Change password (authenticated)
 * POST /api/auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordCheck.errors
      });
    }

    // Get current password hash
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db.query(
      `UPDATE users 
       SET password_hash = $1,
           password_changed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.userId]
    );

    // Delete all other sessions (keep current)
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1 AND id != $2',
      [user.userId, user.sessionId]
    );

    logSecurityEvent('password_changed', {
      userId: user.userId,
      ipAddress: hashIp(getClientIp(req))
    });

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
}

/**
 * Get current user info
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const { user } = req;
    const db = req.app.locals.db;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Fetch fresh user data
    const result = await db.query(
      `SELECT id, email, first_name, last_name, company_name,
              roles, is_email_verified, last_login_at, created_at,
              password_changed_at
       FROM users 
       WHERE id = $1`,
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = result.rows[0];

    return res.json({
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        companyName: userData.company_name,
        roles: userData.roles,
        isEmailVerified: userData.is_email_verified,
        lastLoginAt: userData.last_login_at,
        createdAt: userData.created_at,
        passwordChangedAt: userData.password_changed_at
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user information'
    });
  }
}

// ============================================================================
// Email Service Functions (Placeholder - integrate with your email provider)
// ============================================================================

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {Object} options - Email options
 */
async function sendVerificationEmail(email, token, options = {}) {
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
  
  // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`[EMAIL] Verification email to ${email}: ${verificationUrl}`);
  
  // Example with SendGrid:
  // await sgMail.send({
  //   to: email,
  //   from: process.env.FROM_EMAIL,
  //   templateId: process.env.VERIFY_EMAIL_TEMPLATE,
  //   dynamicTemplateData: {
  //     firstName: options.firstName,
  //     verificationUrl
  //   }
  // });
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @param {Object} options - Email options
 */
async function sendPasswordResetEmail(email, token, options = {}) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  
  console.log(`[EMAIL] Password reset email to ${email}: ${resetUrl}`);
  
  // TODO: Integrate with your email service
}

/**
 * Send password changed confirmation email
 * @param {string} email - Recipient email
 */
async function sendPasswordChangedEmail(email) {
  console.log(`[EMAIL] Password changed confirmation to ${email}`);
  
  // TODO: Integrate with your email service
}

// Export all functions
module.exports = {
  // Registration
  register,
  verifyEmail,
  resendVerification,
  
  // Authentication
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  
  // Password management
  forgotPassword,
  resetPassword,
  changePassword,
  
  // User info
  getCurrentUser,
  
  // Utilities
  hashPassword,
  comparePassword,
  validatePasswordComplexity,
  generateSecureToken,
  hashToken,
  
  // Configuration
  AUTH_CONFIG
};
