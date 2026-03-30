/**
 * Report Routes
 * Routes for report generation and management
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { validators } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// List reports
router.get(
  '/',
  validators.pagination,
  reportController.listReports
);

// Generate new report
router.post(
  '/',
  validators.report,
  reportController.generate
);

// Get report details
router.get(
  '/:id',
  validators.uuidParam,
  reportController.getReport
);

// Download report
router.get(
  '/:id/download',
  validators.uuidParam,
  reportController.downloadReport
);

// Delete report
router.delete(
  '/:id',
  validators.uuidParam,
  reportController.deleteReport
);

module.exports = router;
