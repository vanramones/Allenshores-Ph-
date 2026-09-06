const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Cloudinary setup for image uploads (works on Vercel)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'allenshores/beaches',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }],
    public_id: (req, file) => `beach_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadFields = upload.array('images', 10);

// Helper: convert form-data boolean string to actual boolean
const toBool = (val) => val === 'true' || val === true;

// @route   GET /api/beaches
// @desc    Get all beaches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, rating, price_level, sort } = req.query;

    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    let sql = `
      SELECT
        b.id, b.name, b.location, b.region, b.price, b.price_level, b.type,
        b.image, b.description, b.created_at,
        b.cottage_available, b.cottage_count, b.cottage_price,
        b.room_available, b.room_count, b.room_price,
        b.water_temp, b.weather_info,
        COUNT(DISTINCT bi.id) as image_count,
        ROUND(AVG(r.rating), 1) as rating,
        COUNT(r.id) as reviews_count
      FROM beaches b
      LEFT JOIN beach_images bi ON b.id = bi.beach_id
      LEFT JOIN reviews r ON b.id = r.beach_id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (search) {
      sql += ` AND (b.name ILIKE $${paramIdx} OR b.location ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (price_level) {
      sql += ` AND b.price_level = $${paramIdx}`;
      params.push(price_level);
      paramIdx++;
    }

    sql += ' GROUP BY b.id';

    if (rating) {
      sql += ` HAVING AVG(r.rating) >= $${paramIdx}`;
      params.push(parseFloat(rating));
      paramIdx++;
    }

    // Sorting
    switch (sort) {
      case 'rating':
        sql += ' ORDER BY rating IS NULL, rating DESC';
        break;
      case 'name':
        sql += ' ORDER BY b.name ASC';
        break;
      case 'reviews':
        sql += ' ORDER BY reviews_count DESC';
        break;
      default:
        sql += ' ORDER BY b.created_at DESC';
    }

    if (limit && !isNaN(limit) && limit > 0) {
      sql += ` LIMIT $${paramIdx}`;
      params.push(limit);
      paramIdx++;
    }

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Get beaches error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/beaches/featured
// @desc    Get featured beaches (top rated)
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        b.id, b.name, b.location, b.region, b.price, b.price_level, b.type,
        b.image, b.description, b.created_at,
        ROUND(AVG(r.rating), 1) as rating,
        COUNT(r.id) as reviews_count
      FROM beaches b
      LEFT JOIN reviews r ON b.id = r.beach_id
      GROUP BY b.id
      HAVING AVG(r.rating) IS NOT NULL
      ORDER BY rating DESC
      LIMIT 6
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get featured beaches error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/beaches/stats
// @desc    Get beach statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { rows: beachRows } = await db.query('SELECT COUNT(*) as totalBeaches FROM beaches');
    const { rows: reviewRows } = await db.query('SELECT COUNT(*) as totalReviews FROM reviews');
    const { rows: ratingRows } = await db.query('SELECT AVG(rating) as avgRating FROM reviews');

    res.json({
      totalBeaches: parseInt(beachRows[0].totalbeaches),
      totalReviews: parseInt(reviewRows[0].totalreviews),
      avgRating: ratingRows[0].avgrating ? parseFloat(ratingRows[0].avgrating).toFixed(1) : 0
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/beaches/:id
// @desc    Get single beach with images
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { rows: beachRows } = await db.query(`
      SELECT
        b.id, b.name, b.location, b.region, b.price, b.price_level, b.type,
        b.image, b.description, b.created_at,
        b.cottage_available, b.cottage_count, b.cottage_price,
        b.room_available, b.room_count, b.room_price,
        b.water_temp, b.weather_info,
        ROUND(AVG(r.rating), 1) as rating,
        COUNT(r.id) as reviews_count
      FROM beaches b
      LEFT JOIN reviews r ON b.id = r.beach_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [req.params.id]);

    if (beachRows.length === 0) {
      return res.status(404).json({ message: 'Beach not found' });
    }

    const { rows: imageRows } = await db.query(
      'SELECT * FROM beach_images WHERE beach_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [req.params.id]
    );

    const beach = beachRows[0];
    beach.images = imageRows;
    res.json(beach);
  } catch (err) {
    console.error('Get beach error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/beaches
// @desc    Create new beach with multiple images
// @access  Private (Admin) - DISABLED: Only beach owners can manage beaches
router.post('/', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Beach creation is now handled by beach owners. Admin can only view beaches.' });
});

// @route   PUT /api/beaches/:id
// @desc    Update beach with image management
// @access  Private (Admin) - DISABLED: Only beach owners can edit their own beach
router.put('/:id', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Beach editing is now handled by beach owners. Admin can only view beaches.' });
});

// @route   DELETE /api/beaches/:id/images/:imageId
// @desc    Delete a beach image
// @access  Private (Admin) - DISABLED: Only beach owners can manage images
router.delete('/:id/images/:imageId', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Image management is now handled by beach owners.' });
});

// Old delete image code (disabled)
/*
router.delete('/:id/images/:imageId', authMiddleware, async (req, res) => {
  try {
    const { id: beachId, imageId } = req.params;

    const { rows: imageRows } = await db.query(
      'SELECT * FROM beach_images WHERE id = $1 AND beach_id = $2',
      [imageId, beachId]
    );

    if (imageRows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = imageRows[0];

    // Delete from Cloudinary or local
    if (image.image_path && image.image_path.includes('cloudinary')) {
      try {
        const urlParts = image.image_path.split('/');
        const uploadIndex = urlParts.findIndex(p => p === 'upload');
        if (uploadIndex !== -1) {
          const publicIdParts = urlParts.slice(uploadIndex + 2);
          const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.warn('Could not delete from Cloudinary:', image.image_path, err.message);
      }
    } else {
      try {
        const filePath = path.join(__dirname, '../..', image.image_path.replace(/^\//, ''));
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Could not delete file:', image.image_path, err.message);
      }
    }

    await db.query('DELETE FROM beach_images WHERE id = $1', [imageId]);

    // Update primary image
    const { rows: primaryRows } = await db.query(
      'SELECT image_path FROM beach_images WHERE beach_id = $1 AND is_primary = TRUE LIMIT 1',
      [beachId]
    );

    if (primaryRows.length > 0) {
      await db.query('UPDATE beaches SET image = $1 WHERE id = $2', [primaryRows[0].image_path, beachId]);
    } else {
      const { rows: newPrimaryRows } = await db.query(
        'SELECT image_path FROM beach_images WHERE beach_id = $1 ORDER BY created_at ASC LIMIT 1',
        [beachId]
      );
      await db.query(
        'UPDATE beaches SET image = $1 WHERE id = $2',
        [newPrimaryRows.length > 0 ? newPrimaryRows[0].image_path : null, beachId]
      );
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
*/

// @route   PUT /api/beaches/:id/images/:imageId/primary
// @desc    Set primary beach image
// @access  Private (Admin) - DISABLED: Only beach owners can manage images
router.put('/:id/images/:imageId/primary', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Image management is now handled by beach owners.' });
});

// @route   DELETE /api/beaches/:id
// @desc    Delete beach and all images
// @access  Private (Admin) - DISABLED: Only beach owners can manage their beach
router.delete('/:id', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Beach deletion is now handled by beach owners. Admin can only view beaches.' });
});

module.exports = router;
