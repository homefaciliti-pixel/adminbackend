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
    const [nodeCats] = await connection.query('SELECT id, title, slug, parent, image FROM node_categories');
    console.log('--- NODE_CATEGORIES ---');
    console.log(nodeCats);

    const [normalCats] = await connection.query('SELECT id, title, slug, parent, parent_id, image FROM categories');
    console.log('\n--- CATEGORIES (non-prefixed) ---');
    console.log(normalCats);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
