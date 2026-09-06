-- Beach Owners schema
-- Run this to add beach owner accounts to the database

CREATE TABLE IF NOT EXISTS beach_owners (
  id SERIAL PRIMARY KEY,
  beach_id INTEGER NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_beach_owners_beach_id ON beach_owners(beach_id);

-- Default beach owner accounts (passwords are bcrypt hashed):
-- sunrise / sunrise123    → Beach ID 2 (Sunrise Beach Resort)
-- cabavilla / cabavilla123 → Beach ID 7 (Caba Villa Diaz Beach)
-- tonying / tonying123     → Beach ID 11 (Tonying Beach)
--
-- Use server/setup-owners.js (with proper env vars) to generate
-- bcrypt hashes and insert the owner records.
