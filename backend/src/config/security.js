/**
 * Security Configuration
 * JWT, bcrypt, and security middleware settings
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// JWT Configuration
const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-min-32-chars',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  algorithm: 'HS256', // Use RS256 in production with key pairs
};

// Bcrypt Configuration
const BCRYPT_CONFIG = {
  rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
};

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    
    // Allow Render subdomains (mileage-tracker-*.onrender.com)
    const isRenderSubdomain = origin.match(/^https:\/\/mileage-.*\.onrender\.com$/);
    
    if (allowedOrigins.includes(origin) || isRenderSubdomain) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(null, true); // Temporarily allow all for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
};

// Helmet Configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// Rate Limiting Configurations
const rateLimiters = {
  // General API rate limiter
  api: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  }),

  // Strict rate limiter for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  }),

  // Registration rate limiter
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      message: 'Too many registration attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Password reset rate limiter
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      message: 'Too many password reset requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Admin endpoints rate limiter
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
      success: false,
      message: 'Too many admin requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// JWT Helper Functions
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, JWT_CONFIG.accessTokenSecret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    algorithm: JWT_CONFIG.algorithm,
  });

  const refreshToken = jwt.sign(
    { sub: payload.sub, type: 'refresh' },
    JWT_CONFIG.refreshTokenSecret,
    {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      algorithm: JWT_CONFIG.algorithm,
    }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
    algorithms: [JWT_CONFIG.algorithm],
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.refreshTokenSecret, {
    algorithms: [JWT_CONFIG.algorithm],
  });
};

// Bcrypt Helper Functions
const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_CONFIG.rounds);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  JWT_CONFIG,
  BCRYPT_CONFIG,
  corsOptions,
  helmetConfig,
  rateLimiters,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  generateSecureToken,
  cors: cors(corsOptions),
  helmet: helmet(helmetConfig),
};
