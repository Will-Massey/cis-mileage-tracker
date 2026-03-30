/**
 * Report Controller
 * Handles report generation and management
 */

const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const {
  generateReport,
  getTripsForReport,
  calculateTotals,
  deleteReportFile,
  getReportFilePath,
  reportFileExists,
} = require('../services/reportGenerator');
const { getTaxYearForDate } = require('../utils/hmrcRates');
const { sendReportReadyEmail } = require('../services/emailService');

/**
 * List user's reports
 * GET /api/reports
 */
const listReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }),
    prisma.report.count({
      where: {
        userId: req.user.id,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      reports: reports.map((report) => ({
        id: report.id,
        name: report.name,
        description: report.description,
        reportType: report.reportType,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        taxYear: report.taxYear,
        format: report.format,
        totalMiles: parseFloat(report.totalMiles),
        totalAmount: parseFloat(report.totalAmount),
        tripCount: report.tripCount,
        status: report.status,
        downloadUrl: report.status === 'completed' ? `/api/reports/${report.id}/download` : null,
        expiresAt: report.expiresAt,
        createdAt: report.createdAt,
        completedAt: report.completedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + reports.length < total,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Generate a new report
 * POST /api/reports
 */
const generate = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    reportType,
    dateFrom,
    dateTo,
    format,
    filters = {},
  } = req.body;

  // Determine tax year from date range
  const taxYear = getTaxYearForDate(new Date(dateFrom));

  // Create report record
  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      name,
      description: description || null,
      reportType,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      taxYear,
      format,
      filters: JSON.stringify(filters),
      status: 'pending',
      generatedBy: req.user.id,
    },
  });

  // Start report generation asynchronously
  generateReportAsync(report.id, req.user);

  res.status(202).json({
    success: true,
    message: 'Report generation started',
    data: {
      id: report.id,
      name: report.name,
      status: 'processing',
      createdAt: report.createdAt,
    },
  });
});

/**
 * Generate report asynchronously
 * @param {string} reportId - Report ID
 * @param {Object} user - User object
 */
const generateReportAsync = async (reportId, user) => {
  try {
    // Update status to processing
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'processing' },
    });

    // Get report details
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    // Get trips for the report
    const filters = JSON.parse(report.filters || '{}');
    const trips = await getTripsForReport(report.userId, {
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      vehicleId: filters.vehicleId,
      purposeCategory: filters.purposeCategory,
    });

    // Calculate totals
    const totals = calculateTotals(trips);

    // Generate report file
    const userData = await prisma.user.findUnique({
      where: { id: report.userId },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    const userName = `${userData.firstName} ${userData.lastName}`;

    const generatedReport = await generateReport(report.format, {
      userId: report.userId,
      userName,
      trips,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      taxYear: report.taxYear,
      totalMiles: totals.totalMiles,
      totalAmount: totals.totalAmount,
      tripCount: totals.tripCount,
      reportName: report.name,
    });

    // Update report record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        totalMiles: totals.totalMiles,
        totalAmount: totals.totalAmount,
        tripCount: totals.tripCount,
        fileUrl: generatedReport.filename,
        fileSize: generatedReport.size,
        expiresAt,
        completedAt: new Date(),
      },
    });

    // Send notification email
    sendReportReadyEmail(user, updatedReport).catch(console.error);
  } catch (error) {
    console.error('Report generation error:', error);

    // Update report with error
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });
  }
};

/**
 * Get report details
 * GET /api/reports/:id
 */
const getReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!report) {
    throw new NotFoundError('Report');
  }

  res.json({
    success: true,
    data: {
      id: report.id,
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      taxYear: report.taxYear,
      format: report.format,
      totalMiles: parseFloat(report.totalMiles),
      totalAmount: parseFloat(report.totalAmount),
      tripCount: report.tripCount,
      filters: JSON.parse(report.filters || '{}'),
      status: report.status,
      fileUrl: report.fileUrl,
      fileSize: report.fileSize,
      downloadUrl: report.status === 'completed' ? `/api/reports/${report.id}/download` : null,
      expiresAt: report.expiresAt,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      errorMessage: report.errorMessage,
    },
  });
});

/**
 * Download report
 * GET /api/reports/:id/download
 */
const downloadReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!report) {
    throw new NotFoundError('Report');
  }

  if (report.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Report is not ready for download',
    });
  }

  if (report.expiresAt && new Date(report.expiresAt) < new Date()) {
    return res.status(410).json({
      success: false,
      message: 'Report download link has expired',
    });
  }

  if (!report.fileUrl || !reportFileExists(report.fileUrl)) {
    return res.status(404).json({
      success: false,
      message: 'Report file not found',
    });
  }

  const filepath = getReportFilePath(report.fileUrl);
  const filename = `${report.name}.${report.format}`;

  // Set content type based on format
  const contentType = report.format === 'pdf' 
    ? 'application/pdf' 
    : 'text/csv';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Stream file
  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);
});

/**
 * Delete a report
 * DELETE /api/reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.report.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!report) {
    throw new NotFoundError('Report');
  }

  // Delete file if exists
  if (report.fileUrl) {
    deleteReportFile(report.fileUrl);
  }

  // Delete report record
  await prisma.report.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Report deleted successfully',
  });
});

module.exports = {
  listReports,
  generate,
  getReport,
  downloadReport,
  deleteReport,
};
