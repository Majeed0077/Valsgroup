// lib/database.js
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g., 'localhost'
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Required for Azure; safe to keep true
    trustServerCertificate: true, // For local development only
  },
};

let pool;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ MSSQL connected');
    }
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
}
