const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const beachRoutes = require('./routes/beaches');
const reviewRoutes = require('./routes/reviews');
const bookingRoutes = require('./routes/bookings');
const bookmarkRoutes = require('./routes/bookmarks');
const adminRoutes = require('./routes/admins');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const ownerRoutes = require('./routes/owner');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (only in local dev; Vercel has no persistent FS)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/beaches', beachRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/owner', ownerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AllenShores API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🌊 AllenShores API Server               ║
  ║   Running on port ${PORT}                    ║
  ║   http://localhost:${PORT}                   ║
  ╚═══════════════════════════════════════════╝
  `);
  });
}

module.exports = app;
