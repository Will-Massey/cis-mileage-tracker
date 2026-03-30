/**
 * Report Generator Service
 * PDF, CSV, and Excel report generation
 */

const PDFDocument = require('pdfkit');
const csv = require('fast-csv');
const { format } = require('date-fns');

/**
 * Generate PDF mileage report
 * @param {object} user - User data
 * @param {Array} trips - Array of trip objects
 * @param {object} summary - Summary statistics
 * @param {string} taxYear - Tax year
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDFReport(user, trips, summary, taxYear) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffer => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Mileage Report', 50, 50);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Tax Year: ${taxYear}`, 50, 80);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 50, 95);

    // User Information
    doc.fontSize(14).font('Helvetica-Bold').text('User Information', 50, 130);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Name: ${user.firstName} ${user.lastName}`, 50, 150);
    doc.text(`Email: ${user.email}`, 50, 165);
    if (user.phone) {
      doc.text(`Phone: ${user.phone}`, 50, 180);
    }

    // Summary Box
    const summaryY = 210;
    doc.rect(50, summaryY, 500, 100).stroke('#cccccc');
    doc.fontSize(14).font('Helvetica-Bold').text('Summary', 60, summaryY + 10);
    doc.fontSize(11).font('Helvetica');
    
    // Summary columns
    doc.text(`Total Miles: ${summary.totalMiles.toFixed(2)}`, 60, summaryY + 35);
    doc.text(`Total Claim: £${summary.totalAmount.toFixed(2)}`, 250, summaryY + 35);
    doc.text(`Number of Trips: ${summary.tripCount}`, 400, summaryY + 35);
    
    const at45p = summary.breakdown?.at45p || summary.at45p || { miles: 0, amount: 0 };
    const at25p = summary.breakdown?.at25p || summary.at25p || { miles: 0, amount: 0 };
    
    doc.text(`Miles at 45p: ${at45p.miles.toFixed(2)}`, 60, summaryY + 55);
    doc.text(`Amount at 45p: £${at45p.amount.toFixed(2)}`, 250, summaryY + 55);
    
    doc.text(`Miles at 25p: ${at25p.miles.toFixed(2)}`, 60, summaryY + 75);
    doc.text(`Amount at 25p: £${at25p.amount.toFixed(2)}`, 250, summaryY + 75);

    // Trips Table
    let y = summaryY + 120;
    doc.fontSize(14).font('Helvetica-Bold').text('Trip Details', 50, y);
    y += 25;

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    const colX = {
      date: 50,
      from: 110,
      to: 220,
      purpose: 330,
      miles: 430,
      rate: 470,
      amount: 510
    };

    doc.text('Date', colX.date, y);
    doc.text('From', colX.from, y);
    doc.text('To', colX.to, y);
    doc.text('Purpose', colX.purpose, y);
    doc.text('Miles', colX.miles, y);
    doc.text('Rate', colX.rate, y);
    doc.text('Amount', colX.amount, y);

    y += 15;
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke('#999999');

    // Table rows
    doc.fontSize(8).font('Helvetica');
    
    trips.forEach((trip, index) => {
      // Add new page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Repeat header on new page
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Date', colX.date, y);
        doc.text('From', colX.from, y);
        doc.text('To', colX.to, y);
        doc.text('Purpose', colX.purpose, y);
        doc.text('Miles', colX.miles, y);
        doc.text('Rate', colX.rate, y);
        doc.text('Amount', colX.amount, y);
        y += 15;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke('#999999');
        doc.fontSize(8).font('Helvetica');
      }

      const tripDate = trip.tripDate ? format(new Date(trip.tripDate), 'dd/MM/yyyy') : '-';
      const from = trip.startLocation ? trip.startLocation.substring(0, 15) : '-';
      const to = trip.endLocation ? trip.endLocation.substring(0, 15) : '-';
      const purpose = trip.purpose ? trip.purpose.substring(0, 12) : '-';
      const miles = parseFloat(trip.distanceMiles).toFixed(2);
      const rate = `${Math.round(parseFloat(trip.rateApplied) * 100)}p`;
      const amount = `£${parseFloat(trip.amountGbp).toFixed(2)}`;

      doc.text(tripDate, colX.date, y);
      doc.text(from, colX.from, y);
      doc.text(to, colX.to, y);
      doc.text(purpose, colX.purpose, y);
      doc.text(miles, colX.miles, y);
      doc.text(rate, colX.rate, y);
      doc.text(amount, colX.amount, y);

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, y - 2, 500, 12).fill('#f5f5f5');
        doc.fillColor('#000000');
        // Re-write text after fill
        doc.text(tripDate, colX.date, y);
        doc.text(from, colX.from, y);
        doc.text(to, colX.to, y);
        doc.text(purpose, colX.purpose, y);
        doc.text(miles, colX.miles, y);
        doc.text(rate, colX.rate, y);
        doc.text(amount, colX.amount, y);
      }

      y += 15;
    });

    // Footer
    const footerY = doc.page.height - 50;
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text(
      'This report is generated for HMRC self-assessment purposes. Please retain this report for 5 years.',
      50,
      footerY,
      { align: 'center', width: 500 }
    );

    doc.end();
  });
}

/**
 * Generate CSV mileage report
 * @param {Array} trips - Array of trip objects
 * @returns {Promise<string>} CSV string
 */
async function generateCSVReport(trips) {
  return new Promise((resolve, reject) => {
    const rows = trips.map(trip => ({
      Date: trip.tripDate ? format(new Date(trip.tripDate), 'dd/MM/yyyy') : '',
      'From Location': trip.startLocation || '',
      'To Location': trip.endLocation || '',
      'Start Postcode': trip.startPostcode || '',
      'End Postcode': trip.endPostcode || '',
      'Round Trip': trip.isRoundTrip ? 'Yes' : 'No',
      'Purpose Category': trip.purposeCategory || '',
      'Purpose': trip.purpose || '',
      'Miles': parseFloat(trip.distanceMiles).toFixed(2),
      'Rate Applied': `${parseFloat(trip.rateApplied).toFixed(2)}p`,
      'Amount': parseFloat(trip.amountGbp).toFixed(2),
      'Vehicle': trip.vehicle?.name || 'Personal Vehicle',
      'Notes': trip.notes || ''
    }));

    const chunks = [];
    const stream = csv.format({ headers: true });

    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);

    rows.forEach(row => stream.write(row));
    stream.end();
  });
}

/**
 * Generate summary text for emails
 * @param {object} summary - Summary statistics
 * @param {string} taxYear - Tax year
 * @returns {string} Formatted summary
 */
function generateSummaryText(summary, taxYear) {
  return `
Mileage Summary for Tax Year ${taxYear}
================================

Total Miles: ${summary.totalMiles.toFixed(2)}
Total Claim Amount: £${summary.totalAmount.toFixed(2)}
Number of Trips: ${summary.tripCount}

Breakdown:
- Miles at 45p: ${(summary.breakdown?.at45p || summary.at45p || { miles: 0 }).miles.toFixed(2)} (£${(summary.breakdown?.at45p || summary.at45p || { amount: 0 }).amount.toFixed(2)})
- Miles at 25p: ${(summary.breakdown?.at25p || summary.at25p || { miles: 0 }).miles.toFixed(2)} (£${(summary.breakdown?.at25p || summary.at25p || { amount: 0 }).amount.toFixed(2)})

Generated on ${format(new Date(), 'dd/MM/yyyy')}
  `.trim();
}

module.exports = {
  generatePDFReport,
  generateCSVReport,
  generateSummaryText,
};