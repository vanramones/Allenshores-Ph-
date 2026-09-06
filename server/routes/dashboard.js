const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Owner-protected beach IDs - excluded from Super Admin dashboard
const OWNER_BEACH_IDS = [2, 7, 11];

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Super Admin: exclude owner-managed beach bookings (2, 7, 11)
    const isAdmin = req.admin && req.admin.role === 'admin';
    const ob = isAdmin ? 'AND beach_id NOT IN (2, 7, 11)' : '';
    const obWhere = isAdmin ? 'WHERE beach_id NOT IN (2, 7, 11)' : '';

    const { rows: beachRows } = await db.query('SELECT COUNT(*) as totalBeaches FROM beaches');
    const { rows: reviewRows } = await db.query(`SELECT COUNT(*) as totalReviews FROM reviews ${obWhere}`);
    const { rows: bookingRows } = await db.query(`SELECT COUNT(*) as totalBookings FROM bookings ${obWhere}`);
    const { rows: avgRows } = await db.query('SELECT AVG(rating) as avgRating FROM beaches');
    const { rows: pendingRows } = await db.query(`SELECT COUNT(*) as pendingBookings FROM bookings WHERE status = 'pending' ${ob}`);
    const { rows: todayRows } = await db.query(`SELECT COUNT(*) as todayBookings FROM bookings WHERE visit_date = CURRENT_DATE ${ob}`);
    const { rows: yesterdayRows } = await db.query(`SELECT COUNT(*) as yesterdayBookings FROM bookings WHERE visit_date = CURRENT_DATE - INTERVAL '1 day' ${ob}`);
    const { rows: weekRows } = await db.query(`SELECT COUNT(*) as weekBookings FROM bookings WHERE visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' ${ob}`);
    const { rows: lastWeekRows } = await db.query(`SELECT COUNT(*) as lastWeekBookings FROM bookings WHERE visit_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '7 days' ${ob}`);
    const { rows: guestsRows } = await db.query(`SELECT COALESCE(SUM(people), 0) as totalGuestsWeek FROM bookings WHERE status = 'confirmed' AND visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' ${ob}`);
    const { rows: lastGuestsRows } = await db.query(`SELECT COALESCE(SUM(people), 0) as lastWeekGuests FROM bookings WHERE status = 'confirmed' AND visit_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '7 days' ${ob}`);
    const { rows: lastPendingRows } = await db.query(`SELECT COUNT(*) as lastWeekPending FROM bookings WHERE status = 'pending' AND visit_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '7 days' ${ob}`);

    res.json({
      totalBeaches: parseInt(beachRows[0].totalbeaches),
      totalReviews: parseInt(reviewRows[0].totalreviews),
      totalBookings: parseInt(bookingRows[0].totalbookings),
      avgRating: avgRows[0].avgrating ? parseFloat(avgRows[0].avgrating).toFixed(1) : 0,
      pendingBookings: parseInt(pendingRows[0].pendingbookings),
      todayBookings: parseInt(todayRows[0].todaybookings),
      yesterdayBookings: parseInt(yesterdayRows[0].yesterdaybookings),
      weekBookings: parseInt(weekRows[0].weekbookings),
      lastWeekBookings: parseInt(lastWeekRows[0].lastweekbookings),
      totalGuestsWeek: parseInt(guestsRows[0].totalguestsweek),
      lastWeekGuests: parseInt(lastGuestsRows[0].lastweekguests),
      lastWeekPending: parseInt(lastPendingRows[0].lastweekpending)
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-beaches
// @desc    Get recent beaches
// @access  Private (Admin)
router.get('/recent-beaches', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, rating, price FROM beaches ORDER BY created_at DESC LIMIT 5'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get recent beaches error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-reviews
// @desc    Get recent reviews
// @access  Private (Admin)
router.get('/recent-reviews', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, b.name as beach_name
       FROM reviews r
       LEFT JOIN beaches b ON r.beach_id = b.id
       ORDER BY r.created_at DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get recent reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-bookings
// @desc    Get recent bookings
// @access  Private (Admin)
router.get('/recent-bookings', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.admin && req.admin.role === 'admin';
    const obFilter = isAdmin ? 'WHERE bk.beach_id NOT IN (2, 7, 11)' : '';
    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       ${obFilter}
       ORDER BY bk.created_at DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get recent bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/booking-trend
// @desc    Get booking trend for last 7 days
// @access  Private (Admin)
router.get('/booking-trend', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.admin && req.admin.role === 'admin';
    const obFilter = isAdmin ? 'AND beach_id NOT IN (2, 7, 11)' : '';
    const { rows } = await db.query(`
      SELECT visit_date as date, COUNT(*) as count
      FROM bookings
      WHERE visit_date BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE
      ${obFilter}
      GROUP BY visit_date
      ORDER BY date ASC
    `);

    // Fill in missing dates with 0
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
    console.error('Get booking trend error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Get recent activity feed
// @access  Private (Admin)
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.admin && req.admin.role === 'admin';
    const obFilter = isAdmin ? 'WHERE bk.beach_id NOT IN (2, 7, 11)' : '';
    const obReviewFilter = isAdmin ? 'WHERE r.beach_id NOT IN (2, 7, 11)' : '';

    // Get recent bookings
    const { rows: bookings } = await db.query(`
      SELECT 'booking' as type, bk.id, full_name as who, booking_ref as ref, status, visit_date as date, created_at
      FROM bookings bk
      ${obFilter}
      ORDER BY created_at DESC
      LIMIT 4
    `);

    // Get recent reviews
    const { rows: reviews } = await db.query(`
      SELECT 'review' as type, r.id, r.author as who, r.rating, r.created_at, b.name as beach_name
      FROM reviews r
      LEFT JOIN beaches b ON r.beach_id = b.id
      ${obReviewFilter}
      ORDER BY r.created_at DESC
      LIMIT 4
    `);

    // Combine and sort by created_at
    const activity = [...bookings, ...reviews]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    res.json(activity);
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
