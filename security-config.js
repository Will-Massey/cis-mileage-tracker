/**
 * Security Configuration
 * UK Business Mileage Tracking Web App
 * 
 * This module configures all security-related middleware including:
 * - Helmet (security headers)
 * - CORS (Cross-Origin Resource Sharing)
 * - Rate Limiting
 * - CSRF Protection
 * - Content Security Policy
 * 
 * All configurations follow OWASP best practices and UK GDPR requirements.
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// ============================================================================
// Environment Configuration
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : isProduction 
    ? ['https://mileage-tracker.example.com']
    : ['http://localhost:3000', 'http://localhost:5173'];

// ============================================================================
// Helmet Configuration (Security Headers)
// ============================================================================

/**
 * Content Security Policy Configuration
 * Defines allowed sources for various content types
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    
    // Scripts - only allow self and nonce-based inline scripts
    scriptSrc: [
      "'self'",
      // Nonce will be added dynamically per request
      (req, res) => `'nonce-${res.locals.cspNonce}'`,
      // Allow eval in development only (for React dev tools)
      ...(isDevelopment ? ["'unsafe-eval'"] : [])
    ],
    
    // Styles - allow self and inline (needed for some UI libraries)
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      // Google Fonts (if used)
      'https://fonts.googleapis.com'
    ],
    
    // Images - allow self, data URIs, and HTTPS
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https:'
    ],
    
    // Fonts - allow self and Google Fonts CDN
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    
    // Connect (XHR, WebSocket) - allow self and API
    connectSrc: [
      "'self'",
      process.env.API_URL || 'https://api.mileage-tracker.example.com'
    ],
    
    // Media - allow self only
    mediaSrc: ["'self'"],
    
    // Object (Flash, etc) - disallow
    objectSrc: ["'none'"],
    
    // Frames - prevent clickjacking
    frameSrc: ["'none'"],
    
    // Frame ancestors - prevent embedding
    frameAncestors: ["'none'"],
    
    // Base URI - restrict base tag
    baseUri: ["'self'"],
    
    // Form action - restrict form submissions
    formAction: ["'self'"],
    
    // Upgrade insecure requests in production
    upgradeInsecureRequests: isProduction ? [] : null,
    
    // Block all mixed content
    blockAllMixedContent: isProduction ? [] : null
  },
  
  // Report CSP violations
  reportOnly: false,
  
  // Custom report URI for CSP violations
  reportUri: '/api/security/csp-report'
};

/**
 * Permissions Policy Configuration
 * Controls browser features and APIs
 */
const permissionsPolicy = {
  features: {
    // Camera - not needed
    camera: ["'none'"],
    
    // Microphone - not needed
    microphone: ["'none'"],
    
    // Geolocation - needed for trip tracking
    geolocation: ["'self'"],
    
    // Notifications - optional for reminders
    notifications: ["'self'"],
    
    // Payment - not needed
    payment: ["'none'"],
    
    // USB - not needed
    usb: ["'none'"],
    
    // Magnetometer - not needed
    magnetometer: ["'none'"],
    
    // Gyroscope - not needed
    gyroscope: ["'none'"],
    
    // Accelerometer - not needed
    accelerometer: ["'none'"],
    
    // Fullscreen - allow for maps
    fullscreen: ["'self'"],
    
    // Picture-in-picture - not needed
    pictureInPicture: ["'none'"],
    
    // Sync-xhr - restrict
    syncXhr: ["'none'"]
  }
};

/**
 * Helmet middleware configuration
 */
const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: cspConfig,
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: isProduction,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },
  
  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // Frameguard (Clickjacking protection)
  frameguard: {
    action: 'deny'
  },
  
  // Hide Powered-By
  hidePoweredBy: true,
  
  // Strict Transport Security (HSTS)
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff (MIME type sniffing)
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permissions Policy
  permissionsPolicy: permissionsPolicy,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // X-XSS-Protection (legacy browser support)
  xssFilter: true
});

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * CORS middleware configuration
 */
