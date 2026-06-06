const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'homefaciliti.com',
  user: process.env.DB_USER || 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD ?? 'Xnj3*t%F36RDK+!',
  database: process.env.DB_NAME || 'homef4fw_homefaci',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Remote Database connected successfully through connection pool.');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed on startup:');
    console.error(error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ETIMEDOUT') {
      console.warn('\n⚠️  FIREWALL WARNING: Remote MySQL connections are likely restricted on this server.');
      console.warn('To resolve this, please choose one of the following:');
      console.warn('1. Deploy this backend to the homefaciliti.com web server itself (where DB host is local).');
      console.warn('2. Log into your BigRock / Hostgator cPanel -> "Remote MySQL" and add your current IP address.');
      console.warn('3. For development, you can run a local MySQL server and update your .env values to localhost.\n');
    }
  }
})();

module.exports = pool;
