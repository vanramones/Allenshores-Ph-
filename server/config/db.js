const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test connection only in non-serverless (local dev)
if (process.env.NODE_ENV !== 'production') {
  pool.connect()
    .then(client => {
      console.log('✅ PostgreSQL Connected Successfully');
      client.release();
    })
    .catch(err => {
      console.error('❌ PostgreSQL Connection Error:', err?.message || err);
    });
}

module.exports = pool;
