/**
 * Sync API Routes
 * Handle bulk sync from mobile devices
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/sync/trips
 * @desc    Bulk sync trips from mobile device
 * @access  Private
 */
router.post('/trips', authenticate, [
  body('trips').isArray().withMessage('Trips must be an array'),
  body('trips.*.id').notEmpty().withMessage('Trip ID is required'),
  body('trips.*.startTime').isISO8601().withMessage('Invalid start time'),
  body('trips.*.distance').isFloat({ min: 0 }).withMessage('Distance must be positive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { trips } = req.body;
    const results = [];
    let created = 0;
    let updated = 0;
    let errorCount = 0;

    // Process each trip
    for (const tripData of trips) {
      try {
        // Check if trip already exists
        const existingTrip = await prisma.trip.findUnique({
          where: { id: tripData.id }
        });

        // Prepare trip data
        const tripRecord = {
          id: tripData.id,
          userId: req.user.id,
          tripDate: new Date(tripData.startTime),
          startLocation: tripData.startLocation?.address || tripData.startAddress || '',
          endLocation: tripData.endLocation?.address || tripData.endAddress || '',
          startPostcode: tripData.startLocation?.postcode || tripData.startPostcode || null,
          endPostcode: tripData.endLocation?.postcode || tripData.endPostcode || null,
          distanceMiles: parseFloat(tripData.distance),
          purpose: tripData.purpose || 'Business trip',
          purposeCategory: tripData.purposeCategory || 'business',
          vehicleId: tripData.vehicleId || null,
          rateApplied: parseFloat(tripData.rateApplied) || 0.45,
          amountGbp: parseFloat(tripData.amount) || 0,
          taxYear: tripData.taxYear || getTaxYear(new Date(tripData.startTime)),
          isRoundTrip: tripData.isRoundTrip || false,
          notes: tripData.notes || null,
          gpsData: tripData.locations ? JSON.stringify(tripData.locations) : null
        };

        if (existingTrip) {
          // Check if mobile version is newer
          const mobileUpdatedAt = tripData.updatedAt ? new Date(tripData.updatedAt) : null;
          const serverUpdatedAt = existingTrip.updatedAt;

          if (!mobileUpdatedAt || mobileUpdatedAt >= serverUpdatedAt) {
            // Update existing trip
            await prisma.trip.update({
              where: { id: tripData.id },
              data: tripRecord
            });
            updated++;
            results.push({ id: tripData.id, status: 'updated' });
          } else {
            // Server version is newer, keep it
            results.push({ id: tripData.id, status: 'skipped', reason: 'Server version newer' });
          }
        } else {
          // Create new trip
          await prisma.trip.create({
            data: tripRecord
          });
          created++;
          results.push({ id: tripData.id, status: 'created' });
        }
      } catch (tripError) {
        console.error(`Error processing trip ${tripData.id}:`, tripError);
        errorCount++;
        results.push({ 
          id: tripData.id, 
          status: 'error', 
          error: tripError.message 
        });
      }
    }

    // Update user's mileage summary after sync
    await updateMileageSummary(req.user.id);

    res.json({
      success: true,
      summary: {
        total: trips.length,
        created,
        updated,
        errors,
        skipped: trips.length - created - updated - errors
      },
      results
    });
  } catch (error) {
    console.error('Error syncing trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync trips'
    });
  }
});

/**
 * @route   POST /api/sync/receipts
 * @desc    Bulk sync receipts from mobile device
 * @access  Private
 */
router.post('/receipts', authenticate, [
  body('receipts').isArray().withMessage('Receipts must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { receipts } = req.body;
    const results = [];
    let created = 0;
    let updated = 0;
    let errorCount = 0;

    for (const receiptData of receipts) {
      try {
        const existingReceipt = await prisma.receipt.findUnique({
          where: { id: receiptData.id }
        });

        const receiptRecord = {
          id: receiptData.id,
          userId: req.user.id,
          tripId: receiptData.tripId || null,
          filename: receiptData.filename,
          storageKey: receiptData.storageKey || `pending/${receiptData.id}`,
          fileType: receiptData.fileType || 'image/jpeg',
          fileSize: receiptData.fileSize || 0,
          description: receiptData.description || null,
          amount: receiptData.amount ? parseFloat(receiptData.amount) : null,
          merchant: receiptData.merchant || null,
          receiptDate: receiptData.receiptDate ? new Date(receiptData.receiptDate) : null,
          category: receiptData.category || 'other',
          ocrData: receiptData.ocrData ? JSON.stringify(receiptData.ocrData) : null
        };

        if (existingReceipt) {
          await prisma.receipt.update({
            where: { id: receiptData.id },
            data: receiptRecord
          });
          updated++;
          results.push({ id: receiptData.id, status: 'updated' });
        } else {
          await prisma.receipt.create({
            data: receiptRecord
          });
          created++;
          results.push({ id: receiptData.id, status: 'created' });
        }
      } catch (receiptError) {
        console.error(`Error processing receipt ${receiptData.id}:`, receiptError);
        errorCount++;
        results.push({ 
          id: receiptData.id, 
          status: 'error', 
          error: receiptError.message 
        });
      }
    }

    res.json({
      success: true,
      summary: {
        total: receipts.length,
        created,
        updated,
        errors
      },
      results
    });
  } catch (error) {
    console.error('Error syncing receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync receipts'
    });
  }
});

