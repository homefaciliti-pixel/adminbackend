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
  connectTimeout: 2500,        // Fast 2.5s connection timeout for quick auto-failover
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

const https = require('https');
let useHttpsBridgeFallback = false;
let bridgeCookie = 'humans_21909=1';
let sessionEstablished = false;

function performHandshake() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'homefaciliti.com',
      port: 443,
      path: '/public/db_bridge.php',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cookie': bridgeCookie
      },
      timeout: 5000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matchCookie = data.match(/document\.cookie\s*=\s*["']([^"']+)["']/i);
        if (matchCookie && matchCookie[1]) {
          bridgeCookie = matchCookie[1].split(';')[0];
          console.log(`🍪 Handshake extracted anti-bot cookie: "${bridgeCookie}"`);
        }
        sessionEstablished = true;
        resolve();
      });
    });
    req.on('error', () => resolve());
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.end();
  });
}

async function queryViaHttpsBridge(sql, params = []) {
  if (!sessionEstablished) {
    await performHandshake();
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql, params: params || [] });
    let attempts = 0;
    
    const sendRequest = async () => {
      attempts++;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Bridge-Secret': 'HF_SECURE_KEY_2026_x92!',
        'Referer': 'https://homefaciliti.com/public/db_bridge.php',
        'Content-Length': Buffer.byteLength(payload)
      };
      if (bridgeCookie) {
        headers['Cookie'] = bridgeCookie;
      }

      const req = https.request({
        hostname: 'homefaciliti.com',
        port: 443,
        path: '/public/db_bridge.php',
        method: 'POST',
        headers: headers,
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          // Check for anti-bot cookie challenge in response
          const matchCookie = data.match(/document\.cookie\s*=\s*["']([^"']+)["']/i);
          if (matchCookie && matchCookie[1] && attempts < 3) {
            bridgeCookie = matchCookie[1].split(';')[0];
            sessionEstablished = false;
            console.log(`🍪 Extracted BigRock anti-bot cookie (attempt ${attempts}): "${bridgeCookie}". Retrying handshake & request...`);
            await performHandshake();
            return sendRequest();
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
              if (parsed.rows !== undefined) {
                resolve([parsed.rows, []]);
              } else {
                resolve([{ affectedRows: parsed.affectedRows, insertId: parsed.insertId }, []]);
              }
            } else {
              reject(new Error((parsed && (parsed.error || parsed.message)) || 'HTTPS Bridge Error'));
            }
          } catch (e) {
            if (attempts < 3) {
              console.log(`Retry attempt ${attempts} for /public/db_bridge.php due to parse error...`);
              sessionEstablished = false;
              await performHandshake();
              return sendRequest();
            }
            reject(new Error(`JSON Parse Error on HTTPS Bridge response: ${e.message} (Raw snippet: ${data.substring(0, 100)})`));
          }
        });
      });

      req.on('error', (err) => {
        if (attempts < 3) return sendRequest();
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempts < 3) return sendRequest();
        reject(new Error('HTTPS Bridge Request Timeout'));
      });

      req.write(payload);
      req.end();
    };

    sendRequest();
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
    console.warn(`⚠️ Direct TCP MySQL failed (${err.code || err.message}). Auto-switching to HTTPS Bridge over Port 443...`);
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
    console.warn(`⚠️ Direct TCP MySQL failed (${err.code || err.message}). Auto-switching to HTTPS Bridge over Port 443...`);
    useHttpsBridgeFallback = true;
    return queryViaHttpsBridge(queryStr, values);
  }
};

// Test connection and initialize tables on startup
setImmediate(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Remote Database connected successfully through connection pool.');
    
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
    useHttpsBridgeFallback = true;
  }
});

module.exports = pool;
