const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'homefaciliti.com',
  user: process.env.DB_USER !== undefined ? process.env.DB_USER : 'homef4fw_homefaci',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'Xnj3*t%F36RDK+!',
  database: process.env.DB_NAME !== undefined ? process.env.DB_NAME : 'homef4fw_homefaci',
  port: parseInt(process.env.DB_PORT !== undefined ? process.env.DB_PORT : '3306'),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 1000,        // Fast 1s connection timeout for instant auto-failover
  enableKeepAlive: true,       // keep connections alive
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

const http = require('http');
const https = require('https');

// Default to HTTPS Bridge fallback for Render environments where direct MySQL 3306 is blocked
let useHttpsBridgeFallback = true;

// Connection Agent for keep-alive HTTPS connections
// maxSockets: 2 prevents concurrent floods that trigger 429 on BigRock hosting
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 2, timeout: 8000 });

// In-Memory Query Cache for fast read access
const queryCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds cache for SELECT queries

function invalidateCache() {
  queryCache.clear();
}

let bridgeQueue = Promise.resolve();

// Minimum delay between sequential bridge calls to avoid flooding BigRock's WAF
const BRIDGE_INTER_REQUEST_DELAY_MS = 300;

function queryViaHttpsBridge(sql, params = []) {
  const isSelect = typeof sql === 'string' && sql.trim().toUpperCase().startsWith('SELECT');
  const cacheKey = isSelect ? `${sql}::${JSON.stringify(params)}` : null;

  if (cacheKey && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve(cached.data);
    }
  }

  if (!isSelect) {
    invalidateCache();
  }

  const task = bridgeQueue.then(() => new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql, params: params || [] });

    // Exponential backoff: 1s, 2s, 4s, 8s between retries
    // This is critical for 429 (rate-limited) responses from BigRock's WAF
    const getBackoffMs = (attempt) => Math.min(1000 * Math.pow(2, attempt - 1), 8000);

    const sendRequest = (attempt = 1) => {
      const req = https.request({
        hostname: 'homefaciliti.com',
        port: 443,
        path: '/public/db_bridge.php',
        method: 'POST',
        agent: httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${120 + (attempt % 5)}.0.0.0 Safari/537.36`,
          'Cookie': 'humans_21909=1',
          'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const isHtml = data.trim().startsWith('<') || data.includes('<!DOCTYPE');
          if ((res.statusCode === 429 || res.statusCode >= 500 || isHtml) && attempt <= 4) {
            const backoffMs = getBackoffMs(attempt);
            console.warn(`⚠️ Bridge HTTP ${res.statusCode} on attempt ${attempt}. Retrying in ${backoffMs}ms...`);
            setTimeout(() => sendRequest(attempt + 1), backoffMs);
            return;
          }

          try {
            let cleanData = data;
            const firstBrace = cleanData.indexOf('{');
            const lastBrace = cleanData.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanData = cleanData.substring(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(cleanData);
            if (parsed && parsed.success) {
              let resultData;
              if (parsed.rows !== undefined) {
                resultData = [parsed.rows, []];
              } else {
                resultData = [{ affectedRows: parsed.affectedRows, insertId: parsed.insertId }, []];
              }

              if (cacheKey) {
                queryCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
              }
              // Small delay after success to space out the next queued request
              setTimeout(() => resolve(resultData), BRIDGE_INTER_REQUEST_DELAY_MS);
            } else if (attempt <= 4) {
              setTimeout(() => sendRequest(attempt + 1), getBackoffMs(attempt));
            } else {
              reject(new Error((parsed && (parsed.error || parsed.message)) || 'Bridge Error'));
            }
          } catch (e) {
            if (attempt <= 4) {
              setTimeout(() => sendRequest(attempt + 1), attempt * 250);
            } else {
              reject(new Error(`JSON Parse Error on Bridge response (HTTP ${res.statusCode}): ${e.message}`));
            }
          }
        });
      });

      req.on('error', (err) => {
        if (attempt <= 4) {
          const backoffMs = getBackoffMs(attempt);
          console.warn(`⚠️ Bridge network error on attempt ${attempt}: ${err.message}. Retrying in ${backoffMs}ms...`);
          setTimeout(() => sendRequest(attempt + 1), backoffMs);
        } else {
          reject(err);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt <= 4) {
          const backoffMs = getBackoffMs(attempt);
          console.warn(`⚠️ Bridge timeout on attempt ${attempt}. Retrying in ${backoffMs}ms...`);
          setTimeout(() => sendRequest(attempt + 1), backoffMs);
        } else {
          reject(new Error('Bridge Request Timeout after 4 attempts'));
        }
      });

      req.write(payload);
      req.end();
    };

    sendRequest(1);
  }));

  bridgeQueue = task.catch(() => {});
  return task;
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
    console.warn(`⚠️ Direct TCP MySQL failed (${err.code || err.message}). Auto-switching to HTTPS Bridge...`);
    useHttpsBridgeFallback = true;
    return queryViaHttpsBridge(queryStr, values);
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
    console.warn(`⚠️ Direct TCP MySQL failed (${err.code || err.message}). Auto-switching to HTTPS Bridge...`);
    useHttpsBridgeFallback = true;
    return queryViaHttpsBridge(queryStr, values);
  }
};

// NOTE: Startup DB initialization removed — tables (uploaded_files, admin_accounts)
// already exist in production. Running CREATE TABLE on every boot wastes 2 bridge slots
// and contributes to 429 rate-limit bursts during cold starts on Render.
// If tables need to be re-created, do so via a one-time migration script.
console.log('✅ DB module loaded. Bridge queue ready. Tables expected to exist already.');
useHttpsBridgeFallback = true; // Always use HTTPS bridge on Render

module.exports = pool;
