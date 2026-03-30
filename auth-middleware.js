/**
 * Authentication Middleware
 * UK Business Mileage Tracking Web App
 * 
 * This module provides JWT verification and authentication middleware
 * with comprehensive security measures including token validation,
 * revocation checking, and secure session management.
 * 
 * Security Features:
 * - RS256 asymmetric JWT verification
 * - Token revocation checking via Redis
 * - Secure token extraction from cookies/headers
 * - Rate limiting integration
 * - Comprehensive audit logging
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const JWT_CONFIG = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  
  // Token issuer and audience
  ISSUER: process.env.JWT_ISSUER || 'mileage-tracker-app',
  AUDIENCE: process.env.JWT_AUDIENCE || 'mileage-tracker-api',
  
  // Key paths (should be mounted secrets in production)
  PRIVATE_KEY_PATH: process.env.JWT_PRIVATE_KEY_PATH || './secrets/jwt-private.pem',
  PUBLIC_KEY_PATH: process.env.JWT_PUBLIC_KEY_PATH || './secrets/jwt-public.pem',
  
  // Algorithm
  ALGORITHM: 'RS256'
};

// In-memory cache for public key (improves performance)
let cachedPublicKey = null;
let cachedPrivateKey = null;

/**
 * Load RSA keys from filesystem
 * Keys should be stored securely and mounted as secrets in production
 * @returns {Object} Object containing public and private keys
 */
function loadKeys() {
  try {
    // Use cached keys if available
    if (cachedPublicKey && cachedPrivateKey) {
      return { publicKey: cachedPublicKey, privateKey: cachedPrivateKey };
    }

    // Load keys from filesystem
    const publicKey = fs.readFileSync(path.resolve(JWT_CONFIG.PUBLIC_KEY_PATH), 'utf8');
    const privateKey = fs.readFileSync(path.resolve(JWT_CONFIG.PRIVATE_KEY_PATH), 'utf8');
    
    // Cache keys for performance
    cachedPublicKey = publicKey;
    cachedPrivateKey = privateKey;
    
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Failed to load JWT keys:', error.message);
    throw new Error('JWT key loading failed - check key paths and permissions');
  }
}

/**
 * Generate cryptographically secure token ID
 * Used for token revocation tracking
 * @returns {string} 32-byte hex string
 */
function generateTokenId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode
 * @param {string} payload.userId - User's unique ID
 * @param {string} payload.email - User's email address
 * @param {string[]} payload.roles - User's roles
 * @param {string} payload.sessionId - Session identifier
 * @returns {Object} Object containing token and metadata
 */
