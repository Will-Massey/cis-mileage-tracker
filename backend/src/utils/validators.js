/**
 * Custom Validators Utility
 * Validation helpers for UK-specific data formats
 */

const Joi = require('joi');

// UK Postcode regex pattern (simplified but effective)
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;

// UK Phone number regex (mobile and landline)
const UK_PHONE_REGEX = /^(?:(?:\+44)|(?:0))(?:\s?\d){9,11}$/;

// Email regex (comprehensive)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Password strength regex
// At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/;

// UK Vehicle registration regex (simplified)
const UK_REGISTRATION_REGEX = /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/i;

// Tax year format regex (YYYY-YY)
const TAX_YEAR_REGEX = /^\d{4}-\d{2}$/;

/**
 * Validate UK postcode
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} Is valid
 */
const isValidPostcode = (postcode) => {
  if (!postcode) return true; // Optional field
  return UK_POSTCODE_REGEX.test(postcode.trim());
};

/**
 * Normalize UK postcode to standard format
 * @param {string} postcode - Postcode to normalize
 * @returns {string} Normalized postcode
 */
const normalizePostcode = (postcode) => {
  if (!postcode) return null;
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
};

/**
 * Validate UK phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid
 */
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  const cleaned = phone.replace(/\s/g, '');
  return UK_PHONE_REGEX.test(cleaned);
};

/**
 * Normalize UK phone number
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\s/g, '');
  
  // Convert +44 to 0 if it starts with +44
  if (cleaned.startsWith('+44')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  return cleaned;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
};

/**
 * Normalize email address
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email
 */
const normalizeEmail = (email) => {
  if (!email) return null;
  return email.trim().toLowerCase();
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords (basic list)
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate UK vehicle registration
 * @param {string} registration - Registration to validate
 * @returns {boolean} Is valid
 */
const isValidRegistration = (registration) => {
  if (!registration) return true; // Optional field
  return UK_REGISTRATION_REGEX.test(registration.trim());
};

/**
 * Normalize vehicle registration
 * @param {string} registration - Registration to normalize
 * @returns {string} Normalized registration
 */
const normalizeRegistration = (registration) => {
  if (!registration) return null;
  return registration.trim().toUpperCase().replace(/\s+/g, '');
};

/**
 * Validate tax year format
 * @param {string} taxYear - Tax year to validate
 * @returns {boolean} Is valid
 */
const isValidTaxYear = (taxYear) => {
  if (!taxYear) return false;
  if (!TAX_YEAR_REGEX.test(taxYear)) return false;
  
  const [startYear, endYearShort] = taxYear.split('-');
  const start = parseInt(startYear, 10);
  const end = parseInt('20' + endYearShort, 10);
  
  // Tax year should span one year
  return end === start + 1;
};

/**
 * Validate date is not in the future
 * @param {Date|string} date - Date to validate
 * @returns {boolean} Is valid
 */
const isNotFutureDate = (date) => {
  if (!date) return true;
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return checkDate <= today;
};

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} Is valid
 */
const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

/**
 * Validate distance is positive
 * @param {number} distance - Distance to validate
 * @returns {boolean} Is valid
 */
const isValidDistance = (distance) => {
  if (distance === null || distance === undefined) return false;
  const num = parseFloat(distance);
  return !isNaN(num) && num > 0 && num <= 999999.99;
};

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Sanitize HTML content (basic)
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Joi Custom Extensions
const customJoi = Joi.extend({
  type: 'postcode',
  base: Joi.string(),
  messages: {
    'postcode.invalid': 'Invalid UK postcode format',
  },
  validate(value, helpers) {
    if (!isValidPostcode(value)) {
      return { value, errors: helpers.error('postcode.invalid') };
    }
    return { value: normalizePostcode(value) };
  },
});

