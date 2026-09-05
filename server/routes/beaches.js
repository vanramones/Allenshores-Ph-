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
// @access  Private (Admin)
router.post('/', authMiddleware, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const {
      name, location, region,
      price, price_level, type, description,
      cottage_available, cottage_count, cottage_price,
      room_available, room_count, room_price,
      water_temp, weather_info
    } = req.body;

    const { rows } = await client.query(
      `INSERT INTO beaches (name, location, region, rating, reviews_count, price, price_level, type, image, description,
        cottage_available, cottage_count, cottage_price, room_available, room_count, room_price, water_temp, weather_info)
       VALUES ($1, $2, $3, 0, 0, $4, $5, $6, NULL, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [name, location, region || 'Allen', price || '0', price_level || 'Budget', type || 'Beach', description || '',
       toBool(cottage_available), cottage_count || 0, cottage_price || '0',
       toBool(room_available), room_count || 0, room_price || '0',
       water_temp || null, weather_info || null]
    );

    const beachId = rows[0].id;
    let primaryImage = null;

    if (req.files && req.files.length > 0) {
      // Build bulk insert values
      let valuePlaceholders = [];
      let valueParams = [];
      req.files.forEach((file, index) => {
        const base = index * 3;
        valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
        valueParams.push(beachId, file.path, index === 0);
      });

      await client.query(
        `INSERT INTO beach_images (beach_id, image_path, is_primary) VALUES ${valuePlaceholders.join(', ')}`,
        valueParams
      );

      primaryImage = req.files[0].path;
      await client.query(
        'UPDATE beaches SET image = $1 WHERE id = $2',
        [primaryImage, beachId]
      );
    }

    await client.query('COMMIT');

    const { rows: newBeach } = await db.query('SELECT * FROM beaches WHERE id = $1', [beachId]);
    const { rows: newImages } = await db.query('SELECT * FROM beach_images WHERE beach_id = $1', [beachId]);
    const response = newBeach[0];
    response.images = newImages;
    res.status(201).json(response);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create beach error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// @route   PUT /api/beaches/:id
// @desc    Update beach with image management
// @access  Private (Admin)
router.put('/:id', authMiddleware, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const beachId = req.params.id;
    const {
      name, location, region,
      price, price_level, type, description,
      cottage_available, cottage_count, cottage_price,
      room_available, room_count, room_price,
      water_temp, weather_info,
      deletedImages, primaryImageId
    } = req.body;

    // Update beach details (rating and reviews_count are auto-calculated from reviews)
    await client.query(
      `UPDATE beaches SET
        name = $1, location = $2, region = $3,
        price = $4, price_level = $5, type = $6, description = $7,
        cottage_available = $8, cottage_count = $9, cottage_price = $10,
        room_available = $11, room_count = $12, room_price = $13,
        water_temp = $14, weather_info = $15
      WHERE id = $16`,
      [name, location, region, price, price_level, type, description,
       toBool(cottage_available), cottage_count || 0, cottage_price || '0',
       toBool(room_available), room_count || 0, room_price || '0',
       water_temp || null, weather_info || null,
       beachId]
    );

    // Delete removed images
    if (deletedImages) {
      let idsToDelete = [];
      try {
        idsToDelete = Array.isArray(deletedImages) ? deletedImages.map(id => parseInt(id)) : JSON.parse(deletedImages).map(id => parseInt(id));
      } catch (e) {
        idsToDelete = [];
      }

      if (idsToDelete.length > 0) {
        const { rows: imagesToDelete } = await client.query(
          'SELECT * FROM beach_images WHERE id = ANY($1::int[]) AND beach_id = $2',
          [idsToDelete, beachId]
        );

        // Delete from Cloudinary if the image is a Cloudinary URL
        for (const img of imagesToDelete) {
          if (img.image_path && img.image_path.includes('cloudinary')) {
            try {
              const urlParts = img.image_path.split('/');
              const uploadIndex = urlParts.findIndex(p => p === 'upload');
              if (uploadIndex !== -1) {
                const publicIdParts = urlParts.slice(uploadIndex + 2);
                const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
                await cloudinary.uploader.destroy(publicId);
              }
            } catch (err) {
              console.warn('Could not delete from Cloudinary:', img.image_path, err.message);
            }
          } else {
            // Local file deletion (for dev)
            try {
              const filePath = path.join(__dirname, '../..', img.image_path.replace(/^\//, ''));
              await fs.unlink(filePath);
            } catch (err) {
              console.warn('Could not delete file:', img.image_path, err.message);
            }
          }
        }

        await client.query(
          'DELETE FROM beach_images WHERE id = ANY($1::int[]) AND beach_id = $2',
          [idsToDelete, beachId]
        );
      }
    }

    // Add new images
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      const { rows: existingImages } = await client.query(
        'SELECT * FROM beach_images WHERE beach_id = $1',
        [beachId]
      );

      let valuePlaceholders = [];
      let valueParams = [];
      req.files.forEach((file, index) => {
        const base = index * 3;
        const isPrimary = existingImages.length === 0 && index === 0;
        valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
        valueParams.push(beachId, file.path, isPrimary);
      });

      await client.query(
        `INSERT INTO beach_images (beach_id, image_path, is_primary) VALUES ${valuePlaceholders.join(', ')}`,
        valueParams
      );

      if (existingImages.length === 0) {
        primaryImage = req.files[0].path;
      }
    }

    // Set primary image
    if (primaryImageId) {
      await client.query(
        'UPDATE beach_images SET is_primary = FALSE WHERE beach_id = $1',
        [beachId]
      );
      await client.query(
        'UPDATE beach_images SET is_primary = TRUE WHERE id = $1 AND beach_id = $2',
        [primaryImageId, beachId]
      );

      const { rows: primaryRows } = await client.query(
        'SELECT image_path FROM beach_images WHERE id = $1 AND beach_id = $2',
        [primaryImageId, beachId]
      );

      if (primaryRows.length > 0) {
        primaryImage = primaryRows[0].image_path;
      }
    }

    // Update beach primary image
    if (primaryImage) {
      await client.query(
        'UPDATE beaches SET image = $1 WHERE id = $2',
        [primaryImage, beachId]
      );
    }

    await client.query('COMMIT');

    const { rows: updatedBeach } = await db.query('SELECT * FROM beaches WHERE id = $1', [beachId]);
    const { rows: updatedImages } = await db.query(
      'SELECT * FROM beach_images WHERE beach_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [beachId]
    );
    const response = updatedBeach[0];
    response.images = updatedImages;
    res.json(response);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update beach error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// @route   DELETE /api/beaches/:id/images/:imageId
// @desc    Delete a beach image
// @access  Private (Admin)
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

// @route   PUT /api/beaches/:id/images/:imageId/primary
// @desc    Set primary beach image
// @access  Private (Admin)
router.put('/:id/images/:imageId/primary', authMiddleware, async (req, res) => {
  try {
    const { id: beachId, imageId } = req.params;

    await db.query('UPDATE beach_images SET is_primary = FALSE WHERE beach_id = $1', [beachId]);
    await db.query(
      'UPDATE beach_images SET is_primary = TRUE WHERE id = $1 AND beach_id = $2',
      [imageId, beachId]
    );

    const { rows: primaryRows } = await db.query(
      'SELECT image_path FROM beach_images WHERE id = $1 AND beach_id = $2',
      [imageId, beachId]
    );

    if (primaryRows.length > 0) {
      await db.query('UPDATE beaches SET image = $1 WHERE id = $2', [primaryRows[0].image_path, beachId]);
    }

    res.json({ message: 'Primary image updated' });
  } catch (err) {
    console.error('Set primary image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/beaches/:id
// @desc    Delete beach and all images
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Delete image files
    const { rows: images } = await client.query(
      'SELECT image_path FROM beach_images WHERE beach_id = $1',
      [req.params.id]
    );

    for (const img of images) {
      if (img.image_path && img.image_path.includes('cloudinary')) {
        try {
          const urlParts = img.image_path.split('/');
          const uploadIndex = urlParts.findIndex(p => p === 'upload');
          if (uploadIndex !== -1) {
            const publicIdParts = urlParts.slice(uploadIndex + 2);
            const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.warn('Could not delete from Cloudinary:', img.image_path, err.message);
        }
      } else {
        try {
          const filePath = path.join(__dirname, '../..', img.image_path.replace(/^\//, ''));
          await fs.unlink(filePath);
        } catch (err) {
          console.warn('Could not delete file:', img.image_path, err.message);
        }
      }
    }

    await client.query('DELETE FROM beaches WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');

    res.json({ message: 'Beach deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete beach error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
