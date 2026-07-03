const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // 1. Categories in node_categories but not categories
    const [missingCatsInNormal] = await connection.query(
      'SELECT nc.id, nc.title FROM node_categories nc LEFT JOIN categories c ON nc.title = c.title WHERE c.id IS NULL'
    );
    console.log('--- Categories in node_categories but missing in categories ---');
    console.log(missingCatsInNormal);

    // 2. Categories in categories but not node_categories
    const [missingCatsInNode] = await connection.query(
      'SELECT c.id, c.title FROM categories c LEFT JOIN node_categories nc ON c.title = nc.title WHERE nc.id IS NULL'
    );
    console.log('\n--- Categories in categories but missing in node_categories ---');
    console.log(missingCatsInNode);

    // 3. Services in node_services but not services
    const [missingServicesInNormal] = await connection.query(
      'SELECT ns.id, ns.title FROM node_services ns LEFT JOIN services s ON ns.title = s.title WHERE s.id IS NULL'
    );
    console.log('\n--- Services in node_services but missing in services ---');
    console.log(`Count: ${missingServicesInNormal.length}`);
    console.log(missingServicesInNormal.slice(0, 10));

    // 4. Services in services but not node_services
    const [missingServicesInNode] = await connection.query(
      'SELECT s.id, s.title FROM services s LEFT JOIN node_services ns ON s.title = ns.title WHERE ns.id IS NULL'
    );
    console.log('\n--- Services in services but missing in node_services ---');
    console.log(`Count: ${missingServicesInNode.length}`);
    console.log(missingServicesInNode.slice(0, 10));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
