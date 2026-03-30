/**
 * Report Routes
 * Export and download mileage reports
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { generatePDFReport, generateCSVReport } = require('../services/reportGenerator');
const { getUserStats } = require('../services/mileageCalculator');
const { prisma } = require('../config/database');
const { getCurrentTaxYear } = require('../utils/hmrcRates');

/**
 * Get all reports for user
 * GET /api/reports
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: reports.map(report => ({
        id: report.id,
        name: report.name,
        reportType: report.reportType,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        taxYear: report.taxYear,
        format: report.format,
        totalMiles: parseFloat(report.totalMiles),
        totalAmount: parseFloat(report.totalAmount),
        status: report.status,
        createdAt: report.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    });
  }
});

/**
 * Generate and download PDF report
 * GET /api/reports/pdf
 */
router.get('/pdf', authenticate, async (req, res) => {
  try {
    const { taxYear, startDate, endDate } = req.query;
    const targetTaxYear = taxYear || getCurrentTaxYear();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    // Build where clause
    const where = {
      userId: req.user.id,
      taxYear: targetTaxYear,
    };

    if (startDate || endDate) {
      where.tripDate = {};
      if (startDate) where.tripDate.gte = new Date(startDate);
      if (endDate) where.tripDate.lte = new Date(endDate);
    }

    // Get trips
    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: {
          select: { name: true, registration: true },
        },
      },
      orderBy: { tripDate: 'asc' },
    });

    // Get summary
    const summary = await getUserStats(req.user.id, targetTaxYear);

    // Generate PDF
    const pdfBuffer = await generatePDFReport(user, trips, summary, targetTaxYear);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="mileage-report-${targetTaxYear}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
    });
  }
});

/**
 * Generate and download CSV report
 * GET /api/reports/csv
 */
router.get('/csv', authenticate, async (req, res) => {
  try {
    const { taxYear, startDate, endDate } = req.query;
    const targetTaxYear = taxYear || getCurrentTaxYear();

    // Build where clause
    const where = {
      userId: req.user.id,
      taxYear: targetTaxYear,
    };

    if (startDate || endDate) {
      where.tripDate = {};
      if (startDate) where.tripDate.gte = new Date(startDate);
      if (endDate) where.tripDate.lte = new Date(endDate);
    }

    // Get trips
    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: {
          select: { name: true, registration: true },
        },
      },
      orderBy: { tripDate: 'asc' },
    });

    // Generate CSV
    const csvContent = await generateCSVReport(trips);

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mileage-report-${targetTaxYear}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV report',
    });
  }
});

/**
 * Create a report record
 * POST /api/reports
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, reportType, dateFrom, dateTo, format } = req.body;
    const taxYear = getCurrentTaxYear();

    // Get summary for report
    const stats = await getUserStats(req.user.id, taxYear);

    // Create report record
    const report = await prisma.report.create({
      data: {
        userId: req.user.id,
        name: name || `Mileage Report ${taxYear}`,
        reportType: reportType || 'mileage',
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        taxYear,
        format,
        totalMiles: stats.totalMiles,
        totalAmount: stats.totalAmount,
        status: 'generated',
        generatedBy: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        id: report.id,
        name: report.name,
        taxYear: report.taxYear,
        totalMiles: parseFloat(report.totalMiles),
        totalAmount: parseFloat(report.totalAmount),
        format: report.format,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
    });
  }
});

module.exports = router;