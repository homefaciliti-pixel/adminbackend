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
    const [inServices] = await connection.query(
      "SELECT id, title, price, status, category_id FROM services WHERE title LIKE '%Compounder%'"
    );
    console.log('--- Found in services ---');
    console.log(inServices);

    const [inNodeServices] = await connection.query(
      "SELECT id, title, price, status, category_id FROM node_services WHERE title LIKE '%Compounder%'"
    );
    console.log('\n--- Found in node_services ---');
    console.log(inNodeServices);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
