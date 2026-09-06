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

module.exports = router;
