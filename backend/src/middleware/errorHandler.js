/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */

const { Prisma } = require('@prisma/client');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error response formatter
const formatError = (error, isDevelopment) => {
  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.code) {
    response.code = error.code;
  }

  if (error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack.split('\n');
  }

  return response;
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let error = err;

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = err.meta?.target?.[0] || 'field';
        statusCode = 409;
        error = new ConflictError(`${field} already exists`);
        break;
        
      case 'P2025':
        // Record not found
        statusCode = 404;
        error = new NotFoundError('Record');
        break;
        
      case 'P2003':
        // Foreign key constraint violation
        statusCode = 400;
        error = new ValidationError('Invalid reference to related record');
        break;
        
      default:
        statusCode = 500;
        error = new AppError('Database error', 500, 'DATABASE_ERROR');
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    error = new ValidationError('Invalid data provided');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error = new AuthenticationError('Token expired');
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    error = new ValidationError('Invalid JSON in request body');
  }

  // Log error (but not in test environment)
  if (process.env.NODE_ENV !== 'test') {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode,
      message: error.message,
      code: error.code,
      userId: req.user?.id || null,
      ip: req.ip,
    };

    if (statusCode >= 500) {
      console.error('Server Error:', logData);
      if (isDevelopment) {
        console.error(err.stack);
      }
    } else {
      console.warn('Client Error:', logData);
    }
  }

  // Send response
  res.status(statusCode).json(formatError(error, isDevelopment));
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
