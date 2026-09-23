const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================================
// DIRECT MySQL CONNECTION — BigRock Remote MySQL
// ============================================================

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'homefaciliti.com',
  user:     process.env.DB_USER     || 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
  database: process.env.DB_NAME     || 'homef4fw_homefaci',
  port:     parseInt(process.env.DB_PORT || '3306'),

  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_CONNECTION_LIMIT || '15'), // Match BigRock MySQL user limit
  maxIdle:            5,        // Limit idle connections to match BigRock max_user_connections
  idleTimeout:        20000,    // 20s - close idle connections gracefully
  queueLimit:         0,        // Queue incoming queries safely in Node RAM when pool limit reached
  connectTimeout:     15000,    // 15s connection timeout
  enableKeepAlive:    true,
  keepAliveInitialDelay: 5000,  // 5s TCP keep-alive
  ssl: false
});

// Table prefix: all production tables are prefixed with "node_"
const dbHost      = process.env.DB_HOST || 'homefaciliti.com';
const tablePrefix = process.env.DB_PREFIX !== undefined
  ? process.env.DB_PREFIX
  : (dbHost === 'homefaciliti.com' || process.env.DB_USER === 'homef4fw_homefaci' ? 'node_' : '');

if (tablePrefix) {
  console.log(`🔧 SQL Table prefix: "${tablePrefix}"`);
}

// Auto-prefix table names in SQL queries
function prefixQuery(sql) {
  if (!sql) return sql;

  if (!tablePrefix) return sql;

  const tables = [
    'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
    'booking_earnings', 'subscription_earnings', 'banners', 'states',
    'cities', 'localities', 'notifications', 'reviews', 'settings_config',
    'support_tickets', 'uploaded_files', 'admin_accounts', 'city_pricing_rules'
  ];

  const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
  return sql.replace(regex, (match, keyword, tableName) => `${keyword} \`${tablePrefix}${tableName}\``);
}

// Helper function to retry queries automatically if connection is lost or max connections hit
async function withRetry(operation, queryStr, values, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(queryStr, values);
    } catch (err) {
      const errCode = err.code || '';
      const errMsg = err.message || '';
      const isConnectionLost = errCode === 'PROTOCOL_CONNECTION_LOST' ||
                               errCode === 'ECONNRESET' ||
                               errCode === 'EPIPE' ||
                               errCode === 'ETIMEDOUT' ||
                               errCode === 'ER_CON_COUNT_ERROR' ||
                               errCode === 'ER_TOO_MANY_USER_CONNECTIONS' ||
                               errMsg.includes('max_user_connections') ||
                               errMsg.includes('Connection lost') ||
                               errMsg.includes('socket hang up') ||
                               errMsg.includes('closed');

      if (isConnectionLost && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 150));
      } else {
        throw err;
      }
    }
  }
}

// Wrap pool.query to auto-prefix table names and auto-retry
const _query = pool.query.bind(pool);
pool.query = async function (sql, values) {
  const queryStr = prefixQuery(typeof sql === 'string' ? sql : (sql?.sql || ''));
  return withRetry(_query, queryStr, values);
};

// Wrap pool.execute to auto-prefix table names and auto-retry
const _execute = pool.execute.bind(pool);
pool.execute = async function (sql, values) {
  const queryStr = prefixQuery(typeof sql === 'string' ? sql : (sql?.sql || ''));
  return withRetry(_execute, queryStr, values);
};

// Verify connection on startup (non-blocking, just for logging)
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected directly to homefaciliti.com — no bridge needed.');
    conn.release();
  })
  .catch(err => {
    console.error('⚠️ MySQL direct connection error on startup:', err.message);
  });

// Periodic heartbeat keepalive ping every 15 seconds to keep connection warm
const heartbeatTimer = setInterval(async () => {
  try {
    const rawQuery = _query.bind(pool);
    await rawQuery('SELECT 1');
  } catch (err) {
    // Ignore heartbeat errors; pool auto-reconnects on next request
  }
}, 15000);

if (heartbeatTimer.unref) {
  heartbeatTimer.unref();
}

module.exports = pool;