/**
 * @route   POST /api/sync/sites
 * @desc    Bulk sync sites from mobile device
 * @access  Private
 */
router.post('/sites', authenticate, [
  body('sites').isArray().withMessage('Sites must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sites } = req.body;
    const results = [];
    let created = 0;
    let updated = 0;
    let errorCount = 0;

    for (const siteData of sites) {
      try {
        const existingSite = await prisma.site.findUnique({
          where: { id: siteData.id }
        });

        const siteRecord = {
          id: siteData.id,
          userId: req.user.id,
          name: siteData.name,
          address: siteData.address,
          postcode: siteData.postcode || null,
          latitude: siteData.latitude || null,
          longitude: siteData.longitude || null,
          radius: siteData.radius || 100,
          firstVisitDate: new Date(siteData.firstVisitDate),
          lastVisitDate: siteData.lastVisitDate ? new Date(siteData.lastVisitDate) : null,
          visitCount: siteData.visitCount || 0,
          isActive: siteData.isActive !== false
        };

        if (existingSite) {
          await prisma.site.update({
            where: { id: siteData.id },
            data: siteRecord
          });
          updated++;
          results.push({ id: siteData.id, status: 'updated' });
        } else {
          await prisma.site.create({
            data: siteRecord
          });
          created++;
          results.push({ id: siteData.id, status: 'created' });
        }
      } catch (siteError) {
        console.error(`Error processing site ${siteData.id}:`, siteError);
        errorCount++;
        results.push({ 
          id: siteData.id, 
          status: 'error', 
          error: siteError.message 
        });
      }
    }

    res.json({
      success: true,
      summary: {
        total: sites.length,
        created,
        updated,
        errors
      },
      results
    });
  } catch (error) {
    console.error('Error syncing sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync sites'
    });
  }
});

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status - what needs to be synced from server to mobile
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Get trips modified since last sync
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user.id,
        updatedAt: {
          gt: lastSyncDate
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get sites modified since last sync
    const sites = await prisma.site.findMany({
      where: {
        userId: req.user.id,
        updatedAt: {
          gt: lastSyncDate
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get receipts modified since last sync
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: req.user.id,
        updatedAt: {
          gt: lastSyncDate
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      pendingFromServer: {
        trips: trips.length,
        sites: sites.length,
        receipts: receipts.length
      },
      data: {
        trips,
        sites,
        receipts
      }
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

// Helper function to get tax year from date
function getTaxYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Tax year runs from April 6 to April 5
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
  return `${year}-${(year + 1).toString().slice(-2)}`;
}

// Helper function to update mileage summary
async function updateMileageSummary(userId) {
  try {
    const currentTaxYear = getTaxYear(new Date());
    
    // Get all trips for current tax year
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        taxYear: currentTaxYear
      }
    });

    // Calculate totals
    const totalMiles = trips.reduce((sum, t) => sum + parseFloat(t.distanceMiles), 0);
    const totalAmount = trips.reduce((sum, t) => sum + parseFloat(t.amountGbp), 0);
    const milesAt45p = trips
      .filter(t => parseFloat(t.rateApplied) >= 0.40)
      .reduce((sum, t) => sum + parseFloat(t.distanceMiles), 0);
    const amountAt45p = trips
      .filter(t => parseFloat(t.rateApplied) >= 0.40)
      .reduce((sum, t) => sum + parseFloat(t.amountGbp), 0);
    const milesAt25p = trips
      .filter(t => parseFloat(t.rateApplied) < 0.40)
      .reduce((sum, t) => sum + parseFloat(t.distanceMiles), 0);
    const amountAt25p = trips
      .filter(t => parseFloat(t.rateApplied) < 0.40)
      .reduce((sum, t) => sum + parseFloat(t.amountGbp), 0);

    // Upsert summary
    await prisma.userMileageSummary.upsert({
      where: {
        userId_taxYear: {
          userId,
          taxYear: currentTaxYear
        }
      },
      update: {
        totalMiles: Math.round(totalMiles * 100) / 100,
        totalClaimAmount: Math.round(totalAmount * 100) / 100,
        tripCount: trips.length,
        milesAt45p: Math.round(milesAt45p * 100) / 100,
        amountAt45p: Math.round(amountAt45p * 100) / 100,
        milesAt25p: Math.round(milesAt25p * 100) / 100,
        amountAt25p: Math.round(amountAt25p * 100) / 100,
        lastTripDate: trips.length > 0 ? trips[trips.length - 1].tripDate : null,
        calculatedAt: new Date()
      },
      create: {
        userId,
        taxYear: currentTaxYear,
        totalMiles: Math.round(totalMiles * 100) / 100,
        totalClaimAmount: Math.round(totalAmount * 100) / 100,
        tripCount: trips.length,
        milesAt45p: Math.round(milesAt45p * 100) / 100,
        amountAt45p: Math.round(amountAt45p * 100) / 100,
        milesAt25p: Math.round(milesAt25p * 100) / 100,
        amountAt25p: Math.round(amountAt25p * 100) / 100,
        lastTripDate: trips.length > 0 ? trips[trips.length - 1].tripDate : null
      }
    });
  } catch (error) {
    console.error('Error updating mileage summary:', error);
  }
}

module.exports = router;
