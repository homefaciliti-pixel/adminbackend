const mysql = require('mysql2/promise');
require('dotenv').config();

const missingTitles = [
  'Leakage Repair',
  'Kitchen Cleaning',
  'Hair Cut',
  'Hair Coloring',
  'Furniture Repair',
  'Consultation'
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    for (const title of missingTitles) {
      console.log(`\n=== SEARCHING FOR: "${title}" ===`);
      
      const [inServices] = await connection.query(
        "SELECT id, title, price, status, category_id FROM services WHERE title LIKE ?",
        [`%${title}%`]
      );
      console.log('In services (non-prefixed):');
      console.log(inServices);

      const [inNodeServices] = await connection.query(
        "SELECT id, title, price, status, category_id FROM node_services WHERE title LIKE ?",
        [`%${title}%`]
      );
      console.log('In node_services:');
      console.log(inNodeServices);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
