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
    const [nodeRows] = await connection.query("SELECT id, title, status FROM node_services WHERE title LIKE '%Professional Compounders%'");
    console.log('--- in node_services ---');
    console.log(nodeRows);

    const [normalRows] = await connection.query("SELECT id, title, status FROM services WHERE title LIKE '%Professional Compounders%'");
    console.log('\n--- in services (non-prefixed) ---');
    console.log(normalRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
