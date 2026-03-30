/**
 * Receipts API Routes
 * Handle receipt uploads, storage, and retrieval
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mileage-app-receipts';

/**
 * @route   GET /api/receipts
 * @desc    Get all receipts for logged in user
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { tripId, category, limit = 50, offset = 0 } = req.query;

    const where = {
      userId: req.user.id
    };

    if (tripId) where.tripId = tripId;
    if (category) where.category = category;

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        trip: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            tripDate: true
          }
        }
      }
    });

    // Generate signed URLs for each receipt
    const receiptsWithUrls = await Promise.all(
      receipts.map(async (receipt) => {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: receipt.storageKey
          });
          
          const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          
          return {
            ...receipt,
            downloadUrl
          };
        } catch (error) {
          console.error('Error generating signed URL:', error);
          return receipt;
        }
      })
    );

    res.json({
      success: true,
      count: receipts.length,
      receipts: receiptsWithUrls
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts'
    });
  }
});

/**
 * @route   GET /api/receipts/:id
 * @desc    Get single receipt by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        trip: true
      }
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: receipt.storageKey
    });
    
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      receipt: {
        ...receipt,
        downloadUrl
      }
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt'
    });
  }
});

/**
 * @route   POST /api/receipts
 * @desc    Upload a new receipt
 * @access  Private
 */
router.post('/', authenticate, upload.single('receipt'), [
  body('category').optional().isIn(['fuel', 'materials', 'tools', 'ppe', 'parking', 'other']),
  body('amount').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No receipt file provided'
      });
    }

    const { tripId, description, amount, merchant, receiptDate, category, ocrData } = req.body;

    // Verify trip belongs to user if provided
    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          userId: req.user.id
        }
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${req.file.originalname}`;
    const storageKey = `receipts/${req.user.id}/${filename}`;

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        userId: req.user.id,
        originalName: req.file.originalname
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Save to database
    const receipt = await prisma.receipt.create({
      data: {
        userId: req.user.id,
        tripId: tripId || null,
        filename: req.file.originalname,
        storageKey: storageKey,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        description: description || null,
        amount: amount ? parseFloat(amount) : null,
        merchant: merchant || null,
        receiptDate: receiptDate ? new Date(receiptDate) : null,
        category: category || 'other',
        ocrData: ocrData ? JSON.parse(ocrData) : null
      }
    });

    // Generate download URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey
    });
    
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.status(201).json({
      success: true,
      receipt: {
        ...receipt,
        downloadUrl
      }
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload receipt'
    });
  }
});

/**
 * @route   PUT /api/receipts/:id
 * @desc    Update receipt metadata
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { description, amount, merchant, receiptDate, category, tripId } = req.body;

    // Check receipt exists and belongs to user
    const existingReceipt = await prisma.receipt.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingReceipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    // Verify trip belongs to user if provided
    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: {
          id: tripId,
          userId: req.user.id
        }
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
      }
    }

    const receipt = await prisma.receipt.update({
      where: { id: req.params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(merchant !== undefined && { merchant }),
        ...(receiptDate && { receiptDate: new Date(receiptDate) }),
        ...(category && { category }),
        ...(tripId !== undefined && { tripId: tripId || null })
      }
    });

    res.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update receipt'
    });
  }
});

/**
 * @route   DELETE /api/receipts/:id
 * @desc    Delete a receipt
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    // Delete from database
    await prisma.receipt.delete({
      where: { id: req.params.id }
    });

    // Note: Optionally delete from S3 here, or keep for audit purposes
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: BUCKET_NAME,
    //   Key: receipt.storageKey
    // }));

    res.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete receipt'
    });
  }
});

/**
 * @route   GET /api/receipts/stats/summary
 * @desc    Get receipt statistics
 * @access  Private
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      userId: req.user.id
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get stats by category
    const categoryStats = await prisma.receipt.groupBy({
      by: ['category'],
      where,
      _count: {
        id: true
      },
      _sum: {
        amount: true,
        fileSize: true
      }
    });

    // Get total count and amount
    const totals = await prisma.receipt.aggregate({
      where,
      _count: {
        id: true
      },
      _sum: {
        amount: true,
        fileSize: true
      }
    });

    res.json({
      success: true,
      stats: {
        totalCount: totals._count.id,
        totalAmount: totals._sum.amount || 0,
        totalSize: totals._sum.fileSize || 0,
        byCategory: categoryStats.map(cat => ({
          category: cat.category,
          count: cat._count.id,
          amount: cat._sum.amount || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching receipt stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
