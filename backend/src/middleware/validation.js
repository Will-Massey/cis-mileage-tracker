/**
 * Validation Middleware
 * Request body and query parameter validation using Joi
 */

const Joi = require('joi');
const { schemas } = require('../utils/validators');

/**
 * Factory function to create validation middleware
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - Request property to validate (body, query, params)
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = req[source];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      // Replace request data with validated/sanitized value
      req[source] = value;
      next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({
        success: false,
        message: 'Validation error',
      });
    }
  };
};

/**
 * Validate request body
 * @param {Joi.Schema} schema - Joi schema
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 * @param {Joi.Schema} schema - Joi schema
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 * @param {Joi.Schema} schema - Joi schema
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Predefined validation middlewares
 */
const validators = {
  // Auth validations
  register: validateBody(schemas.register),
  login: validateBody(schemas.login),
  passwordReset: validateBody(schemas.passwordReset),
  passwordChange: validateBody(schemas.passwordChange),
  profileUpdate: validateBody(schemas.profileUpdate),
  
  // Trip validations
  trip: validateBody(schemas.trip),
  tripUpdate: validateBody(schemas.trip.fork(['tripDate', 'startLocation', 'endLocation', 'distanceMiles', 'purpose'], (schema) => schema.optional())),
  
  // Vehicle validations
  vehicle: validateBody(schemas.vehicle),
  vehicleUpdate: validateBody(schemas.vehicle.fork(['name'], (schema) => schema.optional())),
  
  // Report validations
  report: validateBody(schemas.report),
  
  // Query validations
  pagination: validateQuery(schemas.queryParams),
  
  // UUID parameter validation
  uuidParam: validateParams(Joi.object({
    id: Joi.string().uuid().required(),
  })),
};

/**
 * Sanitize middleware - removes dangerous characters from strings
 */
const sanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/[<>]/g, '')
        .replace(/\s+/g, ' ');
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Check for required fields
 * @param {Array} fields - Array of required field names
 */
const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: missing.map(field => ({
          field,
          message: `${field} is required`,
        })),
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validators,
  sanitize,
  requireFields,
};
