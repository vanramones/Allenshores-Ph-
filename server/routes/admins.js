const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   GET /api/admins
// @desc    Get all admin users
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, created_at FROM admin_users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admins/:id
// @desc    Get single admin
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, created_at FROM admin_users WHERE id = $1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admins
// @desc    Create new admin
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username exists
    const { rows: existing } = await db.query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { rows } = await db.query(
      'INSERT INTO admin_users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    res.status(201).json({
      id: rows[0].id,
      username,
      message: 'Admin created successfully'
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admins/:id
// @desc    Update admin
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username exists for another user
    const { rows: existing } = await db.query(
      'SELECT id FROM admin_users WHERE username = $1 AND id != $2',
      [username, req.params.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (password) {
      // Update with new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await db.query(
        'UPDATE admin_users SET username = $1, password = $2 WHERE id = $3',
        [username, hashedPassword, req.params.id]
      );
    } else {
      // Update username only
      await db.query(
        'UPDATE admin_users SET username = $1 WHERE id = $2',
        [username, req.params.id]
      );
    }

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admins/:id
// @desc    Delete admin
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Prevent deleting the last admin
    const { rows } = await db.query('SELECT COUNT(*) as count FROM admin_users');
    const count = parseInt(rows[0].count);
    if (count <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin' });
    }

    await db.query('DELETE FROM admin_users WHERE id = $1', [req.params.id]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