const corsMiddleware = cors({
  // Allowed origins
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (ALLOWED_ORIGINS.includes(origin) || isDevelopment) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID'
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID'
  ],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Max age for preflight cache
  maxAge: 86400, // 24 hours
  
  // Preflight continue
  preflightContinue: false,
  
  // Options success status
  optionsSuccessStatus: 204
});

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Create rate limiter with Redis store
 * @param {Object} options - Rate limiter options
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later.',
    keyPrefix = 'rl',
    skipSuccessfulRequests = false,
    statusCode = 429
  } = options;

  const limiterConfig = {
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit headers
    statusCode,
    skipSuccessfulRequests,
    
    // Key generator - use IP + user ID if authenticated
    keyGenerator: (req) => {
      const userId = req.user?.userId || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `${keyPrefix}:${userId}:${ip}`;
    },
    
    // Handler for when limit is reached
    handler: (req, res, next, options) => {
      console.warn(`[RATE LIMIT] Limit exceeded: ${req.ip}`, {
        path: req.path,
        userId: req.user?.userId
      });
      
      res.status(options.statusCode).json(options.message);
    },
    
    // Skip certain requests
    skip: (req) => {
      // Skip health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }
      // Skip in development (optional)
      // return isDevelopment;
      return false;
    }
  };

  // Use Redis store if available
  if (process.env.REDIS_URL) {
    limiterConfig.store = new RedisStore({
      // @ts-ignore - Redis client
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: `${keyPrefix}:`
    });
  }

  return rateLimit(limiterConfig);
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyPrefix: 'rl:api'
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  keyPrefix: 'rl:auth',
  skipSuccessfulRequests: false
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many registration attempts. Please try again later.',
  keyPrefix: 'rl:register'
});

/**
 * Password reset rate limiter
 * 3 requests per hour per email
 */
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again later.',
  keyPrefix: 'rl:password-reset'
});

/**
 * Admin rate limiter
 * 50 requests per 15 minutes for admin endpoints
 */
const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Admin rate limit exceeded.',
  keyPrefix: 'rl:admin'
});

/**
 * Export rate limiter
 * 10 exports per hour
 */
const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Export rate limit exceeded. Please try again later.',
  keyPrefix: 'rl:export'
});

// ============================================================================
// CSRF Protection Configuration
// ============================================================================

/**
 * CSRF protection middleware
 * Uses double-submit cookie pattern
 */
const csrfProtection = csrf({
  // Cookie configuration
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Value getter - check header first, then body
  value: (req) => {
    return req.headers['x-csrf-token'] || 
           req.body?._csrf || 
           req.query?._csrf;
  }
});

/**
 * CSRF error handler
 */
function handleCSRFError(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  
  console.warn('[CSRF] Invalid token:', {
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });
  
  res.status(403).json({
    success: false,
    error: 'Invalid CSRF token',
    code: 'CSRF_INVALID'
  });
}

/**
 * Generate and send CSRF token
 */
function sendCSRFToken(req, res) {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
}

// ============================================================================
// Additional Security Middleware
// ============================================================================

/**
 * HTTP Parameter Pollution protection
 * Prevents attacks using duplicate query parameters
 */
const hppMiddleware = hpp({
  // Whitelist parameters that can be arrays
  whitelist: [
    'tags',
    'roles',
    'dataTypes',
    'sort'
  ]
});

/**
 * MongoDB sanitization
 * Prevents NoSQL injection attacks
 */
const mongoSanitizeMiddleware = mongoSanitize({
  // Replace prohibited characters with '_'
  replaceWith: '_',
  
  // Also sanitize keys
  onSanitize: ({ req, key }) => {
    console.warn(`[SANITIZE] Sanitized key: ${key}`, {
      path: req.path,
      ip: req.ip
    });
  }
});

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] ||
                    require('crypto').randomUUID();
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * CSP Nonce generator middleware
 * Generates nonce for inline scripts
 */
