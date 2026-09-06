const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { sendEmail, getLogoDataUri } = require('../utils/email');

// Generate booking reference
const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BK-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

// @route   GET /api/bookings
// @desc    Get all bookings (Admin)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search, from_date, to_date, sort } = req.query;

    let sql = `
      SELECT bk.*, b.name as beach_name, b.location as beach_location
      FROM bookings bk
      LEFT JOIN beaches b ON bk.beach_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

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

    if (from_date) {
      sql += ` AND bk.visit_date >= $${paramIdx}`;
      params.push(from_date);
      paramIdx++;
    }

    if (to_date) {
      sql += ` AND bk.visit_date <= $${paramIdx}`;
      params.push(to_date);
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
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/stats
// @desc    Get booking statistics
// @access  Private (Admin)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { rows: totalRows } = await db.query('SELECT COUNT(*) as total FROM bookings');
    const { rows: pendingRows } = await db.query("SELECT COUNT(*) as pending FROM bookings WHERE status = 'pending'");
    const { rows: confirmedRows } = await db.query("SELECT COUNT(*) as confirmed FROM bookings WHERE status = 'confirmed'");
    const { rows: cancelledRows } = await db.query("SELECT COUNT(*) as cancelled FROM bookings WHERE status = 'cancelled'");
    const { rows: todayRows } = await db.query('SELECT COUNT(*) as todayBookings FROM bookings WHERE visit_date = CURRENT_DATE');
    const { rows: weekRows } = await db.query('SELECT COUNT(*) as weekBookings FROM bookings WHERE visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\'');

    res.json({
      total: parseInt(totalRows[0].total),
      pending: parseInt(pendingRows[0].pending),
      confirmed: parseInt(confirmedRows[0].confirmed),
      cancelled: parseInt(cancelledRows[0].cancelled),
      todayBookings: parseInt(todayRows[0].todaybookings),
      weekBookings: parseInt(weekRows[0].weekbookings)
    });
  } catch (err) {
    console.error('Get booking stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/recent
// @desc    Get recent bookings
// @access  Private (Admin)
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       ORDER BY bk.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get recent bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private (Admin)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name, b.location as beach_location, b.price as beach_price
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       WHERE bk.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      beach_id, full_name, email, phone, nationality,
      visit_date, people, visit_type, activity_pref, notes
    } = req.body;

    if (!beach_id || !full_name || !email || !visit_date || !people) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const booking_ref = generateBookingRef();

    const { rows } = await db.query(
      `INSERT INTO bookings
       (booking_ref, beach_id, full_name, email, phone, nationality, visit_date, people, visit_type, activity_pref, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING id`,
      [booking_ref, beach_id, full_name, email, phone || '', nationality || '', visit_date, people, visit_type || 'day_trip', activity_pref || '', notes || '']
    );

    const { rows: newBookingRows } = await db.query(
      `SELECT bk.*, b.name as beach_name
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       WHERE bk.id = $1`,
      [rows[0].id]
    );

    const newBooking = newBookingRows[0];
    const logo = getLogoDataUri();

    // Send email notification to the beach owner (if the beach has an owner account)
    try {
      const { rows: ownerRows } = await db.query(
        `SELECT bo.email, bo.username FROM beach_owners bo WHERE bo.beach_id = $1`,
        [beach_id]
      );

      if (ownerRows.length > 0 && ownerRows[0].email) {
        const owner = ownerRows[0];
        await sendEmail({
          to: owner.email,
          subject: `New Booking Received - ${newBooking.booking_ref} - ${newBooking.beach_name}`,
          text: `Hi ${owner.username},\n\nA new booking has been made for your beach.\n\nGuest: ${newBooking.full_name}\nEmail: ${newBooking.email}\nPhone: ${newBooking.phone}\nVisit Date: ${newBooking.visit_date}\nNumber of People: ${newBooking.people}\nReference: ${newBooking.booking_ref}\n\nPlease log in to your owner dashboard to accept or manage this booking.\n\nAllenShores PH`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #d1fae5; margin-bottom: 20px;">
                ${logo ? `<img src="${logo}" alt="AllenShores PH" width="48" height="48" style="border-radius: 12px;" />` : ''}
                <h1 style="color: #0f766e; margin: 10px 0 0; font-size: 24px;">AllenShores PH - Beach Owner Notification</h1>
              </div>
              <h2 style="color: #0f766e;">New Booking Received!</h2>
              <p>Hi <strong>${owner.username}</strong>,</p>
              <p>A new booking has been made for <strong>${newBooking.beach_name}</strong>.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Reference</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.booking_ref}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Guest Name</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.full_name}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.email}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Phone</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.phone || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Visit Date</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.visit_date}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Number of People</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${newBooking.people}</td></tr>
              </table>
              <p style="background: #d1fae5; padding: 12px; border-radius: 8px; color: #065f46;">
                Please log in to your <a href="https://allenshores-client.vercel.app/admin/login" style="color: #0f766e; font-weight: bold;">Owner Dashboard</a> to accept or manage this booking.
              </p>
              <p>AllenShores PH</p>
            </div>
          `
        });
        console.log(`Owner notification email sent to ${owner.email} for booking ${newBooking.booking_ref}`);
      }
    } catch (emailErr) {
      console.error('Failed to send owner notification email:', emailErr.message);
    }

    res.status(201).json(newBooking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin) - DISABLED: Only beach owners can manage their bookings
router.put('/:id/status', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Booking management is now handled by beach owners. Admin can only view bookings.' });
});

// @route   POST /api/bookings/:id/email
// @desc    Send custom email to customer
// @access  Private (Admin) - DISABLED: Only beach owners can email their guests
router.post('/:id/email', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Email to guests is now handled by beach owners. Admin can only view bookings.' });
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private (Admin) - DISABLED: Only beach owners can delete their bookings
router.delete('/:id', authMiddleware, async (req, res) => {
  return res.status(403).json({ message: 'Booking deletion is now handled by beach owners. Admin can only view bookings.' });
});

module.exports = router;
