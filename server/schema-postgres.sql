-- AllenShores PH - PostgreSQL Schema (for Supabase)
-- Run this in Supabase SQL Editor

-- Enable extension for UUID (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables (order matters for foreign keys)

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beaches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  region VARCHAR(100) DEFAULT 'Allen',
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  price VARCHAR(50) DEFAULT '0',
  price_level VARCHAR(20) DEFAULT 'Budget' CHECK (price_level IN ('Budget','Moderate','Premium')),
  type VARCHAR(100) DEFAULT 'Beach',
  image VARCHAR(500),
  description TEXT,
  cottage_available BOOLEAN DEFAULT FALSE,
  cottage_count INTEGER DEFAULT 0,
  cottage_price VARCHAR(50) DEFAULT '0',
  room_available BOOLEAN DEFAULT FALSE,
  room_count INTEGER DEFAULT 0,
  room_price VARCHAR(50) DEFAULT '0',
  water_temp VARCHAR(20),
  weather_info VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beach_images (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_beach_images_beach_id ON beach_images(beach_id);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  beach_id INTEGER REFERENCES beaches(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  nationality VARCHAR(100),
  visit_date DATE NOT NULL,
  people INTEGER DEFAULT 1,
  visit_type VARCHAR(50) DEFAULT 'day_trip',
  activity_pref VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookings_beach_id ON bookings(beach_id);

CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER REFERENCES beaches(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(beach_id, session_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER REFERENCES beaches(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_beach_id ON reviews(beach_id);

-- =============================================
-- Seed Data
-- =============================================

-- Admin users (passwords are bcrypt hashes from the original MySQL dump)
INSERT INTO admin_users (id, username, password, created_at) VALUES
  (1, 'admin', '$2a$10$66bGFm2r8ieTG5vcvPUq7OU/LEs3OWIKszEJwYSzYao9YLdWTjK4e', '2026-09-02 15:47:36'),
  (2, 'van', '$2a$10$HYOA02ttav//0uiLfOsZlOlaOidcpOt5VRHvs6QOOZMZXTqq0C702', '2026-09-02 16:21:34')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));

-- Beaches
INSERT INTO beaches (id, name, location, region, rating, reviews_count, price, price_level, type, image, description, cottage_available, cottage_count, cottage_price, room_available, room_count, room_price, water_temp, weather_info, created_at) VALUES
  (2, 'Sunrise Beach Resort', 'Brgy. Sabang, Allen', 'Allen', 4.50, 18, '200', 'Moderate', 'Resort', '/uploads/beaches/beach_1788410013333_713.jpg', 'Perfect spot for watching the sunrise with resort amenities.', FALSE, 0, '0', FALSE, 0, '0', NULL, NULL, '2026-09-02 15:47:36'),
  (7, 'Caba Villa Diaz Beach', 'Brgy. Caba, Allen', 'Allen', 4.80, 25, '150', 'Budget', 'White Sand', NULL, 'A beautiful white sand beach with crystal clear waters.', FALSE, 0, '0', FALSE, 0, '0', NULL, NULL, '2026-09-03 04:32:27'),
  (9, 'Paradise Cove', 'Brgy. Jubasan, Allen', 'Allen', 5.00, 1, '100', 'Budget', 'Cove', NULL, 'A hidden cove with calm waters, perfect for swimming.', FALSE, 0, '0', FALSE, 0, '0', NULL, NULL, '2026-09-03 04:32:27')
ON CONFLICT (id) DO NOTHING;

SELECT setval('beaches_id_seq', (SELECT MAX(id) FROM beaches));

-- Beach images
INSERT INTO beach_images (id, beach_id, image_path, is_primary, created_at) VALUES
  (1, 2, '/uploads/beaches/beach_1788410013333_713.jpg', TRUE, '2026-09-03 04:33:33')
ON CONFLICT (id) DO NOTHING;

SELECT setval('beach_images_id_seq', (SELECT MAX(id) FROM beach_images));

-- Bookings
INSERT INTO bookings (id, booking_ref, beach_id, full_name, email, phone, nationality, visit_date, people, visit_type, activity_pref, notes, status, created_at) VALUES
  (1, 'BK-9YC2I7HN', 9, 'Arnulfo Joshua Lim', 'jovanramones00@gmail.com', '09925989543', 'Filipino', '2026-09-04', 5, 'overnight', 'swimming', 'na', 'confirmed', '2026-09-03 05:18:00'),
  (2, 'BK-0D85SRC7', 9, 'Arnulfo Joshua Lim', 'jovanramones00@gmail.com', '09925989543', 'Filipino', '2026-09-04', 1, 'overnight', 'relaxation', 'test', 'confirmed', '2026-09-03 05:50:44')
ON CONFLICT (id) DO NOTHING;

SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- Bookmarks
INSERT INTO bookmarks (id, beach_id, session_id, created_at) VALUES
  (2, 2, 'sess_1788364341098_3fhxek1dd', '2026-09-02 16:21:08')
ON CONFLICT (id) DO NOTHING;

SELECT setval('bookmarks_id_seq', (SELECT MAX(id) FROM bookmarks));

-- Reviews
INSERT INTO reviews (id, beach_id, author, rating, comment, created_at) VALUES
  (4, 9, 'test', 5, 'test', '2026-09-03 05:04:45')
ON CONFLICT (id) DO NOTHING;

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