function cspNonceMiddleware(req, res, next) {
  res.locals.cspNonce = require('crypto').randomBytes(16).toString('base64');
  next();
}

/**
 * Security headers middleware (additional to Helmet)
 */
function additionalSecurityHeaders(req, res, next) {
  // Remove server fingerprinting
  res.removeHeader('X-Powered-By');
  
  // Add cache control for sensitive endpoints
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Add feature policy for older browsers
  res.setHeader('Feature-Policy', "camera 'none'; microphone 'none'; geolocation 'self'");
  
  next();
}

/**
 * Security audit logging middleware
 */
function securityAuditMiddleware(req, res, next) {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\./,                    // Path traversal
    /<script/i,                // XSS attempt
    /SELECT\s+/i,              // SQL injection
    /UNION\s+SELECT/i,         // SQL injection
    /javascript:/i,            // XSS
    /on\w+\s*=/i               // Event handler injection
  ];
  
  const requestData = JSON.stringify({
    query: req.query,
    body: req.body,
    params: req.params
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.warn('[SECURITY AUDIT] Suspicious pattern detected:', {
        pattern: pattern.toString(),
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']?.substring(0, 100)
      });
      break;
    }
  }
  
  next();
}

// ============================================================================
// Combined Security Middleware Setup
// ============================================================================

/**
 * Apply all security middleware to Express app
 * @param {Object} app - Express application
 */
function setupSecurityMiddleware(app) {
  // Trust proxy (required for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);
  
  // Request ID
  app.use(requestIdMiddleware);
  
  // CSP Nonce generator
  app.use(cspNonceMiddleware);
  
  // Helmet security headers
  app.use(helmetMiddleware);
  
  // Additional security headers
  app.use(additionalSecurityHeaders);
  
  // CORS
  app.use(corsMiddleware);
  
  // Cookie parser (required for CSRF)
  app.use(cookieParser(process.env.COOKIE_SECRET));
  
  // Body parsing (before CSRF)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // HTTP Parameter Pollution protection
  app.use(hppMiddleware);
  
  // MongoDB sanitization
  app.use(mongoSanitizeMiddleware);
  
  // Security audit logging
  app.use(securityAuditMiddleware);
  
  // General API rate limiting
  app.use('/api/', apiRateLimiter);
  
  // Auth-specific rate limiting
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', registerRateLimiter);
  app.use('/api/auth/forgot-password', passwordResetRateLimiter);
  app.use('/api/auth/reset-password', passwordResetRateLimiter);
  
  // Admin rate limiting
  app.use('/api/admin/', adminRateLimiter);
  
  // Export rate limiting
  app.use('/api/export', exportRateLimiter);
  
  // CSRF protection (skip for certain routes)
  app.use((req, res, next) => {
    // Skip CSRF for webhook endpoints, mobile API, etc.
    const skipCSRF = [
      '/api/webhooks/',
      '/api/mobile/',
      '/api/public/'
    ];
    
    if (skipCSRF.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    csrfProtection(req, res, next);
  });
  
  // CSRF error handler
  app.use(handleCSRFError);
  
  console.log('[SECURITY] Security middleware configured');
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Middleware setup
  setupSecurityMiddleware,
  
  // Individual middleware
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  mongoSanitizeMiddleware,
  csrfProtection,
  
  // Rate limiters
  rateLimiters: {
    api: apiRateLimiter,
    auth: authRateLimiter,
    register: registerRateLimiter,
    passwordReset: passwordResetRateLimiter,
    admin: adminRateLimiter,
    export: exportRateLimiter,
    create: createRateLimiter
  },
  
  // Helpers
  sendCSRFToken,
  requestIdMiddleware,
  cspNonceMiddleware,
  additionalSecurityHeaders,
  securityAuditMiddleware,
  
  // Configuration
  ALLOWED_ORIGINS,
  isProduction,
  isDevelopment
};
