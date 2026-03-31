require('dotenv').config();
const { Pool } = require('pg');

// Smart connection: Use DATABASE_URL if available (Render), otherwise use individual variables (Local)
const poolConfiguration = process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      };

const pool = new Pool(poolConfiguration);

module.exports = {
    query: (text, params) => pool.query(text, params),
};
