const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
// NOTE: Environment variables take priority. If not set, falls back to BigRock remote database.
// For LOCAL development: set DB_HOST=127.0.0.1, DB_USER=root, DB_PASSWORD= in your .env file
// For RENDER/PRODUCTION: set DB_HOST=homefaciliti.com and other credentials in Render Dashboard
const pool = mysql.createPool({
  host: process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'homefaciliti.com',
  user: process.env.DB_USER !== undefined ? process.env.DB_USER : 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'Xnj3*t%F36RDK+!',
  database: process.env.DB_NAME !== undefined ? process.env.DB_NAME : 'homef4fw_homefaci',
  port: parseInt(process.env.DB_PORT !== undefined ? process.env.DB_PORT : '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const dbHost = process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'homefaciliti.com';
const tablePrefix = process.env.DB_PREFIX !== undefined 
  ? process.env.DB_PREFIX 
  : (dbHost === 'homefaciliti.com' ? 'node_' : '');

if (tablePrefix) {
  console.log(`🔧 SQL Table prefixing active: prepending "${tablePrefix}" to table names.`);
}

function prefixQuery(sql) {
  if (!tablePrefix) return sql;
  
  const tables = [
    'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
    'booking_earnings', 'subscription_earnings', 'banners', 'states',
    'cities', 'localities', 'notifications', 'reviews', 'settings_config',
    'support_tickets', 'uploaded_files', 'admin_accounts'
  ];

  const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
  
  return sql.replace(regex, (match, keyword, tableName) => {
    return `${keyword} \`${tablePrefix}${tableName}\``;
  });
}

// Override query and execute to dynamically translate table references
const originalQuery = pool.query;
pool.query = function (sql, values) {
  if (typeof sql === 'string') {
    sql = prefixQuery(sql);
  } else if (sql && typeof sql.sql === 'string') {
    sql.sql = prefixQuery(sql.sql);
  }
  return originalQuery.call(this, sql, values);
};

const originalExecute = pool.execute;
pool.execute = function (sql, values) {
  if (typeof sql === 'string') {
    sql = prefixQuery(sql);
  } else if (sql && typeof sql.sql === 'string') {
    sql.sql = prefixQuery(sql.sql);
  }
  return originalExecute.call(this, sql, values);
};

// Test connection and initialize tables on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Remote Database connected successfully through connection pool.');
    
    // Create node_uploaded_files table if not exists
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS \`${tablePrefix}uploaded_files\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`filename\` VARCHAR(255) NOT NULL UNIQUE,
        \`file_data\` LONGTEXT NOT NULL,
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createTableSql);
    console.log(`✅ Table "${tablePrefix}uploaded_files" verified/created successfully.`);
    
    const createAdminsSql = `
      CREATE TABLE IF NOT EXISTS \`${tablePrefix}admin_accounts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`lastGeneratedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createAdminsSql);
    console.log(`✅ Table "${tablePrefix}admin_accounts" verified/created successfully.`);

    connection.release();
  } catch (error) {
    console.error('❌ Database connection/initialization failed on startup:');
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
