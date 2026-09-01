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
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 10000,       // 10s connection timeout
  enableKeepAlive: true,       // keep connections alive (prevents ETIMEDOUT)
  keepAliveInitialDelay: 10000,// ping every 10s
  ssl: false                   // disable TLS handshake on cPanel shared hosting
});

const dbHost = process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'homefaciliti.com';
const tablePrefix = process.env.DB_PREFIX !== undefined 
  ? process.env.DB_PREFIX 
  : (dbHost === 'homefaciliti.com' || dbHost === '162.241.116.166' || process.env.DB_USER === 'homef4fw_homefaci' ? 'node_' : '');

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

const https = require('https');
let useHttpsBridgeFallback = false;

function queryViaHttpsBridge(sql, params = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql, params: params || [] });
    const req = https.request({
      hostname: 'homefaciliti.com',
      port: 443,
      path: '/db_bridge.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.success) {
            if (parsed.rows !== undefined) {
              resolve([parsed.rows, []]);
            } else {
              resolve([{ affectedRows: parsed.affectedRows, insertId: parsed.insertId }, []]);
            }
          } else {
            reject(new Error((parsed && (parsed.error || parsed.message)) || 'HTTPS Bridge Error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTPS Bridge Request Timeout'));
    });
    req.write(payload);
    req.end();
  });
}

const originalQuery = pool.query;
pool.query = async function (sql, values) {
  let queryStr = typeof sql === 'string' ? sql : (sql && sql.sql ? sql.sql : '');
  queryStr = prefixQuery(queryStr);

  if (process.env.USE_HTTPS_BRIDGE === 'true' || useHttpsBridgeFallback) {
    return queryViaHttpsBridge(queryStr, values);
  }

  try {
    return await originalQuery.call(this, queryStr, values);
  } catch (err) {
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn(`⚠️ Direct TCP MySQL failed (${err.code}). Auto-switching to HTTPS Bridge over Port 443...`);
      useHttpsBridgeFallback = true;
      return queryViaHttpsBridge(queryStr, values);
    }
    throw err;
  }
};

const originalExecute = pool.execute;
pool.execute = async function (sql, values) {
  let queryStr = typeof sql === 'string' ? sql : (sql && sql.sql ? sql.sql : '');
  queryStr = prefixQuery(queryStr);

  if (process.env.USE_HTTPS_BRIDGE === 'true' || useHttpsBridgeFallback) {
    return queryViaHttpsBridge(queryStr, values);
  }

  try {
    return await originalExecute.call(this, queryStr, values);
  } catch (err) {
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn(`⚠️ Direct TCP MySQL failed (${err.code}). Auto-switching to HTTPS Bridge over Port 443...`);
      useHttpsBridgeFallback = true;
      return queryViaHttpsBridge(queryStr, values);
    }
    throw err;
  }
};

// Test connection and initialize tables on startup
setImmediate(async () => {
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
});

module.exports = pool;
