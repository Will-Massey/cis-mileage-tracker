/**
 * User Management Routes
 * Routes for admin user management
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validators } = require('../middleware/validation');
const { rateLimiters } = require('../config/security');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Apply admin rate limiting
router.use(rateLimiters.admin);

// List all users
router.get(
  '/',
  validators.pagination,
  userController.listUsers
);

// Create new user
router.post(
  '/',
  validators.register,
  userController.createUser
);

// Get system statistics
router.get(
  '/stats',
  userController.getSystemStats
);

// Get single user
router.get(
  '/:id',
  validators.uuidParam,
  userController.getUser
);

// Update user
router.put(
  '/:id',
  validators.uuidParam,
  userController.updateUser
);

// Delete user
router.delete(
  '/:id',
  validators.uuidParam,
  userController.deleteUser
);

// Reset user password
router.post(
  '/:id/reset-password',
  validators.uuidParam,
  userController.resetUserPassword
);

module.exports = router;
