const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

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
    if (!beachId) {
      return res.status(403).json({ message: 'Beach owner access required' });
    }

    const { status, search, sort } = req.query;

    let sql = `
      SELECT bk.*, b.name as beach_name, b.location as beach_location
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
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
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
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

module.exports = router;
