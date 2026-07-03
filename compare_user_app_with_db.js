const mysql = require('mysql2/promise');
const http = require('https');
require('dotenv').config();

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
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
    // 1. Fetch user app services
    const userAppRes = await fetchUrl('https://backend-1-ux3b.onrender.com/api/services');
    const userAppServices = userAppRes.services || [];
    console.log('Total user app services from API:', userAppServices.length);

    // 2. Fetch DB services
    const [dbServices] = await connection.query(
      'SELECT id, title, status, category_id FROM node_services'
    );
    console.log('Total services in node_services table:', dbServices.length);

    // Group DB services by status
    const activeDb = dbServices.filter(s => s.status === 1);
    const inactiveDb = dbServices.filter(s => s.status === 0);
    console.log(`Active in DB: ${activeDb.length}, Inactive in DB: ${inactiveDb.length}`);

    // Let's see if any user app services are missing in DB
    const dbTitles = new Set(dbServices.map(s => s.title.toLowerCase().trim()));
    const userAppTitles = new Set(userAppServices.map(s => s.title.toLowerCase().trim()));

    const missingInDb = userAppServices.filter(s => !dbTitles.has(s.title.toLowerCase().trim()));
    console.log('\n--- User App services NOT found in node_services by title: ---');
    console.log(missingInDb.map(s => ({ title: s.title, productId: s.productId })));

    const missingInUserApp = dbServices.filter(s => !userAppTitles.has(s.title.toLowerCase().trim()));
    console.log(`\n--- DB services NOT found in user app by title (${missingInUserApp.length} total): ---`);
    console.log('Showing first 15:');
    console.log(missingInUserApp.slice(0, 15).map(s => ({ id: s.id, title: s.title, status: s.status, category_id: s.category_id })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
