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
    // 1. Check if some specific services exist in both tables
    const [matchingServices] = await connection.query(
      'SELECT s.id, s.title, ns.id as ns_id, ns.title as ns_title FROM services s JOIN node_services ns ON s.id = ns.id LIMIT 10'
    );
    console.log('--- MATCHING IDS IN SERVICES AND NODE_SERVICES ---');
    console.log(matchingServices);

    // 2. Check for triggers on the services or node_services tables
    const [triggers] = await connection.query(
      "SHOW TRIGGERS WHERE `Table` = 'services' OR `Table` = 'node_services'"
    );
    console.log('\n--- TRIGGERS ON SERVICES / NODE_SERVICES ---');
    console.log(triggers);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
