/**
 * Input Validation Schemas
 * UK Business Mileage Tracking Web App
 * 
 * This module provides comprehensive input validation using Joi and express-validator.
 * All user inputs are validated to prevent injection attacks, XSS, and ensure data integrity.
 * 
 * Security Features:
 * - Strict type validation
 * - Length limits (DoS prevention)
 * - Pattern matching for special characters
 * - XSS prevention through sanitization
 * - SQL injection prevention through type enforcement
 * - Custom validators for business logic
 */

const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');

// ============================================================================
// Common Validation Patterns
// ============================================================================

const PATTERNS = {
  // UUID v4 pattern
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Safe string (alphanumeric, spaces, common punctuation)
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.',&()]+$/,
  
  // Name pattern (letters, spaces, hyphens, apostrophes)
  NAME: /^[a-zA-Z\s\-'']+$/,
  
  // UK postcode pattern
  UK_POSTCODE: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
  
  // UK vehicle registration pattern
  UK_VEHICLE_REG: /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/i,
  
  // Mileage pattern (positive number)
  MILEAGE: /^[0-9]+$/,
  
  // Currency amount pattern
  CURRENCY: /^[0-9]+(\.[0-9]{1,2})?$/,
  
  // Hex color pattern
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  
  // Token pattern (hex string)
  TOKEN: /^[a-f0-9]{64}$/i,
};

// ============================================================================
// Length Limits (DoS Prevention)
// ============================================================================

const LIMITS = {
  // String lengths
  EMAIL_MAX: 254,           // RFC 5321
  NAME_MIN: 1,
  NAME_MAX: 100,
  COMPANY_MAX: 200,
  DESCRIPTION_MAX: 1000,
  ADDRESS_MAX: 500,
  PASSWORD_MIN: 12,
  PASSWORD_MAX: 128,
  
  // Numeric limits
  MILEAGE_MAX: 999999,      // Max reasonable mileage
  AMOUNT_MAX: 999999.99,    // Max reasonable amount
  RATE_MAX: 10.00,          // Max HMRC rate per mile
  
  // Array limits
  TAGS_MAX: 10,
  TAG_LENGTH_MAX: 50,
  
  // Pagination
  PAGE_MAX: 10000,
  PER_PAGE_MAX: 100,
  PER_PAGE_DEFAULT: 20,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  return validator.escape(
    validator.trim(value)
  );
}

/**
 * Sanitize HTML content (allows safe HTML)
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
function sanitizeHtml(value) {
  if (typeof value !== 'string') return value;
  
  return validator.stripLow(
    validator.trim(value),
    true
  );
}

/**
 * Custom Joi extension for sanitization
 */
const sanitizedString = Joi.extend((joi) => ({
  type: 'sanitizedString',
  base: joi.string(),
  messages: {
    'sanitizedString.unsafe': 'Input contains unsafe characters',
  },
  validate(value, helpers) {
    const sanitized = sanitizeString(value);
    if (sanitized !== value) {
      // Log potential XSS attempt
      console.warn('[SECURITY] Potential XSS attempt detected:', {
        original: value.substring(0, 100),
        sanitized: sanitized.substring(0, 100)
      });
    }
    return { value: sanitized };
  },
}));

// ============================================================================
// Joi Schemas
// ============================================================================

/**
 * User Registration Schema
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ 
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net', 'org', 'co.uk', 'gov.uk', 'ac.uk', 'io', 'dev'] }
    })
    .max(LIMITS.EMAIL_MAX)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 254 characters',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(LIMITS.PASSWORD_MIN)
    .max(LIMITS.PASSWORD_MAX)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),

  firstName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'string.pattern.base': 'First name contains invalid characters',
      'any.required': 'First name is required'
    }),

  lastName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'string.pattern.base': 'Last name contains invalid characters',
      'any.required': 'Last name is required'
    }),

  companyName: Joi.string()
    .max(LIMITS.COMPANY_MAX)
    .pattern(PATTERNS.SAFE_STRING)
    .trim()
    .allow('', null)
    .custom((value) => value ? sanitizeString(value) : value)
    .messages({
      'string.max': 'Company name must not exceed 200 characters',
      'string.pattern.base': 'Company name contains invalid characters'
    }),

  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the Terms of Service',
      'any.required': 'Terms acceptance is required'
    }),

  acceptPrivacy: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the Privacy Policy',
      'any.required': 'Privacy policy acceptance is required'
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Login Schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(LIMITS.EMAIL_MAX)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(1)
    .max(LIMITS.PASSWORD_MAX)
    .required()
    .messages({
      'any.required': 'Password is required'
    }),

  rememberMe: Joi.boolean()
    .default(false)
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Password Reset Request Schema
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(LIMITS.EMAIL_MAX)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
}).options({ stripUnknown: true });

/**
 * Password Reset Schema
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .hex()
    .length(64)
    .required()
    .messages({
      'string.hex': 'Invalid reset token format',
      'string.length': 'Invalid reset token',
      'any.required': 'Reset token is required'
    }),

  newPassword: Joi.string()
    .min(LIMITS.PASSWORD_MIN)
    .max(LIMITS.PASSWORD_MAX)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Change Password Schema (authenticated)
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .max(LIMITS.PASSWORD_MAX)
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(LIMITS.PASSWORD_MIN)
    .max(LIMITS.PASSWORD_MAX)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'Password must be at least 12 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.invalid': 'New password must be different from current password',
      'any.required': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Trip Creation Schema
 */
