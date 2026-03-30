/**
 * Trip Routes
 * Routes for trip management and mileage tracking
 */

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticate } = require('../middleware/auth');
const { validators } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// List trips with pagination and filtering
router.get(
  '/',
  validators.pagination,
  tripController.listTrips
);

// Get trip statistics
router.get(
  '/stats',
  tripController.getStats
);

// Get trip summary (for dashboard)
router.get(
  '/summary',
  tripController.getSummary
);

// Create new trip
router.post(
  '/',
  validators.trip,
  tripController.createTrip
);

// Get single trip
router.get(
  '/:id',
  validators.uuidParam,
  tripController.getTrip
);

// Update trip
router.put(
  '/:id',
  validators.uuidParam,
  tripController.updateTrip
);

// Delete trip
router.delete(
  '/:id',
  validators.uuidParam,
  tripController.deleteTrip
);

module.exports = router;
