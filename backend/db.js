
const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================================
// HOMEFACILITI MYSQL CONNECTION POOL
// BigRock Remote MySQL + Render Backend
// ============================================================

const connectionLimit = Math.max(
  1,
  parseInt(process.env.DB_CONNECTION_LIMIT || '5', 10)
);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'homefaciliti.com',
  user: process.env.DB_USER || 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD || 'Home1184#$%',
  database: process.env.DB_NAME || 'homef4fw_homefaci',
  port: parseInt(process.env.DB_PORT || '3306'),

  // Connection Pool Settings
  waitForConnections: true,
  connectionLimit: connectionLimit,
  maxIdle:  Math.min(4, connectionLimit),
  idleTimeout: 60000,
  queueLimit: 0,

  // Connection Settings
  connectTimeout: 20000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,

  ssl: false
});

// ============================================================
// TABLE PREFIX CONFIGURATION
// ============================================================

const dbHost = process.env.DB_HOST || 'homefaciliti.com';

const tablePrefix =
  process.env.DB_PREFIX !== undefined
    ? process.env.DB_PREFIX
    : (
        dbHost === 'homefaciliti.com' ||
    process.env.DB_USER === 'homef4fw_homefaci'
      )
      ? 'node_'
      : '';

if (tablePrefix) {
  console.log(`SQL Table Prefix: "${tablePrefix}"`);
}

// ============================================================
// AUTO PREFIX TABLE NAMES
// ============================================================

function prefixQuery(sql) {
  if (!sql || typeof sql !== 'string') {
    return sql;
  }

  if (!tablePrefix) {
    return sql;
  }

  const tables = [
    'users',
    'categories',
    'subcategories',
    'services',
    'orders',
    'orders_v2',
    'pages',
    'partners',
    'booking_earnings',
    'subscription_earnings',
    'banners',
    'states',
    'cities',
    'localities',
    'notifications',
    'reviews',
    'settings_config',
    'support_tickets',
    'uploaded_files',
    'admin_accounts',
    'city_pricing_rules'
  ];

  const regex = new RegExp(
    `\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`,
    'gi'
  );

  return sql.replace(regex, (match, keyword, tableName) => {
    return `${keyword} \`${tablePrefix}${tableName}\``;
  });
}

// ============================================================
// QUERY WRAPPER
// Automatic table prefixing
// No aggressive retry on connection limit errors
// ============================================================

const originalQuery = pool.query.bind(pool);

pool.query = function (sql, values) {
  const queryStr = prefixQuery(
    typeof sql === 'string' ? sql : (sql?.sql || '')
  );

  return originalQuery(queryStr, values);
};

// ============================================================
// EXECUTE WRAPPER
// Automatic table prefixing
// ============================================================

const originalExecute = pool.execute.bind(pool);

pool.execute = function (sql, values) {
  const queryStr = prefixQuery(
    typeof sql === 'string' ? sql : (sql?.sql || '')
  );

  return originalExecute(queryStr, values);
};

// ============================================================
// CONNECTION POOL MONITORING
// ============================================================

pool.on('connection', () => {
  console.log('MySQL: New connection established');
});

pool.on('acquire', () => {
  // Connection acquired from pool
});

pool.on('release', () => {
  // Connection released back to pool
});

pool.on('enqueue', () => {
  console.warn('MySQL: Waiting for available connection');
});

// ============================================================
// EXPORT DATABASE POOL
// ============================================================

console.log(
  `MySQL Pool Initialized | Max Connections: ${connectionLimit}`
);

module.exports = pool;
