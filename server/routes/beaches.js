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

// Protected beach IDs - only their respective owners can edit these
const OWNER_BEACH_IDS = [2, 7, 11];

// Middleware: Only super admin can access (not beach owners/staff)
const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

// Middleware: Block operations on owner-protected beaches
const notOwnerBeach = (req, res, next) => {
  const beachId = parseInt(req.params.id);
  if (OWNER_BEACH_IDS.includes(beachId)) {
    return res.status(403).json({
      message: 'This beach is managed by its beach owner. Super Admin cannot modify owner-managed beaches (Sunrise, Caba Villa Diaz, Tonying).'
    });
  }
  next();
};

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

// ═══════════════════════════════════════════════════════════
// ADMIN BEACH MANAGEMENT (Super Admin only)
// Can add/edit/delete beaches EXCEPT owner-protected beaches (IDs: 2, 7, 11)
// ═══════════════════════════════════════════════════════════

// @route   POST /api/beaches
// @desc    Create new beach with multiple images
// @access  Private (Super Admin only)
router.post('/', authMiddleware, superAdminOnly, uploadFields, async (req, res) => {
  try {
    const {
      name, location, region, price, price_level, type, description,
      cottage_available, cottage_count, cottage_price,
      room_available, room_count, room_price,
      water_temp, weather_info
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Beach name and location are required' });
    }

    // Insert beach
    const { rows: beachRows } = await db.query(`
      INSERT INTO beaches (
        name, location, region, price, price_level, type, description,
        cottage_available, cottage_count, cottage_price,
        room_available, room_count, room_price,
        water_temp, weather_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `, [
      name, location, region || null,
      price ? parseFloat(price) : 0, price_level || '$', type || 'public', description || '',
      toBool(cottage_available), cottage_count ? parseInt(cottage_count) : 0, cottage_price ? parseFloat(cottage_price) : 0,
      toBool(room_available), room_count ? parseInt(room_count) : 0, room_price ? parseFloat(room_price) : 0,
      water_temp || '', weather_info || ''
    ]);

    const beachId = beachRows[0].id;

    // Insert images
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const isPrimary = i === 0;
        const imagePath = file.path || file.secure_url || file.url;
        if (isPrimary) primaryImage = imagePath;

        await db.query(
          'INSERT INTO beach_images (beach_id, image_path, is_primary) VALUES ($1, $2, $3)',
          [beachId, imagePath, isPrimary]
        );
      }

      if (primaryImage) {
        await db.query('UPDATE beaches SET image = $1 WHERE id = $2', [primaryImage, beachId]);
      }
    }

    res.status(201).json({ id: beachId, message: 'Beach created successfully' });
  } catch (err) {
    console.error('Create beach error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/beaches/:id
// @desc    Update beach with image management
// @access  Private (Super Admin only, NOT for owner-protected beaches)
router.put('/:id', authMiddleware, superAdminOnly, notOwnerBeach, uploadFields, async (req, res) => {
  try {
    const beachId = req.params.id;
    const {
      name, location, region, price, price_level, type, description,
      cottage_available, cottage_count, cottage_price,
      room_available, room_count, room_price,
      water_temp, weather_info
    } = req.body;

    // Check beach exists
    const { rows: existing } = await db.query('SELECT * FROM beaches WHERE id = $1', [beachId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Beach not found' });
    }

    // Update beach
    await db.query(`
      UPDATE beaches SET
        name = $1, location = $2, region = $3, price = $4, price_level = $5,
        type = $6, description = $7,
        cottage_available = $8, cottage_count = $9, cottage_price = $10,
        room_available = $11, room_count = $12, room_price = $13,
        water_temp = $14, weather_info = $15
      WHERE id = $16
    `, [
      name, location, region || null,
      price ? parseFloat(price) : 0, price_level || '$', type || 'public', description || '',
      toBool(cottage_available), cottage_count ? parseInt(cottage_count) : 0, cottage_price ? parseFloat(cottage_price) : 0,
      toBool(room_available), room_count ? parseInt(room_count) : 0, room_price ? parseFloat(room_price) : 0,
      water_temp || '', weather_info || '',
      beachId
    ]);

    // Add new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imagePath = file.path || file.secure_url || file.url;
        await db.query(
          'INSERT INTO beach_images (beach_id, image_path, is_primary) VALUES ($1, $2, false)',
          [beachId, imagePath]
        );
      }
    }

    res.json({ message: 'Beach updated successfully' });
  } catch (err) {
    console.error('Update beach error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/beaches/:id/images/:imageId
// @desc    Delete a beach image
// @access  Private (Super Admin only, NOT for owner-protected beaches)
router.delete('/:id/images/:imageId', authMiddleware, superAdminOnly, notOwnerBeach, async (req, res) => {
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

// @route   PUT /api/beaches/:id/images/:imageId/primary
// @desc    Set primary beach image
// @access  Private (Super Admin only, NOT for owner-protected beaches)
router.put('/:id/images/:imageId/primary', authMiddleware, superAdminOnly, notOwnerBeach, async (req, res) => {
  try {
    const { id: beachId, imageId } = req.params;

    // Unset all primary flags for this beach
    await db.query('UPDATE beach_images SET is_primary = FALSE WHERE beach_id = $1', [beachId]);

    // Set the selected image as primary
    await db.query('UPDATE beach_images SET is_primary = TRUE WHERE id = $1 AND beach_id = $2', [imageId, beachId]);

    // Update beach main image
    const { rows: imageRows } = await db.query('SELECT image_path FROM beach_images WHERE id = $1', [imageId]);
    if (imageRows.length > 0) {
      await db.query('UPDATE beaches SET image = $1 WHERE id = $2', [imageRows[0].image_path, beachId]);
    }

    res.json({ message: 'Primary image updated successfully' });
  } catch (err) {
    console.error('Set primary image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/beaches/:id
// @desc    Delete beach and all images
// @access  Private (Super Admin only, NOT for owner-protected beaches)
router.delete('/:id', authMiddleware, superAdminOnly, notOwnerBeach, async (req, res) => {
  try {
    const beachId = req.params.id;

    // Get all images to delete from Cloudinary
    const { rows: images } = await db.query('SELECT image_path FROM beach_images WHERE beach_id = $1', [beachId]);

    // Delete images from Cloudinary
    for (const image of images) {
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
      }
    }

    // Delete from database (cascade will handle images)
    await db.query('DELETE FROM beach_images WHERE beach_id = $1', [beachId]);
    await db.query('DELETE FROM reviews WHERE beach_id = $1', [beachId]);
    await db.query('DELETE FROM bookings WHERE beach_id = $1', [beachId]);
    await db.query('DELETE FROM beaches WHERE id = $1', [beachId]);

    res.json({ message: 'Beach deleted successfully' });
  } catch (err) {
    console.error('Delete beach error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
