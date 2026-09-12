const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { sendEmail, getLogoDataUri } = require('../utils/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

const toBool = (val) => val === 'true' || val === true;

// All routes require beach owner authentication
router.use(authMiddleware);

// @route   GET /api/owner/dashboard
// @desc    Get dashboard stats for beach owner's beach
// @access  Private (Owner)
router.get('/dashboard', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows: beachRows } = await db.query('SELECT * FROM beaches WHERE id = $1', [beachId]);
    const { rows: reviewRows } = await db.query('SELECT COUNT(*) as totalReviews FROM reviews WHERE beach_id = $1', [beachId]);
    const { rows: bookingRows } = await db.query('SELECT COUNT(*) as totalBookings FROM bookings WHERE beach_id = $1', [beachId]);
    const { rows: pendingRows } = await db.query("SELECT COUNT(*) as pendingBookings FROM bookings WHERE beach_id = $1 AND status = 'pending'", [beachId]);
    const { rows: confirmedRows } = await db.query("SELECT COUNT(*) as confirmedBookings FROM bookings WHERE beach_id = $1 AND status = 'confirmed'", [beachId]);
    const { rows: todayRows } = await db.query('SELECT COUNT(*) as todayBookings FROM bookings WHERE beach_id = $1 AND visit_date = CURRENT_DATE', [beachId]);
    const { rows: weekRows } = await db.query("SELECT COUNT(*) as weekBookings FROM bookings WHERE beach_id = $1 AND visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'", [beachId]);
    const { rows: guestsRows } = await db.query("SELECT COALESCE(SUM(people), 0) as totalGuests FROM bookings WHERE beach_id = $1 AND status = 'confirmed'", [beachId]);

    res.json({
      beach: beachRows[0],
      totalReviews: parseInt(reviewRows[0].totalreviews),
      totalBookings: parseInt(bookingRows[0].totalbookings),
      pendingBookings: parseInt(pendingRows[0].pendingbookings),
      confirmedBookings: parseInt(confirmedRows[0].confirmedbookings),
      todayBookings: parseInt(todayRows[0].todaybookings),
      weekBookings: parseInt(weekRows[0].weekbookings),
      totalGuests: parseInt(guestsRows[0].totalguests)
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/bookings
// @desc    Get bookings for owner's beach
// @access  Private (Owner)
router.get('/bookings', async (req, res) => {
  try {
    const beachId = req.beachId;
    console.log('Owner bookings request - beachId:', beachId, 'owner:', req.owner?.username);
    
    if (!beachId) {
      console.log('No beachId found in request');
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { status, search, sort } = req.query;

    let sql = `
      SELECT bk.*, b.name as beach_name, b.location as beach_location,
        c.name as cottage_name, c.price as cottage_price,
        r.name as room_name, r.price as room_price
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
      LEFT JOIN cottages c ON bk.cottage_id = c.id
      LEFT JOIN rooms r ON bk.room_id = r.id
      WHERE bk.beach_id = $1
    `;
    const params = [beachId];
    let paramIdx = 2;

    if (status && status !== 'all') {
      sql += ` AND bk.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (search) {
      sql += ` AND (bk.full_name ILIKE $${paramIdx} OR bk.email ILIKE $${paramIdx} OR bk.booking_ref ILIKE $${paramIdx} OR bk.phone ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    switch (sort) {
      case 'date_asc':
        sql += ' ORDER BY bk.visit_date ASC';
        break;
      case 'date_desc':
        sql += ' ORDER BY bk.visit_date DESC';
        break;
      case 'name':
        sql += ' ORDER BY bk.full_name ASC';
        break;
      default:
        sql += ' ORDER BY bk.created_at DESC';
    }

    const { rows } = await db.query(sql, params);
    console.log('Owner bookings found:', rows.length, 'bookings for beach', beachId);
    res.json(rows);
  } catch (err) {
    console.error('Owner bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/owner/bookings/:id/status
// @desc    Update booking status (owner)
// @access  Private (Owner)
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify booking belongs to owner's beach
    const { rows: checkRows } = await db.query('SELECT * FROM bookings WHERE id = $1 AND beach_id = $2', [req.params.id, beachId]);
    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);

    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name FROM bookings bk LEFT JOIN beaches b ON bk.beach_id = b.id WHERE bk.id = $1`,
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Owner update booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/owner/bookings/:id
// @desc    Delete booking (owner)
// @access  Private (Owner)
router.delete('/bookings/:id', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows: checkRows } = await db.query('SELECT * FROM bookings WHERE id = $1 AND beach_id = $2', [req.params.id, beachId]);
    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await db.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Owner delete booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/reviews
// @desc    Get reviews for owner's beach
// @access  Private (Owner)
router.get('/reviews', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows } = await db.query(`
      SELECT r.*, b.name as beach_name
      FROM reviews r
      LEFT JOIN beaches b ON r.beach_id = b.id
      WHERE r.beach_id = $1
      ORDER BY r.created_at DESC
    `, [beachId]);
    res.json(rows);
  } catch (err) {
    console.error('Owner reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/owner/reviews/:id
// @desc    Delete review (owner)
// @access  Private (Owner)
router.delete('/reviews/:id', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows: checkRows } = await db.query('SELECT * FROM reviews WHERE id = $1 AND beach_id = $2', [req.params.id, beachId]);
    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const beach_id = checkRows[0].beach_id;
    await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);

    // Update beach rating
    await db.query(`
      UPDATE beaches
      SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE beach_id = $1),
          rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE beach_id = $1), 0)
      WHERE id = $1
    `, [beach_id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Owner delete review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/beach
// @desc    Get owner's beach details
// @access  Private (Owner)
router.get('/beach', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows } = await db.query('SELECT * FROM beaches WHERE id = $1', [beachId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Beach not found' });
    }

    const { rows: imageRows } = await db.query(
      'SELECT * FROM beach_images WHERE beach_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [beachId]
    );

    const beach = rows[0];
    beach.images = imageRows;
    res.json(beach);
  } catch (err) {
    console.error('Owner get beach error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/recent-bookings
// @desc    Get recent bookings for owner's beach
// @access  Private (Owner)
router.get('/recent-bookings', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows } = await db.query(`
      SELECT bk.*, b.name as beach_name
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
      WHERE bk.beach_id = $1
      ORDER BY bk.created_at DESC
      LIMIT 5
    `, [beachId]);
    res.json(rows);
  } catch (err) {
    console.error('Owner recent bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/booking-trend
// @desc    Get booking trend for last 7 days
// @access  Private (Owner)
router.get('/booking-trend', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows } = await db.query(`
      SELECT visit_date as date, COUNT(*) as count
      FROM bookings
      WHERE beach_id = $1 AND visit_date BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE
      GROUP BY visit_date
      ORDER BY date ASC
    `, [beachId]);

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const found = rows.find(r => {
        const rowDate = new Date(r.date).toISOString().split('T')[0];
        return rowDate === dateStr;
      });
      trend.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: found ? parseInt(found.count) : 0
      });
    }

    res.json(trend);
  } catch (err) {
    console.error('Owner booking trend error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// REPORTS (filtered by owner's beach_id)
// ═══════════════════════════════════════════════════════════

// @route   GET /api/owner/reports/summary
// @desc    Get summary report for owner's beach
// @access  Private (Owner)
router.get('/reports/summary', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { from_date, to_date } = req.query;

    let dateCondition = '';
    let reviewCondition = '';
    let params = [];
    let paramIdx = 1;

    if (from_date && to_date) {
      dateCondition = `AND visit_date BETWEEN $${paramIdx} AND $${paramIdx + 1}`;
      reviewCondition = `AND created_at BETWEEN $${paramIdx} AND $${paramIdx + 1}`;
      params = [from_date, to_date];
      paramIdx += 2;
    }

    const { rows: reviewRows } = await db.query(
      `SELECT COUNT(*) as totalReviews FROM reviews WHERE beach_id = $1 ${reviewCondition}`,
      [beachId, ...params]
    );
    const { rows: bookingRows } = await db.query(
      `SELECT COUNT(*) as totalBookings FROM bookings WHERE beach_id = $1 ${dateCondition}`,
      [beachId, ...params]
    );
    const { rows: confirmedRows } = await db.query(
      `SELECT COUNT(*) as confirmedBookings FROM bookings WHERE beach_id = $1 ${dateCondition} AND status = 'confirmed'`,
      [beachId, ...params]
    );
    const { rows: pendingRows } = await db.query(
      `SELECT COUNT(*) as pendingBookings FROM bookings WHERE beach_id = $1 ${dateCondition} AND status = 'pending'`,
      [beachId, ...params]
    );
    const { rows: cancelledRows } = await db.query(
      `SELECT COUNT(*) as cancelledBookings FROM bookings WHERE beach_id = $1 ${dateCondition} AND status = 'cancelled'`,
      [beachId, ...params]
    );
    const { rows: guestsRows } = await db.query(
      `SELECT COALESCE(SUM(people), 0) as totalGuests FROM bookings WHERE beach_id = $1 ${dateCondition} AND status = 'confirmed'`,
      [beachId, ...params]
    );
    const { rows: avgRows } = await db.query(
      `SELECT AVG(rating) as avgRating FROM reviews WHERE beach_id = $1 ${reviewCondition}`,
      [beachId, ...params]
    );
    const { rows: beachRows } = await db.query('SELECT name, location, price FROM beaches WHERE id = $1', [beachId]);

    res.json({
      beach: beachRows[0] || null,
      totalReviews: parseInt(reviewRows[0].totalreviews),
      totalBookings: parseInt(bookingRows[0].totalbookings),
      confirmedBookings: parseInt(confirmedRows[0].confirmedbookings),
      pendingBookings: parseInt(pendingRows[0].pendingbookings),
      cancelledBookings: parseInt(cancelledRows[0].cancelledbookings),
      totalGuests: parseInt(guestsRows[0].totalguests) || 0,
      avgRating: avgRows[0].avgrating ? parseFloat(avgRows[0].avgrating).toFixed(1) : 0,
      dateRange: from_date && to_date ? { from: from_date, to: to_date } : null
    });
  } catch (err) {
    console.error('Owner summary report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/reports/bookings
// @desc    Get detailed bookings report for owner's beach
// @access  Private (Owner)
router.get('/reports/bookings', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { from_date, to_date, status } = req.query;

    let conditions = [`bk.beach_id = $1`];
    let params = [beachId];
    let paramIdx = 2;

    if (from_date && to_date) {
      conditions.push(`bk.visit_date BETWEEN $${paramIdx} AND $${paramIdx + 1}`);
      params.push(from_date, to_date);
      paramIdx += 2;
    }
    if (status) {
      conditions.push(`bk.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const { rows: bookings } = await db.query(`
      SELECT bk.*, b.name as beach_name
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
      ${whereClause}
      ORDER BY bk.visit_date DESC
    `, params);

    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalGuests: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.people, 0)
    };

    res.json({ bookings, stats });
  } catch (err) {
    console.error('Owner bookings report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/reports/monthly
// @desc    Get monthly booking statistics for owner's beach
// @access  Private (Owner)
router.get('/reports/monthly', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { year } = req.query;
    const selectedYear = year || new Date().getFullYear();

    const { rows: monthly } = await db.query(`
      SELECT
        EXTRACT(MONTH FROM visit_date) as month,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN people ELSE 0 END), 0) as total_guests
      FROM bookings
      WHERE beach_id = $1 AND EXTRACT(YEAR FROM visit_date) = $2
      GROUP BY EXTRACT(MONTH FROM visit_date)
      ORDER BY month ASC
    `, [beachId, selectedYear]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = months.map((name, index) => {
      const found = monthly.find(m => parseInt(m.month) === index + 1);
      return {
        month: index + 1,
        name,
        total_bookings: found ? parseInt(found.total_bookings) : 0,
        confirmed: found ? parseInt(found.confirmed) : 0,
        pending: found ? parseInt(found.pending) : 0,
        cancelled: found ? parseInt(found.cancelled) : 0,
        total_guests: found ? parseInt(found.total_guests) : 0
      };
    });

    res.json({ year: parseInt(selectedYear), beach_id: beachId, data: result });
  } catch (err) {
    console.error('Owner monthly report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/owner/reports/reviews
// @desc    Get reviews report for owner's beach
// @access  Private (Owner)
router.get('/reports/reviews', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { from_date, to_date } = req.query;

    let dateFilter = '';
    let params = [beachId];

    if (from_date && to_date) {
      dateFilter = `AND r.created_at BETWEEN $2 AND $3`;
      params.push(from_date, `${to_date} 23:59:59`);
    }

    const { rows: reviews } = await db.query(`
      SELECT r.*, b.name as beach_name
      FROM reviews r
      LEFT JOIN beaches b ON r.beach_id = b.id
      WHERE r.beach_id = $1 ${dateFilter}
      ORDER BY r.created_at DESC
    `, params);

    const ratingDist = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    res.json({
      reviews,
      stats: {
        total: reviews.length,
        avgRating: reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length).toFixed(1)
          : 0,
        ratingDistribution: ratingDist
      }
    });
  } catch (err) {
    console.error('Owner reviews report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// BEACH EDIT (Owner can edit only their own beach)
// ═══════════════════════════════════════════════════════════

// @route   PUT /api/owner/beach
// @desc    Update owner's beach details + images
// @access  Private (Owner)
router.put('/beach', (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  const client = await db.connect();
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    await client.query('BEGIN');

    const {
      name, location, region,
      price, price_level, type, description,
      cottage_available, cottage_count, cottage_price,
      room_available, room_count, room_price,
      water_temp, weather_info,
      deletedImages, primaryImageId
    } = req.body;

    // Update beach details (only the owner's beach)
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
    console.error('Owner update beach error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// @route   POST /api/owner/bookings/:id/email
// @desc    Beach owner sends custom email to a booker
// @access  Private (Owner)
router.post('/bookings/:id/email', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Verify booking belongs to owner's beach - get beach image too
    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name, b.image as beach_image, b.location as beach_location
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       WHERE bk.id = $1 AND bk.beach_id = $2`,
      [req.params.id, beachId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = rows[0];
    const logo = getLogoDataUri();
    const beachImage = booking.beach_image || null;
    const clientUrl = process.env.CLIENT_URL || 'https://allenshores-client.vercel.app';
    const bookMoreLink = `${clientUrl}/beaches/${beachId}`;
    const editBookingLink = `${clientUrl}/beaches/${beachId}`;

    // Get owner info for the email signature
    const { rows: ownerRows } = await db.query(
      'SELECT username, email FROM beach_owners WHERE beach_id = $1',
      [beachId]
    );
    const owner = ownerRows[0];

    const visitDateFormatted = new Date(booking.visit_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    await sendEmail({
      to: booking.email,
      subject: `${subject} - ${booking.beach_name}`,
      text: `Hi ${booking.full_name},\n\n${message}\n\nBooking Reference: ${booking.booking_ref}\nBeach: ${booking.beach_name}\nVisit Date: ${visitDateFormatted}\n\nBook More: ${bookMoreLink}\nEdit Booking: ${editBookingLink}\n\nBest regards,\n${owner.username}\n${booking.beach_name}\nAllenShores PH`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Beach Banner with Logo -->
          <div style="position: relative; height: 200px; overflow: hidden;">
            ${beachImage
              ? `<img src="${beachImage}" alt="${booking.beach_name}" style="width: 100%; height: 100%; object-fit: cover;" />`
              : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);"></div>`
            }
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);"></div>
            <div style="position: absolute; bottom: 15px; left: 20px; right: 20px; display: flex; align-items: center; gap: 12px;">
              ${logo ? `<img src="${logo}" alt="AllenShores PH" width="40" height="40" style="border-radius: 10px; background: white; padding: 2px;" />` : ''}
              <div>
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${booking.beach_name}</h1>
                <p style="color: #e5e7eb; margin: 2px 0 0; font-size: 13px;">${booking.beach_location || ''}</p>
              </div>
            </div>
          </div>

          <!-- Email Body -->
          <div style="padding: 25px 30px;">
            <h2 style="color: #0f766e; margin: 0 0 15px; font-size: 20px;">${subject}</h2>
            <p style="color: #374151; margin: 0 0 15px;">Hi <strong>${booking.full_name}</strong>,</p>
            <div style="white-space: pre-line; background: #f0fdfa; padding: 18px; border-radius: 10px; border-left: 4px solid #0f766e; color: #1f2937; line-height: 1.6; font-size: 15px;">
              ${message.replace(/\n/g, '<br/>')}
            </div>

            <!-- Booking Info Card -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                <strong style="color: #374151;">Booking Reference:</strong> ${booking.booking_ref}
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                <strong style="color: #374151;">Beach:</strong> ${booking.beach_name}
              </p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #374151;">Visit Date:</strong> ${visitDateFormatted}
              </p>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 25px 0;">
              <a href="${bookMoreLink}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 0 5px; font-size: 14px;">
                📅 Book More
              </a>
              <a href="${editBookingLink}" style="display: inline-block; background: #ffffff; color: #0f766e; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 0 5px; border: 2px solid #0f766e; font-size: 14px;">
                ✏️ Edit Booking
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

            <!-- Signature -->
            <div style="text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,</p>
              <p style="margin: 5px 0 0; color: #1f2937; font-weight: 600; font-size: 15px;">${owner.username}</p>
              <p style="margin: 2px 0 0; color: #0f766e; font-size: 14px;">${booking.beach_name}</p>
              <p style="margin: 5px 0 0; color: #9ca3af; font-size: 12px;">AllenShores PH</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f3f4f6; padding: 15px 30px; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This email was sent from ${booking.beach_name} via AllenShores PH.<br/>
              © ${new Date().getFullYear()} AllenShores PH. All rights reserved.
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Email sent successfully to ' + booking.email });
  } catch (err) {
    console.error('Owner send email error:', err);
    res.status(500).json({ message: err.message || 'Failed to send email' });
  }
});

// ═══════════════════════════════════════════════════════════
// BEACH ADMIN ACCOUNTS - CRUD for sub-admin accounts
// ═══════════════════════════════════════════════════════════

// @route   GET /api/owner/admins
// @desc    Get all admin accounts for owner's beach
// @access  Private (Owner)
router.get('/admins', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { rows } = await db.query(`
      SELECT ba.id, ba.username, ba.full_name, ba.email, ba.role, ba.is_active, ba.created_at,
             b.name as beach_name
      FROM beach_admins ba
      LEFT JOIN beaches b ON ba.beach_id = b.id
      WHERE ba.beach_id = $1
      ORDER BY ba.created_at DESC
    `, [beachId]);

    res.json(rows);
  } catch (err) {
    console.error('Get beach admins error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/owner/admins
// @desc    Create a new admin account for owner's beach
// @access  Private (Owner)
router.post('/admins', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { username, password, full_name, email, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ message: 'Username, password, and full name are required' });
    }

    // Check if username already exists in beach_admins
    const { rows: existing } = await db.query(
      'SELECT id FROM beach_admins WHERE username = $1', [username]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Also check beach_owners to avoid conflicts
    const { rows: existingOwner } = await db.query(
      'SELECT id FROM beach_owners WHERE username = $1', [username]
    );
    if (existingOwner.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { rows } = await db.query(`
      INSERT INTO beach_admins (beach_id, username, password, full_name, email, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, full_name, email, role, is_active, created_at
    `, [beachId, username, hashedPassword, full_name, email || null, role || 'staff']);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create beach admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/owner/admins/:id
// @desc    Update an admin account
// @access  Private (Owner)
router.put('/admins/:id', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { id } = req.params;
    const { full_name, email, role, is_active, password } = req.body;

    // Verify the admin belongs to this owner's beach
    const { rows: check } = await db.query(
      'SELECT * FROM beach_admins WHERE id = $1 AND beach_id = $2', [id, beachId]
    );
    if (check.length === 0) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    if (password) {
      // Update with new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const { rows } = await db.query(`
        UPDATE beach_admins
        SET full_name = $1, email = $2, role = $3, is_active = $4, password = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND beach_id = $7
        RETURNING id, username, full_name, email, role, is_active, created_at
      `, [full_name, email || null, role || 'staff', is_active !== undefined ? is_active : true, hashedPassword, id, beachId]);
      res.json(rows[0]);
    } else {
      // Update without password
      const { rows } = await db.query(`
        UPDATE beach_admins
        SET full_name = $1, email = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND beach_id = $6
        RETURNING id, username, full_name, email, role, is_active, created_at
      `, [full_name, email || null, role || 'staff', is_active !== undefined ? is_active : true, id, beachId]);
      res.json(rows[0]);
    }
  } catch (err) {
    console.error('Update beach admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/owner/admins/:id
// @desc    Delete an admin account
// @access  Private (Owner)
router.delete('/admins/:id', async (req, res) => {
  try {
    const beachId = req.beachId;
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { id } = req.params;

    // Verify the admin belongs to this owner's beach
    const { rows: check } = await db.query(
      'SELECT * FROM beach_admins WHERE id = $1 AND beach_id = $2', [id, beachId]
    );
    if (check.length === 0) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    await db.query('DELETE FROM beach_admins WHERE id = $1 AND beach_id = $2', [id, beachId]);
    res.json({ message: 'Admin account deleted successfully' });
  } catch (err) {
    console.error('Delete beach admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
