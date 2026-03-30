---
name: pdf-report-generator
description: Generate PDF and CSV reports for mileage tracking. Use when creating HMRC-compliant reports, exporting trip data, generating expense summaries, or creating accountant-friendly documents with PDFKit and fast-csv.
---

# PDF Report Generator

Generate HMRC-compliant mileage reports in PDF and CSV formats.

## PDF Generation with PDFKit

```bash
npm install pdfkit
```

```javascript
// services/pdfService.js
const PDFDocument = require('pdfkit')
const fs = require('fs')

function generateMileageReport(user, trips, summary, taxYear) {
  const doc = new PDFDocument()
  const buffers = []
  
  doc.on('data', buffer => buffers.push(buffer))
  
  // Header
  doc.fontSize(20).text('Mileage Report', 50, 50)
  doc.fontSize(12).text(`Tax Year: ${taxYear}`, 50, 80)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 50, 95)
  
  // User info
  doc.text(`Name: ${user.name}`, 50, 120)
  doc.text(`Email: ${user.email}`, 50, 135)
  
  // Summary box
  doc.rect(50, 160, 500, 80).stroke()
  doc.fontSize(14).text('Summary', 60, 170)
  doc.fontSize(12)
  doc.text(`Total Miles: ${summary.totalMiles.toFixed(2)}`, 60, 190)
  doc.text(`Total Claim: £${summary.totalClaim.toFixed(2)}`, 250, 190)
  doc.text(`Miles at 45p: ${summary.milesAt45p.toFixed(2)}`, 60, 210)
  doc.text(`Miles at 25p: ${summary.milesAt25p.toFixed(2)}`, 250, 210)
  
  // Trips table header
  doc.fontSize(10)
  let y = 270
  doc.text('Date', 50, y)
  doc.text('From', 120, y)
  doc.text('To', 250, y)
  doc.text('Miles', 380, y)
  doc.text('Rate', 430, y)
  doc.text('Amount', 480, y)
  
  y += 20
  doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke()
  
  // Trips rows
  trips.forEach(trip => {
    if (y > 700) {
      doc.addPage()
      y = 50
    }
    
    doc.text(trip.date.toLocaleDateString('en-GB'), 50, y)
    doc.text(trip.startLocation.substring(0, 20), 120, y)
    doc.text(trip.endLocation.substring(0, 20), 250, y)
    doc.text(trip.miles.toFixed(2), 380, y)
    doc.text(`${trip.rateApplied}p`, 430, y)
    doc.text(`£${trip.amount.toFixed(2)}`, 480, y)
    
    y += 20
  })
  
  // Footer
  doc.fontSize(8).text(
    'This report is for HMRC self-assessment purposes.',
    50, 750, { align: 'center' }
  )
  
  doc.end()
  
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })
}
```

## CSV Export with fast-csv

```bash
npm install fast-csv
```

```javascript
// services/csvService.js
const csv = require('fast-csv')

function generateCSV(trips) {
  const rows = trips.map(trip => ({
    Date: trip.date.toISOString().split('T')[0],
    'From Location': trip.startLocation,
    'To Location': trip.endLocation,
    'Start Postcode': trip.startPostcode || '',
    'End Postcode': trip.endPostcode || '',
    'Round Trip': trip.isRoundTrip ? 'Yes' : 'No',
    'Purpose Category': trip.purposeCategory,
    'Purpose': trip.purpose,
    'Miles': trip.miles.toFixed(2),
    'Rate Applied': `${trip.rateApplied}p`,
    'Amount (£)': trip.amount.toFixed(2),
    Notes: trip.notes || ''
  }))
  
  return new Promise((resolve, reject) => {
    const chunks = []
    const stream = csv.format({ headers: true })
    
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    
    rows.forEach(row => stream.write(row))
    stream.end()
  })
}
```

## Excel Export

```bash
npm install exceljs
```

```javascript
// services/excelService.js
const ExcelJS = require('exceljs')

async function generateExcel(trips, summary) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Mileage Report')
  
  // Header
  sheet.addRow(['Date', 'From', 'To', 'Miles', 'Rate', 'Amount'])
  sheet.getRow(1).font = { bold: true }
  
  // Data
  trips.forEach(trip => {
    sheet.addRow([
      trip.date,
      trip.startLocation,
      trip.endLocation,
      trip.miles,
      `${trip.rateApplied}p`,
      trip.amount
    ])
  })
  
  // Summary
  sheet.addRow([])
  sheet.addRow(['Total Miles:', summary.totalMiles])
  sheet.addRow(['Total Amount:', summary.totalClaim])
  
  return await workbook.xlsx.writeBuffer()
}
```

## Express Route Handler

```javascript
// routes/reports.js
const express = require('express')
const router = express.Router()
const { generateMileageReport } = require('../services/pdfService')
const { generateCSV } = require('../services/csvService')

router.get('/download/:format', async (req, res) => {
  const { format } = req.params
  const { taxYear } = req.query
  
  try {
    const trips = await getTrips(req.user.id, taxYear)
    const summary = calculateSummary(trips)
    
    if (format === 'pdf') {
      const pdf = await generateMileageReport(req.user, trips, summary, taxYear)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="mileage-${taxYear}.pdf"`)
      res.send(pdf)
    } else if (format === 'csv') {
      const csv = await generateCSV(trips)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="mileage-${taxYear}.csv"`)
      res.send(csv)
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' })
  }
})
```

## Report Templates

### Standard HMRC Report Sections:
1. **Header** - Title, tax year, generation date
2. **User Information** - Name, contact details
3. **Summary** - Total miles, total claim, rate breakdown
4. **Trips Table** - Detailed list of all journeys
5. **Declaration** - HMRC compliance statement

### Formatting Tips:
- Use A4 page size (default in PDFKit)
- Include page numbers for multi-page reports
- Use consistent date format (DD/MM/YYYY)
- Round amounts to 2 decimal places
- Include tax year clearly

## Testing Reports

```javascript
// tests/report.test.js
test('generates PDF report', async () => {
  const trips = [{ date: new Date(), miles: 10, amount: 4.5 }]
  const pdf = await generateMileageReport(user, trips, summary, '2024-25')
  
  expect(pdf).toBeInstanceOf(Buffer)
  expect(pdf.length).toBeGreaterThan(0)
})
```