// Joi Validation Schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
      'string.pattern.base': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    }),
    firstName: Joi.string().min(2).max(100).required().trim(),
    lastName: Joi.string().min(2).max(100).required().trim(),
    phone: Joi.string().allow(null, '').custom((value, helpers) => {
      if (value && !isValidPhone(value)) {
        return helpers.error('phone.invalid');
      }
      return value;
    }),
    companyId: Joi.string().uuid().allow(null),
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required(),
  }),

  // Trip creation/update
  trip: Joi.object({
    tripDate: Joi.date().iso().max('now').required(),
    startLocation: Joi.string().min(2).max(255).required().trim(),
    endLocation: Joi.string().min(2).max(255).required().trim(),
    startPostcode: Joi.string().allow(null, '').custom((value, helpers) => {
      if (value && !isValidPostcode(value)) {
        return helpers.error('postcode.invalid');
      }
      return normalizePostcode(value);
    }),
    endPostcode: Joi.string().allow(null, '').custom((value, helpers) => {
      if (value && !isValidPostcode(value)) {
        return helpers.error('postcode.invalid');
      }
      return normalizePostcode(value);
    }),
    distanceMiles: Joi.number().positive().precision(2).max(999999.99).required(),
    isRoundTrip: Joi.boolean().default(false),
    purpose: Joi.string().min(2).max(255).required().trim(),
    purposeCategory: Joi.string().valid(
      'site_visit',
      'client_meeting',
      'supplier_visit',
      'training',
      'conference',
      'business_trip',
      'commute',
      'other'
    ).allow(null),
    vehicleId: Joi.string().uuid().allow(null),
    notes: Joi.string().max(1000).allow(null, '').trim(),
  }),

  // Vehicle creation/update
  vehicle: Joi.object({
    name: Joi.string().min(1).max(100).required().trim(),
    registration: Joi.string().allow(null, '').custom((value, helpers) => {
      if (value) {
        return normalizeRegistration(value);
      }
      return value;
    }),
    make: Joi.string().max(50).allow(null, '').trim(),
    model: Joi.string().max(50).allow(null, '').trim(),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid').allow(null),
    engineSize: Joi.string().max(10).allow(null, '').trim(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null),
    color: Joi.string().max(30).allow(null, '').trim(),
    isCompanyCar: Joi.boolean().default(false),
    notes: Joi.string().max(1000).allow(null, '').trim(),
  }),

  // Report generation
  report: Joi.object({
    name: Joi.string().min(1).max(255).required().trim(),
    description: Joi.string().max(1000).allow(null, '').trim(),
    reportType: Joi.string().valid('mileage', 'expense', 'summary', 'tax').default('mileage'),
    dateFrom: Joi.date().iso().required(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).required(),
    format: Joi.string().valid('pdf', 'csv', 'excel').required(),
    filters: Joi.object({
      vehicleId: Joi.string().uuid().allow(null),
      purposeCategory: Joi.string().allow(null),
      includeReceipts: Joi.boolean().default(false),
    }).default({}),
  }),

  // Password reset
  passwordReset: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
      'string.pattern.base': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    }),
  }),

  // Password change
  passwordChange: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().pattern(PASSWORD_REGEX).required().messages({
      'string.pattern.base': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    }),
  }),

  // User profile update
  profileUpdate: Joi.object({
    firstName: Joi.string().min(2).max(100).trim(),
    lastName: Joi.string().min(2).max(100).trim(),
    phone: Joi.string().allow(null, '').custom((value, helpers) => {
      if (value && !isValidPhone(value)) {
        return helpers.error('phone.invalid');
      }
      return value;
    }),
    preferences: Joi.object().default({}),
  }),

  // Query parameters for pagination and filtering
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    startDate: Joi.date().iso().allow(null),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
    sortBy: Joi.string().valid('tripDate', 'createdAt', 'distanceMiles', 'amountGbp').default('tripDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().max(255).allow(null, ''),
  }),
};

module.exports = {
  // Regex patterns
  UK_POSTCODE_REGEX,
  UK_PHONE_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  UK_REGISTRATION_REGEX,
  TAX_YEAR_REGEX,
  
  // Validation functions
  isValidPostcode,
  normalizePostcode,
  isValidPhone,
  normalizePhone,
  isValidEmail,
  normalizeEmail,
  validatePassword,
  isValidRegistration,
  normalizeRegistration,
  isValidTaxYear,
  isNotFutureDate,
  isValidDateRange,
  isValidDistance,
  
  // Sanitization functions
  sanitizeString,
  sanitizeHtml,
  
  // Joi schemas
  customJoi,
  schemas,
};
