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
const propertyRoutes = require('./routes/properties');

const app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://allenshores-client.vercel.app',
  'https://allenshoresph.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.use('/api/properties', propertyRoutes);

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
