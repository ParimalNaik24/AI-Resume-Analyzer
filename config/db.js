const { Pool } = require('pg');
require('dotenv').config();

// This pool connects to the same Postgres database you manage in pgAdmin.
// Fill in the real values inside your .env file (copy from .env.example).
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on('connect', () => {
  console.log('Connected to Postgres database:', process.env.PGDATABASE);
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

module.exports = pool;
