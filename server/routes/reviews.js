const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { beach_id, sort } = req.query;

    let sql = `
      SELECT r.*, b.name as beach_name, b.location as beach_location
      FROM reviews r
      LEFT JOIN beaches b ON r.beach_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (beach_id) {
      sql += ` AND r.beach_id = $${paramIdx}`;
      params.push(beach_id);
      paramIdx++;
    }

    switch (sort) {
      case 'rating_high':
        sql += ' ORDER BY r.rating DESC';
        break;
      case 'rating_low':
        sql += ' ORDER BY r.rating ASC';
        break;
      default:
        sql += ' ORDER BY r.created_at DESC';
    }

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/beach/:beachId
// @desc    Get reviews for a specific beach
// @access  Public
router.get('/beach/:beachId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, b.name as beach_name
       FROM reviews r
       LEFT JOIN beaches b ON r.beach_id = b.id
       WHERE r.beach_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.beachId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get beach reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/recent
// @desc    Get recent reviews
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const { rows } = await db.query(
      `SELECT r.*, b.name as beach_name
       FROM reviews r
       LEFT JOIN beaches b ON r.beach_id = b.id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get recent reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create new review
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { beach_id, author, rating, comment } = req.body;

    if (!beach_id || !author || !rating) {
      return res.status(400).json({ message: 'Beach, author, and rating are required' });
    }

    const { rows } = await db.query(
      'INSERT INTO reviews (beach_id, author, rating, comment) VALUES ($1, $2, $3, $4) RETURNING id',
      [beach_id, author, rating, comment || '']
    );

    const reviewId = rows[0].id;

    // Update beach reviews count and average rating
    await db.query(`
      UPDATE beaches
      SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE beach_id = $1),
          rating = (SELECT AVG(rating) FROM reviews WHERE beach_id = $1)
      WHERE id = $1
    `, [beach_id]);

    const { rows: newReviewRows } = await db.query(
      `SELECT r.*, b.name as beach_name
       FROM reviews r
       LEFT JOIN beaches b ON r.beach_id = b.id
       WHERE r.id = $1`,
      [reviewId]
    );

    res.status(201).json(newReviewRows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Get beach_id before deleting
    const { rows: reviewRows } = await db.query('SELECT beach_id FROM reviews WHERE id = $1', [req.params.id]);

    if (reviewRows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const beach_id = reviewRows[0].beach_id;

    await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);

    // Update beach reviews count and average rating
    await db.query(`
      UPDATE beaches
      SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE beach_id = $1),
          rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE beach_id = $1), 0)
      WHERE id = $1
    `, [beach_id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
