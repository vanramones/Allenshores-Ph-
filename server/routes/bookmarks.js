const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/bookmarks
// @desc    Get all bookmarks for a session
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.json([]);
    }

    const { rows } = await db.query(
      `SELECT bm.*, b.name, b.location, b.rating, b.price, b.price_level, b.type, b.image
       FROM bookmarks bm
       LEFT JOIN beaches b ON bm.beach_id = b.id
       WHERE bm.session_id = $1
       ORDER BY bm.created_at DESC`,
      [sessionId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookmarks/check/:beachId
// @desc    Check if beach is bookmarked
// @access  Public
router.get('/check/:beachId', async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.json({ bookmarked: false });
    }

    const { rows } = await db.query(
      'SELECT id FROM bookmarks WHERE beach_id = $1 AND session_id = $2',
      [req.params.beachId, sessionId]
    );

    res.json({ bookmarked: rows.length > 0 });
  } catch (err) {
    console.error('Check bookmark error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookmarks/toggle
// @desc    Toggle bookmark for a beach
// @access  Public
router.post('/toggle', async (req, res) => {
  try {
    const { beach_id, session_id } = req.body;

    if (!beach_id || !session_id) {
      return res.status(400).json({ message: 'Beach ID and session ID are required' });
    }

    // Check if already bookmarked
    const { rows: existing } = await db.query(
      'SELECT id FROM bookmarks WHERE beach_id = $1 AND session_id = $2',
      [beach_id, session_id]
    );

    if (existing.length > 0) {
      // Remove bookmark
      await db.query('DELETE FROM bookmarks WHERE beach_id = $1 AND session_id = $2', [beach_id, session_id]);
      res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      // Add bookmark
      await db.query('INSERT INTO bookmarks (beach_id, session_id) VALUES ($1, $2)', [beach_id, session_id]);
      res.json({ bookmarked: true, message: 'Beach bookmarked' });
    }
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bookmarks/:beachId
// @desc    Remove bookmark
// @access  Public
router.delete('/:beachId', async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    await db.query('DELETE FROM bookmarks WHERE beach_id = $1 AND session_id = $2', [req.params.beachId, sessionId]);
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    console.error('Remove bookmark error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
