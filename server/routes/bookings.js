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

    res.status(201).json(newBookingRows[0]);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);

    const { rows: updatedBookingRows } = await db.query(
      `SELECT bk.*, b.name as beach_name
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       WHERE bk.id = $1`,
      [req.params.id]
    );

    const booking = updatedBookingRows[0];
    const logo = getLogoDataUri();

    // Send email notification for confirmed/cancelled bookings
    try {
      if (status === 'confirmed') {
        await sendEmail({
          to: booking.email,
          subject: `Booking Confirmed - ${booking.booking_ref}`,
          text: `Hi ${booking.full_name},\n\nYour booking at ${booking.beach_name} on ${booking.visit_date} for ${booking.people} guest(s) has been CONFIRMED.\n\nReference: ${booking.booking_ref}\n\nThank you!\nAllenShores PH`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e0f2fe; margin-bottom: 20px;">
                ${logo ? `<img src="${logo}" alt="AllenShores PH" width="48" height="48" style="border-radius: 12px;" />` : ''}
                <h1 style="color: #0077b6; margin: 10px 0 0; font-size: 24px;">AllenShores PH</h1>
              </div>
              <h2 style="color: #0077b6;">Booking Confirmed</h2>
              <p>Hi <strong>${booking.full_name}</strong>,</p>
              <p>Your booking at <strong>${booking.beach_name}</strong> has been <span style="color: green;"><strong>CONFIRMED</strong></span>.</p>
              <ul>
                <li><strong>Reference:</strong> ${booking.booking_ref}</li>
                <li><strong>Visit Date:</strong> ${booking.visit_date}</li>
                <li><strong>Guests:</strong> ${booking.people}</li>
              </ul>
              <p>Thank you!<br/>AllenShores PH</p>
            </div>
          `
        });
      } else if (status === 'cancelled') {
        await sendEmail({
          to: booking.email,
          subject: `Booking Cancelled - ${booking.booking_ref}`,
          text: `Hi ${booking.full_name},\n\nWe regret to inform you that your booking at ${booking.beach_name} on ${booking.visit_date} has been CANCELLED.\n\nReference: ${booking.booking_ref}\n\nFor inquiries, please contact us.\nAllenShores PH`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e0f2fe; margin-bottom: 20px;">
                ${logo ? `<img src="${logo}" alt="AllenShores PH" width="48" height="48" style="border-radius: 12px;" />` : ''}
                <h1 style="color: #0077b6; margin: 10px 0 0; font-size: 24px;">AllenShores PH</h1>
              </div>
              <h2 style="color: #dc2626;">Booking Cancelled</h2>
              <p>Hi <strong>${booking.full_name}</strong>,</p>
              <p>We regret to inform you that your booking at <strong>${booking.beach_name}</strong> has been <span style="color: red;"><strong>CANCELLED</strong></span>.</p>
              <ul>
                <li><strong>Reference:</strong> ${booking.booking_ref}</li>
                <li><strong>Visit Date:</strong> ${booking.visit_date}</li>
              </ul>
              <p>For inquiries, please contact us.<br/>AllenShores PH</p>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Failed to send booking email:', emailErr.message);
    }

    res.json(booking);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/email
// @desc    Send custom email to customer
// @access  Private (Admin)
router.post('/:id/email', authMiddleware, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const { rows } = await db.query(
      `SELECT bk.*, b.name as beach_name
       FROM bookings bk
       LEFT JOIN beaches b ON bk.beach_id = b.id
       WHERE bk.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = rows[0];
    const logo = getLogoDataUri();

    await sendEmail({
      to: booking.email,
      subject,
      text: `Hi ${booking.full_name},\n\n${message}\n\nBooking Reference: ${booking.booking_ref}\nBeach: ${booking.beach_name}\nVisit Date: ${booking.visit_date}\n\nAllenShores PH`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e0f2fe; margin-bottom: 20px;">
            ${logo ? `<img src="${logo}" alt="AllenShores PH" width="48" height="48" style="border-radius: 12px;" />` : ''}
            <h1 style="color: #0077b6; margin: 10px 0 0; font-size: 24px;">AllenShores PH</h1>
          </div>
          <h2 style="color: #0077b6;">${subject}</h2>
          <p>Hi <strong>${booking.full_name}</strong>,</p>
          <p style="white-space: pre-line;">${message.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 0.9rem; color: #6b7280;">
            <strong>Booking Reference:</strong> ${booking.booking_ref}<br/>
            <strong>Beach:</strong> ${booking.beach_name}<br/>
            <strong>Visit Date:</strong> ${booking.visit_date}
          </p>
          <p>AllenShores PH</p>
        </div>
      `
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Send booking email error:', err);
    res.status(500).json({ message: err.message || 'Failed to send email' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