function generateAccessToken(payload) {
  const { privateKey } = loadKeys();
  const tokenId = generateTokenId();
  
  const tokenPayload = {
    sub: payload.userId,           // Subject (user ID)
    email: payload.email,          // User email
    roles: payload.roles || ['user'], // User roles
    sid: payload.sessionId,        // Session ID for revocation
    jti: tokenId,                  // Unique token ID
    type: 'access',                // Token type
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(tokenPayload, privateKey, {
    algorithm: JWT_CONFIG.ALGORITHM,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  });

  return {
    token,
    tokenId,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    expiresAt: new Date(Date.now() + parseExpiryToMs(JWT_CONFIG.ACCESS_TOKEN_EXPIRY))
  };
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode
 * @param {string} payload.userId - User's unique ID
 * @param {string} payload.sessionId - Session identifier
 * @param {boolean} payload.rememberMe - Whether to extend token lifetime
 * @returns {Object} Object containing token and metadata
 */
function generateRefreshToken(payload) {
  const { privateKey } = loadKeys();
  const tokenId = generateTokenId();
  
  // Extend expiry if remember me is enabled
  const expiry = payload.rememberMe 
    ? JWT_CONFIG.REFRESH_TOKEN_EXPIRY 
    : '24h';

  const tokenPayload = {
    sub: payload.userId,           // Subject (user ID)
    sid: payload.sessionId,        // Session ID
    jti: tokenId,                  // Unique token ID
    type: 'refresh',               // Token type
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(tokenPayload, privateKey, {
    algorithm: JWT_CONFIG.ALGORITHM,
    expiresIn: expiry,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  });

  return {
    token,
    tokenId,
    expiresIn: expiry,
    expiresAt: new Date(Date.now() + parseExpiryToMs(expiry))
  };
}

/**
 * Parse JWT expiry string to milliseconds
 * @param {string} expiry - Expiry string (e.g., '15m', '7d', '24h')
 * @returns {number} Milliseconds
 */
function parseExpiryToMs(expiry) {
  const match = expiry.match(/^(\d+)([mhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    'm': 60 * 1000,        // minutes
    'h': 60 * 60 * 1000,   // hours
    'd': 24 * 60 * 60 * 1000 // days
  };
  
  return value * multipliers[unit];
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @param {string} expectedType - Expected token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token, expectedType = 'access') {
  const { publicKey } = loadKeys();
  
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [JWT_CONFIG.ALGORITHM],
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      complete: false
    });

    // Verify token type
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from request
 * Checks Authorization header first, then cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
function extractToken(req) {
  // Check Authorization header first (preferred for API requests)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (fallback for web requests)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * Extract refresh token from request
 * Only checks httpOnly cookie for security
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted refresh token or null
 */
function extractRefreshToken(req) {
  // Refresh token should only be in httpOnly cookie
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }
  return null;
}

/**
 * Check if token has been revoked
 * Uses Redis for fast lookup
 * @param {string} tokenId - JWT token ID (jti claim)
 * @param {Object} redisClient - Redis client instance
 * @returns {Promise<boolean>} True if revoked
 */
async function isTokenRevoked(tokenId, redisClient) {
  if (!redisClient) {
    console.warn('Redis client not available - token revocation check skipped');
    return false;
  }
  
  try {
    const revoked = await redisClient.get(`revoked:${tokenId}`);
    return revoked !== null;
  } catch (error) {
    console.error('Redis error during token revocation check:', error);
    // Fail secure - assume revoked if Redis is unavailable
    return true;
  }
}

/**
 * Revoke a token
 * Stores token ID in Redis with TTL matching token expiry
 * @param {string} tokenId - JWT token ID
 * @param {number} expirySeconds - Token expiry in seconds
 * @param {Object} redisClient - Redis client instance
 */
async function revokeToken(tokenId, expirySeconds, redisClient) {
  if (!redisClient) {
    console.warn('Redis client not available - token not revoked');
    return;
  }
  
  try {
    await redisClient.setex(`revoked:${tokenId}`, expirySeconds, '1');
  } catch (error) {
    console.error('Failed to revoke token:', error);
    throw new Error('Token revocation failed');
  }
}

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user info to request
 * @param {Object} options - Middleware options
 * @param {Object} options.redisClient - Redis client for token revocation checking
 * @param {Function} options.getUserById - Function to fetch user from database
 * @returns {Function} Express middleware
 */
function authenticate(options = {}) {
  const { redisClient, getUserById } = options;

  return async (req, res, next) => {
    try {
      // Extract token from request
      const token = extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = verifyToken(token, 'access');
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'INVALID_TOKEN'
        });
      }

      // Check if token has been revoked
      if (redisClient && await isTokenRevoked(decoded.jti, redisClient)) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }

      // Fetch fresh user data from database
      // This ensures user hasn't been deactivated or changed roles
      let user;
      if (getUserById) {
        user = await getUserById(decoded.sub);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }
        
        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Account has been deactivated',
            code: 'ACCOUNT_INACTIVE'
          });
        }
        
        if (user.sessionId !== decoded.sid) {
          return res.status(401).json({
            success: false,
            error: 'Session has been invalidated',
            code: 'SESSION_INVALIDATED'
          });
        }
      }

      // Attach user info to request
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
        sessionId: decoded.sid,
        tokenId: decoded.jti,
        // Use fresh data from database if available
        ...(user && {
          email: user.email,
          roles: user.roles,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt
        })
      };

      // Add token info for potential revocation
      req.tokenInfo = {
        tokenId: decoded.jti,
        expiresAt: new Date(decoded.exp * 1000)
      };

      // Log successful authentication (for audit trail)
      logAuthEvent('token_verified', {
        userId: decoded.sub,
        ipAddress: hashIp(req.ip),
        userAgent: hashString(req.headers['user-agent']),
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication check failed',
        code: 'AUTH_ERROR'
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require authentication
 * @param {Object} options - Same as authenticate()
 * @returns {Function} Express middleware
 */
function optionalAuth(options = {}) {
  const { redisClient, getUserById } = options;

  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      
      if (!token) {
        req.user = null;
        return next();
      }

      let decoded;
      try {
        decoded = verifyToken(token, 'access');
      } catch (error) {
        req.user = null;
        return next();
      }

      if (redisClient && await isTokenRevoked(decoded.jti, redisClient)) {
        req.user = null;
        return next();
      }

      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
        sessionId: decoded.sid,
        tokenId: decoded.jti
      };

      next();
    } catch (error) {
      req.user = null;
      next();
    }
  };
}

