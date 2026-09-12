-- AllenShores PH - Cottages & Rooms Schema
-- Run this in Supabase SQL Editor to add cottage/room listings + booking support

-- =============================================
-- COTTAGES
-- =============================================
CREATE TABLE IF NOT EXISTS cottages (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price VARCHAR(50) DEFAULT '0',
  capacity INTEGER DEFAULT 2,
  quantity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cottages_beach_id ON cottages(beach_id);

CREATE TABLE IF NOT EXISTS cottage_images (
  id SERIAL PRIMARY KEY,
  cottage_id INTEGER NOT NULL REFERENCES cottages(id) ON DELETE CASCADE,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cottage_images_cottage_id ON cottage_images(cottage_id);

-- =============================================
-- ROOMS
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price VARCHAR(50) DEFAULT '0',
  capacity INTEGER DEFAULT 2,
  quantity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rooms_beach_id ON rooms(beach_id);

CREATE TABLE IF NOT EXISTS room_images (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images(room_id);

-- =============================================
-- BOOKINGS - add cottage/room booking columns
-- =============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cottage_id INTEGER REFERENCES cottages(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cottage_qty INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_qty INTEGER DEFAULT 0;
