const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/reports/summary
// @desc    Get overall summary report
// @access  Private (Admin)
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let reviewFilter = '';
    let bookingFilter = '';
    let reviewParams = [];
    let bookingParams = [];
    let paramIdx = 1;

    if (from_date && to_date) {
      reviewFilter = `WHERE created_at BETWEEN $1 AND $2`;
      bookingFilter = `WHERE visit_date BETWEEN $1 AND $2`;
      reviewParams = [from_date, `${to_date} 23:59:59`];
      bookingParams = [from_date, to_date];
    }

    // Total counts
    const { rows: beachRows } = await db.query('SELECT COUNT(*) as totalBeaches FROM beaches');
    const { rows: reviewRows } = await db.query(`SELECT COUNT(*) as totalReviews FROM reviews ${reviewFilter}`, reviewParams);
    const { rows: bookingRows } = await db.query(`SELECT COUNT(*) as totalBookings FROM bookings ${bookingFilter}`, bookingParams);

    // Booking stats by status
    let confirmedSql, pendingSql, cancelledSql, guestsSql;
    let confirmedParams, pendingParams, cancelledParams, guestsParams;

    if (from_date && to_date) {
      confirmedSql = `SELECT COUNT(*) as confirmedBookings FROM bookings WHERE visit_date BETWEEN $1 AND $2 AND status = 'confirmed'`;
      pendingSql = `SELECT COUNT(*) as pendingBookings FROM bookings WHERE visit_date BETWEEN $1 AND $2 AND status = 'pending'`;
      cancelledSql = `SELECT COUNT(*) as cancelledBookings FROM bookings WHERE visit_date BETWEEN $1 AND $2 AND status = 'cancelled'`;
      guestsSql = `SELECT COALESCE(SUM(people), 0) as totalGuests FROM bookings WHERE visit_date BETWEEN $1 AND $2 AND status = 'confirmed'`;
      confirmedParams = pendingParams = cancelledParams = guestsParams = [from_date, to_date];
    } else {
      confirmedSql = `SELECT COUNT(*) as confirmedBookings FROM bookings WHERE status = 'confirmed'`;
      pendingSql = `SELECT COUNT(*) as pendingBookings FROM bookings WHERE status = 'pending'`;
      cancelledSql = `SELECT COUNT(*) as cancelledBookings FROM bookings WHERE status = 'cancelled'`;
      guestsSql = `SELECT COALESCE(SUM(people), 0) as totalGuests FROM bookings WHERE status = 'confirmed'`;
      confirmedParams = pendingParams = cancelledParams = guestsParams = [];
    }

    const { rows: confirmedRows } = await db.query(confirmedSql, confirmedParams);
    const { rows: pendingRows } = await db.query(pendingSql, pendingParams);
    const { rows: cancelledRows } = await db.query(cancelledSql, cancelledParams);
    const { rows: guestsRows } = await db.query(guestsSql, guestsParams);

    // Average rating
    const { rows: avgRows } = await db.query('SELECT AVG(rating) as avgRating FROM reviews');

    res.json({
      totalBeaches: parseInt(beachRows[0].totalbeaches),
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
    console.error('Get summary report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/bookings
// @desc    Get detailed bookings report
// @access  Private (Admin)
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date, status } = req.query;

    let conditions = [];
    let params = [];
    let paramIdx = 1;

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

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows: bookings } = await db.query(`
      SELECT bk.*, b.name as beach_name
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
      ${whereClause}
      ORDER BY bk.visit_date DESC
    `, params);

    // Stats
    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalGuests: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.people, 0)
    };

    res.json({ bookings, stats });
  } catch (err) {
    console.error('Get bookings report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/beaches
// @desc    Get beach performance report
// @access  Private (Admin)
router.get('/beaches', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let bookingCondition = '';
    let params = [];

    if (from_date && to_date) {
      bookingCondition = `AND bk.visit_date BETWEEN $1 AND $2`;
      params = [from_date, to_date];
    }

    const { rows: beaches } = await db.query(`
      SELECT
        b.id,
        b.name,
        b.location,
        b.price,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT CASE WHEN bk.status = 'confirmed' ${bookingCondition} THEN bk.id END) as booking_count,
        COALESCE(SUM(CASE WHEN bk.status = 'confirmed' ${bookingCondition} THEN bk.people ELSE 0 END), 0) as total_guests
      FROM beaches b
      LEFT JOIN reviews r ON b.id = r.beach_id
      LEFT JOIN bookings bk ON b.id = bk.beach_id
      GROUP BY b.id, b.name, b.location, b.price
      ORDER BY booking_count DESC, avg_rating DESC
    `, params);

    res.json(beaches.map(beach => ({
      ...beach,
      avg_rating: parseFloat(beach.avg_rating).toFixed(1),
      booking_count: parseInt(beach.booking_count),
      total_guests: parseInt(beach.total_guests)
    })));
  } catch (err) {
    console.error('Get beaches report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/monthly
// @desc    Get monthly booking statistics
// @access  Private (Admin)
router.get('/monthly', authMiddleware, async (req, res) => {
  try {
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
      WHERE EXTRACT(YEAR FROM visit_date) = $1
      GROUP BY EXTRACT(MONTH FROM visit_date)
      ORDER BY month ASC
    `, [selectedYear]);

    // Fill in missing months
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

    res.json({ year: parseInt(selectedYear), data: result });
  } catch (err) {
    console.error('Get monthly report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/reviews
// @desc    Get reviews report
// @access  Private (Admin)
router.get('/reviews', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    let params = [];

    if (from_date && to_date) {
      dateFilter = `WHERE r.created_at BETWEEN $1 AND $2`;
      params = [from_date, `${to_date} 23:59:59`];
    }

    const { rows: reviews } = await db.query(`
      SELECT r.*, b.name as beach_name
      FROM reviews r
      LEFT JOIN beaches b ON r.beach_id = b.id
      ${dateFilter}
      ORDER BY r.created_at DESC
    `, params);

    // Rating distribution
    const ratingDist = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    res.json({
      reviews,
      stats: {
        total: reviews.length,
        avgRating: reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0,
        ratingDistribution: ratingDist
      }
    });
  } catch (err) {
    console.error('Get reviews report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