/**
 * Refresh token middleware
 * Handles token refresh with rotation
 * @param {Object} options - Middleware options
 * @param {Object} options.redisClient - Redis client
 * @param {Function} options.getUserById - Function to fetch user
 * @param {Function} options.updateSession - Function to update session
 * @returns {Function} Express middleware
 */
function refreshToken(options = {}) {
  const { redisClient, getUserById, updateSession } = options;

  return async (req, res, next) => {
    try {
      const refreshToken = extractRefreshToken(req);

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = verifyToken(refreshToken, 'refresh');
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Check if refresh token has been revoked
      if (redisClient && await isTokenRevoked(decoded.jti, redisClient)) {
        // Potential token reuse detected - revoke all user sessions
        await revokeAllUserSessions(decoded.sub, redisClient);
        
        return res.status(401).json({
          success: false,
          error: 'Security violation detected. Please log in again.',
          code: 'TOKEN_REUSE_DETECTED'
        });
      }

      // Fetch user
      let user;
      if (getUserById) {
        user = await getUserById(decoded.sub);
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'User not found or inactive',
            code: 'USER_INVALID'
          });
        }
      }

      // Revoke the old refresh token (token rotation)
      if (redisClient) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        await revokeToken(decoded.jti, ttl, redisClient);
      }

      // Attach refresh info to request
      req.refreshContext = {
        userId: decoded.sub,
        sessionId: decoded.sid,
        oldTokenId: decoded.jti,
        user: user
      };

      next();
    } catch (error) {
      console.error('Refresh token middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      });
    }
  };
}

/**
 * Revoke all sessions for a user
 * Used when security violation is detected
 * @param {string} userId - User ID
 * @param {Object} redisClient - Redis client
 */
async function revokeAllUserSessions(userId, redisClient) {
  if (!redisClient) return;
  
  try {
    // Store flag that all sessions should be revoked
    // Actual implementation would track all session IDs per user
    await redisClient.setex(`user_revoked:${userId}`, 86400, Date.now().toString());
  } catch (error) {
    console.error('Failed to revoke user sessions:', error);
  }
}

/**
 * Hash IP address for logging (privacy protection)
 * @param {string} ip - IP address
 * @returns {string} Hashed IP
 */
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256')
    .update(ip + (process.env.LOG_SALT || 'default-salt'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Hash string for logging (privacy protection)
 * @param {string} str - String to hash
 * @returns {string} Hashed string
 */
function hashString(str) {
  if (!str) return null;
  return crypto.createHash('sha256')
    .update(str + (process.env.LOG_SALT || 'default-salt'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Log authentication event
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
function logAuthEvent(event, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'auth',
    event,
    ...data
  };
  
  // In production, send to centralized logging
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Winston, CloudWatch)
    console.log(JSON.stringify(logEntry));
  } else {
    console.log('[AUTH]', logEntry);
  }
}

/**
 * Generate secure cookie settings
 * @param {Object} options - Cookie options
 * @returns {Object} Cookie configuration
 */
function getCookieSettings(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,                    // Prevent JavaScript access
    secure: isProduction,              // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // Default 7 days
    path: '/',                         // Available site-wide
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
  };
}

/**
 * Set authentication cookies
 * @param {Object} res - Express response object
 * @param {Object} tokens - Token object with access and refresh tokens
 */
function setAuthCookies(res, tokens) {
  const { accessToken, refreshToken } = tokens;
  
  // Access token cookie (short-lived)
  res.cookie('accessToken', accessToken.token, getCookieSettings({
    maxAge: parseExpiryToMs(accessToken.expiresIn)
  }));
  
  // Refresh token cookie (longer-lived)
  res.cookie('refreshToken', refreshToken.token, getCookieSettings({
    maxAge: parseExpiryToMs(refreshToken.expiresIn)
  }));
}

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

// Export all functions
module.exports = {
  // Main middleware
  authenticate,
  optionalAuth,
  refreshToken,
  
  // Token generation
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  
  // Token management
  revokeToken,
  isTokenRevoked,
  revokeAllUserSessions,
  
  // Token extraction
  extractToken,
  extractRefreshToken,
  
  // Cookie helpers
  setAuthCookies,
  clearAuthCookies,
  getCookieSettings,
  
  // Utilities
  generateTokenId,
  loadKeys,
  
  // Configuration
  JWT_CONFIG
};