const createTripSchema = Joi.object({
  tripDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base': 'Trip date must be a valid date',
      'date.format': 'Trip date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Trip date cannot be in the future',
      'any.required': 'Trip date is required'
    }),

  startLocation: Joi.string()
    .min(1)
    .max(LIMITS.ADDRESS_MAX)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'Start location must not exceed 500 characters',
      'any.required': 'Start location is required'
    }),

  endLocation: Joi.string()
    .min(1)
    .max(LIMITS.ADDRESS_MAX)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'End location must not exceed 500 characters',
      'any.required': 'End location is required'
    }),

  startPostcode: Joi.string()
    .pattern(PATTERNS.UK_POSTCODE)
    .uppercase()
    .trim()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid UK postcode'
    }),

  endPostcode: Joi.string()
    .pattern(PATTERNS.UK_POSTCODE)
    .uppercase()
    .trim()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid UK postcode'
    }),

  distance: Joi.number()
    .positive()
    .max(LIMITS.MILEAGE_MAX)
    .precision(1)
    .required()
    .messages({
      'number.base': 'Distance must be a number',
      'number.positive': 'Distance must be positive',
      'number.max': 'Distance exceeds maximum allowed value',
      'any.required': 'Distance is required'
    }),

  purpose: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'Purpose must not exceed 200 characters',
      'any.required': 'Purpose is required'
    }),

  vehicleId: Joi.string()
    .uuid()
    .allow('', null)
    .messages({
      'string.guid': 'Invalid vehicle ID format'
    }),

  isReturnJourney: Joi.boolean()
    .default(false),

  passengers: Joi.number()
    .integer()
    .min(0)
    .max(5)
    .default(0)
    .messages({
      'number.max': 'Maximum 5 passengers allowed'
    }),

  tags: Joi.array()
    .items(
      Joi.string()
        .max(LIMITS.TAG_LENGTH_MAX)
        .pattern(PATTERNS.SAFE_STRING)
        .custom((value) => sanitizeString(value))
    )
    .max(LIMITS.TAGS_MAX)
    .default([]),

  notes: Joi.string()
    .max(LIMITS.DESCRIPTION_MAX)
    .trim()
    .allow('', null)
    .custom((value) => sanitizeHtml(value))
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    }),

  receiptUrl: Joi.string()
    .uri({ scheme: ['https'] })
    .max(500)
    .allow('', null)
    .messages({
      'string.uri': 'Receipt URL must be a valid HTTPS URL'
    })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Trip Update Schema
 */
const updateTripSchema = createTripSchema.fork(
  ['tripDate', 'startLocation', 'endLocation', 'distance', 'purpose'],
  (schema) => schema.optional()
);

/**
 * Vehicle Schema
 */
const vehicleSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'Vehicle name must not exceed 100 characters',
      'any.required': 'Vehicle name is required'
    }),

  registration: Joi.string()
    .pattern(PATTERNS.UK_VEHICLE_REG)
    .uppercase()
    .trim()
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid UK vehicle registration',
      'any.required': 'Vehicle registration is required'
    }),

  vehicleType: Joi.string()
    .valid('car', 'van', 'motorcycle', 'bicycle')
    .default('car'),

  fuelType: Joi.string()
    .valid('petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid')
    .default('petrol'),

  engineSize: Joi.number()
    .positive()
    .max(10000)
    .allow(null)
    .messages({
      'number.max': 'Engine size must not exceed 10000cc'
    }),

  isDefault: Joi.boolean()
    .default(false),

  color: Joi.string()
    .pattern(PATTERNS.HEX_COLOR)
    .default('#3B82F6')
    .messages({
      'string.pattern.base': 'Color must be a valid hex color (e.g., #3B82F6)'
    })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * User Profile Update Schema
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'First name must not exceed 100 characters',
      'string.pattern.base': 'First name contains invalid characters'
    }),

  lastName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .custom((value) => sanitizeString(value))
    .messages({
      'string.max': 'Last name must not exceed 100 characters',
      'string.pattern.base': 'Last name contains invalid characters'
    }),

  companyName: Joi.string()
    .max(LIMITS.COMPANY_MAX)
    .pattern(PATTERNS.SAFE_STRING)
    .trim()
    .allow('', null)
    .custom((value) => value ? sanitizeString(value) : value)
    .messages({
      'string.max': 'Company name must not exceed 200 characters'
    }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9\s\-\(\)]{10,20}$/)
    .trim()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  timezone: Joi.string()
    .valid('Europe/London', 'Europe/Edinburgh', 'Europe/Belfast', 'Europe/Cardiff')
    .default('Europe/London')
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Pagination Schema
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .positive()
    .max(LIMITS.PAGE_MAX)
    .default(1),

  perPage: Joi.number()
    .integer()
    .positive()
    .max(LIMITS.PER_PAGE_MAX)
    .default(LIMITS.PER_PAGE_DEFAULT),

  sortBy: Joi.string()
    .pattern(/^[a-zA-Z_]+$/)
    .default('created_at'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),

  search: Joi.string()
    .max(200)
    .trim()
    .allow('', null)
    .custom((value) => sanitizeString(value)),

  startDate: Joi.date()
    .iso()
    .allow(null),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .allow(null)
    .messages({
      'date.min': 'End date must be after start date'
    })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Export Data Request Schema (GDPR)
 */
const exportDataSchema = Joi.object({
  format: Joi.string()
    .valid('json', 'csv', 'pdf')
    .default('json'),

  dataTypes: Joi.array()
    .items(Joi.string().valid('profile', 'trips', 'vehicles', 'settings', 'consents'))
    .min(1)
    .default(['profile', 'trips', 'vehicles', 'settings', 'consents']),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Admin User Creation Schema
 */
const adminCreateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(LIMITS.EMAIL_MAX)
    .lowercase()
    .trim()
    .required(),

  firstName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .required()
    .custom((value) => sanitizeString(value)),

  lastName: Joi.string()
    .min(LIMITS.NAME_MIN)
    .max(LIMITS.NAME_MAX)
    .pattern(PATTERNS.NAME)
    .trim()
    .required()
    .custom((value) => sanitizeString(value)),

  roles: Joi.array()
    .items(Joi.string().valid('user', 'accountant', 'admin'))
    .min(1)
    .default(['user']),

  assignedAccountantId: Joi.string()
    .uuid()
    .allow(null)
}).options({ abortEarly: false, stripUnknown: true });

// ============================================================================
// Express-Validator Middleware
// ============================================================================

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

/**
 * Validate UUID parameter
 */
const validateUUID = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

/**
 * Validate email parameter
 */
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: LIMITS.EMAIL_MAX })
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

/**
 * Validate pagination query
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: LIMITS.PAGE_MAX })
    .toInt(),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: LIMITS.PER_PAGE_MAX })
    .toInt(),
  query('sortBy')
    .optional()
    .matches(/^[a-zA-Z_]+$/)
    .trim(),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']),
  query('search')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 200 }),
  handleValidationErrors
];

/**
 * Joi validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - Request property to validate (body, query, params)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      // Log validation failures for security monitoring
      console.warn('[VALIDATION] Validation failed:', {
        path: req.path,
        ip: req.ip,
        details: details.map(d => d.field)
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    // Replace request data with validated/sanitized values
    req[source] = value;
    next();
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Joi schemas
  schemas: {
    register: registerSchema,
    login: loginSchema,
    forgotPassword: forgotPasswordSchema,
    resetPassword: resetPasswordSchema,
    changePassword: changePasswordSchema,
    createTrip: createTripSchema,
    updateTrip: updateTripSchema,
    vehicle: vehicleSchema,
    updateProfile: updateProfileSchema,
    pagination: paginationSchema,
    exportData: exportDataSchema,
    adminCreateUser: adminCreateUserSchema
  },

  // Express-validator middleware
  validators: {
    validateUUID,
    validateEmail,
    validatePagination,
    handleValidationErrors
  },

  // Joi validation middleware
  validate,

  // Constants
  PATTERNS,
  LIMITS,

  // Helpers
  sanitizeString,
  sanitizeHtml
};
