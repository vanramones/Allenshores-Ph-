// Run this script to set up the PostgreSQL schema on Supabase
// Usage: node setup-pg.js
//
// Set these env vars first (or create a .env file):
//   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    const schemaPath = path.join(__dirname, 'schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema...');
    await client.query(schema);
    console.log('✅ Schema and seed data applied successfully!');

    // Verify tables
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\n📊 Tables created:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // Count rows
    for (const t of tables) {
      const tableName = t.table_name;
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`   ${tableName}: ${rows[0].count} rows`);
    }

    client.release();
    await pool.end();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
