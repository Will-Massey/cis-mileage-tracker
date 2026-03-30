/**
 * Sites API Routes
 * Construction site management for CIS contractors
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/sites
 * @desc    Get all sites for logged in user
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      where: { 
        userId: req.user.id,
        isActive: true 
      },
      orderBy: [
        { visitCount: 'desc' },
        { lastVisitDate: 'desc' }
      ]
    });

    // Calculate 24-month rule status for each site
    const sitesWithStatus = sites.map(site => {
      const ruleStatus = calculate24MonthRule(site);
      return {
        ...site,
        ruleStatus
      };
    });

    res.json({
      success: true,
      count: sites.length,
      sites: sitesWithStatus
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites'
    });
  }
});

/**
 * @route   GET /api/sites/:id
 * @desc    Get single site by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const site = await prisma.site.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    // Get trips to this site
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user.id,
        endLocation: {
          contains: site.name
        }
      },
      orderBy: { tripDate: 'desc' },
      take: 10
    });

    const ruleStatus = calculate24MonthRule(site);

    res.json({
      success: true,
      site: {
        ...site,
        ruleStatus,
        recentTrips: trips
      }
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site'
    });
  }
});

/**
 * @route   POST /api/sites
 * @desc    Create a new construction site
 * @access  Private
 */
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Site name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, address, postcode, latitude, longitude, radius = 100 } = req.body;

    // Check for duplicate site name
    const existingSite = await prisma.site.findFirst({
      where: {
        userId: req.user.id,
        name: name,
        isActive: true
      }
    });

    if (existingSite) {
      return res.status(409).json({
        success: false,
        error: 'A site with this name already exists'
      });
    }

    const site = await prisma.site.create({
      data: {
        userId: req.user.id,
        name,
        address,
        postcode,
        latitude,
        longitude,
        radius,
        firstVisitDate: new Date(),
        lastVisitDate: new Date(),
        visitCount: 0,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      site: {
        ...site,
        ruleStatus: calculate24MonthRule(site)
      }
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site'
    });
  }
});

/**
 * @route   PUT /api/sites/:id
 * @desc    Update a site
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, address, postcode, latitude, longitude, radius, isActive } = req.body;

    // Check site exists and belongs to user
    const existingSite = await prisma.site.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    // Check for name conflict if changing name
    if (name && name !== existingSite.name) {
      const duplicate = await prisma.site.findFirst({
        where: {
          userId: req.user.id,
          name: name,
          isActive: true,
          id: { not: req.params.id }
        }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: 'A site with this name already exists'
        });
      }
    }

    const site = await prisma.site.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(postcode !== undefined && { postcode }),
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        ...(radius && { radius }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      site: {
        ...site,
        ruleStatus: calculate24MonthRule(site)
      }
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update site'
    });
  }
});

/**
 * @route   DELETE /api/sites/:id
 * @desc    Soft delete a site
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    await prisma.site.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete site'
    });
  }
});

/**
 * @route   POST /api/sites/:id/visit
 * @desc    Record a visit to a site (updates visit count and last visit date)
 * @access  Private
 */
router.post('/:id/visit', authenticate, async (req, res) => {
  try {
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }

    const updatedSite = await prisma.site.update({
      where: { id: req.params.id },
      data: {
        visitCount: { increment: 1 },
        lastVisitDate: new Date()
      }
    });

    res.json({
      success: true,
      site: {
        ...updatedSite,
        ruleStatus: calculate24MonthRule(updatedSite)
      }
    });
  } catch (error) {
    console.error('Error recording site visit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record visit'
    });
  }
});

/**
 * @route   GET /api/sites/warnings
 * @desc    Get sites with 24-month rule warnings
 * @access  Private
 */
router.get('/warnings/list', authenticate, async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      }
    });

    const sitesWithWarnings = sites
      .map(site => ({
        ...site,
        ruleStatus: calculate24MonthRule(site)
      }))
      .filter(site => 
        site.ruleStatus.status === 'warning' || 
        site.ruleStatus.status === 'urgent' ||
        site.ruleStatus.status === 'expired'
      );

    res.json({
      success: true,
      count: sitesWithWarnings.length,
      sites: sitesWithWarnings
    });
  } catch (error) {
    console.error('Error fetching site warnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warnings'
    });
  }
});

/**
 * Calculate 24-month rule status for a site
 * HMRC: Site is temporary if working < 24 months
 */
function calculate24MonthRule(site) {
  const firstVisit = new Date(site.firstVisitDate);
  const now = new Date();
  const daysSinceFirstVisit = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));
  const monthsSinceFirstVisit = daysSinceFirstVisit / 30;

  let status = 'ok';
  let message = '';
  let canClaim = true;

  if (monthsSinceFirstVisit >= 24) {
    status = 'expired';
    message = `Site "${site.name}" has become a permanent workplace. Home-to-site travel is no longer claimable.`;
    canClaim = false;
  } else if (monthsSinceFirstVisit >= 23) {
    status = 'urgent';
    message = `URGENT: Site "${site.name}" reaches 24-month limit soon.`;
  } else if (monthsSinceFirstVisit >= 18) {
    status = 'warning';
    const monthsRemaining = Math.floor(24 - monthsSinceFirstVisit);
    message = `WARNING: Site "${site.name}" has ${monthsRemaining} months remaining as temporary workplace.`;
  }

  return {
    siteId: site.id,
    siteName: site.name,
    firstVisitDate: site.firstVisitDate,
    daysSinceFirstVisit,
    monthsSinceFirstVisit: Math.floor(monthsSinceFirstVisit),
    status,
    message,
    canClaim,
    expiresAt: new Date(firstVisit.getTime() + (24 * 30 * 24 * 60 * 60 * 1000)).toISOString()
  };
}

module.exports = router;
