/**
 * Authentication Routes
 * Routes for user authentication and management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validators } = require('../middleware/validation');
const { rateLimiters } = require('../config/security');

// Public routes

// Register new user
router.post(
  '/register',
  rateLimiters.register,
  validators.register,
  authController.register
);

// Login
router.post(
  '/login',
  rateLimiters.auth,
  validators.login,
  authController.login
);

// Refresh token
router.post(
  '/refresh',
  authController.refresh
);

// Forgot password
router.post(
  '/forgot-password',
  rateLimiters.passwordReset,
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  validators.passwordReset,
  authController.resetPassword
);

// Protected routes (require authentication)

// Logout
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Get current user
router.get(
  '/me',
  authenticate,
  authController.getMe
);

// Update profile
router.put(
  '/me',
  authenticate,
  validators.profileUpdate,
  authController.updateProfile
);

// Change password
router.put(
  '/change-password',
  authenticate,
  validators.passwordChange,
  authController.changePassword
);

module.exports = router;
