/**
 * Report Generator Service
 * PDF and CSV report generation for mileage data
 */

const PDFDocument = require('pdfkit');
const { format } = require('@fast-csv/format');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/database');
const { formatCurrency, formatMiles } = require('../utils/hmrcRates');

// Report storage directory
const REPORTS_DIR = process.env.REPORTS_DIR || path.join(__dirname, '../../reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Generate PDF report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Generated report info
 */
const generatePDF = async (options) => {
  const {
    userId,
    userName,
    trips,
    dateFrom,
    dateTo,
    taxYear,
    totalMiles,
    totalAmount,
    tripCount,
    reportName,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const filename = `report_${Date.now()}_${userId.slice(0, 8)}.pdf`;
      const filepath = path.join(REPORTS_DIR, filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('Mileage Report', 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 50, 80);
      
      // Report info
      doc.moveDown();
      doc.fontSize(14).text(reportName || 'Business Mileage Report', 50, 110);
      doc.fontSize(10);
      doc.text(`User: ${userName}`, 50, 130);
      doc.text(`Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}`, 50, 145);
      if (taxYear) {
        doc.text(`Tax Year: ${taxYear}`, 50, 160);
      }

      // Summary box
      doc.moveDown(2);
      doc.rect(50, 180, 500, 60).stroke();
      doc.fontSize(11).text('Summary', 60, 190);
      doc.fontSize(10);
      doc.text(`Total Trips: ${tripCount}`, 60, 210);
      doc.text(`Total Miles: ${formatMiles(totalMiles)}`, 200, 210);
      doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 350, 210);

      // Trips table header
      let y = 260;
      doc.moveDown(2);
      doc.fontSize(10).fillColor('#333');
      
      // Table headers
      doc.rect(50, y, 500, 20).fill('#f0f0f0');
      doc.fillColor('#000');
      doc.text('Date', 55, y + 5);
      doc.text('From', 110, y + 5);
      doc.text('To', 220, y + 5);
      doc.text('Purpose', 330, y + 5);
      doc.text('Miles', 430, y + 5);
      doc.text('Rate', 470, y + 5);
      doc.text('Amount', 510, y + 5);

      y += 25;

      // Table rows
      trips.forEach((trip, index) => {
        // Add new page if needed
        if (y > 700) {
          doc.addPage();
          y = 50;
          
          // Repeat headers
          doc.rect(50, y, 500, 20).fill('#f0f0f0');
          doc.fillColor('#000');
          doc.text('Date', 55, y + 5);
          doc.text('From', 110, y + 5);
          doc.text('To', 220, y + 5);
          doc.text('Purpose', 330, y + 5);
          doc.text('Miles', 430, y + 5);
          doc.text('Rate', 470, y + 5);
          doc.text('Amount', 510, y + 5);
          y += 25;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, y - 2, 500, 18).fill('#fafafa');
        }

        doc.fillColor('#000');
        doc.fontSize(8);
        
        const tripDate = new Date(trip.tripDate).toLocaleDateString('en-GB');
        const rate = parseFloat(trip.rateApplied);
        const amount = parseFloat(trip.amountGbp);
        const miles = parseFloat(trip.distanceMiles);

        doc.text(tripDate, 55, y);
        doc.text(truncate(trip.startLocation, 15), 110, y);
        doc.text(truncate(trip.endLocation, 15), 220, y);
        doc.text(truncate(trip.purpose, 18), 330, y);
        doc.text(miles.toFixed(2), 430, y);
        doc.text(`${(rate * 100).toFixed(0)}p`, 470, y);
        doc.text(formatCurrency(amount).replace('£', ''), 510, y);

        y += 18;
      });

      // Footer
      doc.fontSize(8).fillColor('#666');
      doc.text('This report is generated for HMRC mileage claim purposes.', 50, 750);
      doc.text('UK Business Mileage Tracker', 50, 765);

      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(filepath);
        resolve({
          filename,
          filepath,
          size: stats.size,
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate CSV report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Generated report info
 */
const generateCSV = async (options) => {
  const {
    userId,
    trips,
    dateFrom,
    dateTo,
    taxYear,
    totalMiles,
    totalAmount,
    tripCount,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const filename = `report_${Date.now()}_${userId.slice(0, 8)}.csv`;
      const filepath = path.join(REPORTS_DIR, filename);
      const stream = fs.createWriteStream(filepath);
      const csvStream = format({ headers: true });

      csvStream.pipe(stream);

      // Write header info as comments
      csvStream.write({
        'Date': '# UK Business Mileage Report',
        'From': '',
        'To': '',
        'Start Postcode': '',
        'End Postcode': '',
        'Purpose': '',
        'Purpose Category': '',
        'Miles': '',
        'Rate': '',
        'Amount': '',
        'Notes': '',
      });

      csvStream.write({
        'Date': `# Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}`,
        'From': '',
        'To': '',
        'Start Postcode': '',
        'End Postcode': '',
        'Purpose': '',
        'Purpose Category': '',
        'Miles': '',
        'Rate': '',
        'Amount': '',
        'Notes': '',
      });

      if (taxYear) {
        csvStream.write({
          'Date': `# Tax Year: ${taxYear}`,
          'From': '',
          'To': '',
          'Start Postcode': '',
          'End Postcode': '',
          'Purpose': '',
          'Purpose Category': '',
          'Miles': '',
          'Rate': '',
          'Amount': '',
          'Notes': '',
        });
      }

      csvStream.write({
        'Date': `# Total Trips: ${tripCount}, Total Miles: ${totalMiles}, Total Amount: ${formatCurrency(totalAmount)}`,
        'From': '',
        'To': '',
        'Start Postcode': '',
        'End Postcode': '',
        'Purpose': '',
        'Purpose Category': '',
        'Miles': '',
        'Rate': '',
        'Amount': '',
        'Notes': '',
      });

      // Empty row
      csvStream.write({
        'Date': '',
        'From': '',
        'To': '',
        'Start Postcode': '',
        'End Postcode': '',
        'Purpose': '',
        'Purpose Category': '',
        'Miles': '',
        'Rate': '',
        'Amount': '',
        'Notes': '',
      });

      // Column headers
      csvStream.write({
        'Date': 'Date',
        'From': 'From',
        'To': 'To',
        'Start Postcode': 'Start Postcode',
        'End Postcode': 'End Postcode',
        'Purpose': 'Purpose',
        'Purpose Category': 'Purpose Category',
        'Miles': 'Miles',
        'Rate': 'Rate (pence)',
        'Amount': 'Amount (GBP)',
        'Notes': 'Notes',
      });

      // Data rows
      trips.forEach((trip) => {
        csvStream.write({
          'Date': new Date(trip.tripDate).toLocaleDateString('en-GB'),
          'From': trip.startLocation,
          'To': trip.endLocation,
          'Start Postcode': trip.startPostcode || '',
          'End Postcode': trip.endPostcode || '',
          'Purpose': trip.purpose,
          'Purpose Category': trip.purposeCategory || '',
          'Miles': parseFloat(trip.distanceMiles).toFixed(2),
          'Rate': (parseFloat(trip.rateApplied) * 100).toFixed(0),
          'Amount': parseFloat(trip.amountGbp).toFixed(2),
          'Notes': trip.notes || '',
        });
      });

      // Summary row
      csvStream.write({
        'Date': '',
        'From': '',
        'To': '',
        'Start Postcode': '',
        'End Postcode': '',
        'Purpose': 'TOTAL',
        'Purpose Category': '',
        'Miles': totalMiles.toFixed(2),
        'Rate': '',
        'Amount': totalAmount.toFixed(2),
        'Notes': '',
      });

      csvStream.end();

      stream.on('finish', () => {
        const stats = fs.statSync(filepath);
        resolve({
          filename,
          filepath,
          size: stats.size,
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate report based on format
 * @param {string} format - Report format (pdf, csv)
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Generated report info
 */
const generateReport = async (format, options) => {
  switch (format.toLowerCase()) {
    case 'pdf':
      return generatePDF(options);
    case 'csv':
      return generateCSV(options);
    default:
      throw new Error(`Unsupported report format: ${format}`);
  }
};

/**
 * Get trips for report
 * @param {string} userId - User ID
 * @param {Object} filters - Report filters
 * @returns {Promise<Array>} Trips
 */
const getTripsForReport = async (userId, filters) => {
  const { dateFrom, dateTo, vehicleId, purposeCategory } = filters;

  const where = {
    userId,
    tripDate: {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    },
  };

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (purposeCategory) {
    where.purposeCategory = purposeCategory;
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      vehicle: {
        select: {
          name: true,
          registration: true,
        },
      },
    },
    orderBy: {
      tripDate: 'asc',
    },
  });

  return trips;
};

/**
 * Calculate report totals
 * @param {Array} trips - Trips array
 * @returns {Object} Totals
 */
const calculateTotals = (trips) => {
  let totalMiles = 0;
  let totalAmount = 0;

  trips.forEach((trip) => {
    totalMiles += parseFloat(trip.distanceMiles);
    totalAmount += parseFloat(trip.amountGbp);
  });

  return {
    totalMiles: Math.round(totalMiles * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    tripCount: trips.length,
  };
};

/**
 * Delete report file
 * @param {string} filename - Filename to delete
 */
const deleteReportFile = (filename) => {
  const filepath = path.join(REPORTS_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};

/**
 * Get report file path
 * @param {string} filename - Filename
 * @returns {string} File path
 */
const getReportFilePath = (filename) => {
  return path.join(REPORTS_DIR, filename);
};

/**
 * Check if report file exists
 * @param {string} filename - Filename
 * @returns {boolean} Exists
 */
const reportFileExists = (filename) => {
  const filepath = path.join(REPORTS_DIR, filename);
  return fs.existsSync(filepath);
};

// Helper function to truncate text
const truncate = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

module.exports = {
  generatePDF,
  generateCSV,
  generateReport,
  getTripsForReport,
  calculateTotals,
  deleteReportFile,
  getReportFilePath,
  reportFileExists,
  REPORTS_DIR,
};
