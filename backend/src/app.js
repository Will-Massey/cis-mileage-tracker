/**
 * Express Application Setup
 * Main application configuration and middleware
 */

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { cors, helmet, rateLimiters } = require('./config/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitize } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// Import mobile routes
const tripsMobileRoutes = require('./routes/trips-mobile');
const sitesMobileRoutes = require('./routes/sites-mobile');
const usersMobileRoutes = require('./routes/users-mobile');

// Create Express app
const app = express();

// Trust proxy (for production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet);
app.use(cors);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Sanitization middleware
app.use(sanitize);

// General rate limiting
app.use(rateLimiters.api);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version prefix
const API_PREFIX = '/api';

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/trips`, tripRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// Mount mobile routes
app.use(`${API_PREFIX}/mobile/trips`, tripsMobileRoutes);
app.use(`${API_PREFIX}/mobile/sites`, sitesMobileRoutes);
app.use(`${API_PREFIX}/mobile/users`, usersMobileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UK Business Mileage Tracker API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
