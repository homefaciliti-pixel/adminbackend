const http = require('https');
const mysql = require('mysql2/promise');
require('dotenv').config();

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // 1. Try to fetch banners from user app API
    const urls = [
      'https://backend-1-ux3b.onrender.com/api/banners',
      'https://backend-1-ux3b.onrender.com/api/settings/banners',
      'https://backend-1-ux3b.onrender.com/api/customer/banners',
      'https://backend-1-ux3b.onrender.com/api/user/banners'
    ];

    for (const url of urls) {
      console.log(`\nFetching: ${url}`);
      const res = await fetchUrl(url);
      console.log(`Status: ${res.statusCode}`);
      console.log('Snippet of body:', typeof res.body === 'object' ? JSON.stringify(res.body).slice(0, 300) : String(res.body).slice(0, 300));
    }

    // 2. Query node_banners and banners tables
    const [nodeBanners] = await connection.query('SELECT * FROM node_banners');
    console.log('\n--- node_banners ROWS: ---');
    console.log(nodeBanners);

    const [banners] = await connection.query('SELECT * FROM banners');
    console.log('\n--- banners (non-prefixed) ROWS: ---');
    console.log(banners);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
