const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const { rows } = await db.query('SELECT * FROM admin_users WHERE username = $1', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/owner-login
// @desc    Beach owner login
// @access  Public
router.post('/owner-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const { rows } = await db.query(`
      SELECT bo.*, b.name as beach_name, b.location as beach_location
      FROM beach_owners bo
      JOIN beaches b ON bo.beach_id = b.id
      WHERE bo.username = $1
    `, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid owner credentials' });
    }

    const owner = rows[0];
    const isMatch = await bcrypt.compare(password, owner.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid owner credentials' });
    }

    const token = jwt.sign(
      { id: owner.id, username: owner.username, beach_id: owner.beach_id, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      owner: {
        id: owner.id,
        username: owner.username,
        beach_id: owner.beach_id,
        beach_name: owner.beach_name,
        beach_location: owner.beach_location,
        role: 'owner'
      }
    });
  } catch (err) {
    console.error('Owner login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify token (admin or owner)
// @access  Private
router.get('/verify', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, admin: decoded });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

// @route   GET /api/auth/owner-beaches
// @desc    Get list of beaches that have owner accounts (for login page)
// @access  Public
router.get('/owner-beaches', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT b.id, b.name, b.location
      FROM beach_owners bo
      JOIN beaches b ON bo.beach_id = b.id
      ORDER BY b.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get owner beaches error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
