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
    const [servicesSchema] = await connection.query('DESCRIBE services');
    const [nodeServicesSchema] = await connection.query('DESCRIBE node_services');
    console.log('--- SERVICES SCHEMA ---');
    console.log(servicesSchema);
    console.log('\n--- NODE_SERVICES SCHEMA ---');
    console.log(nodeServicesSchema);

    const [categoriesSchema] = await connection.query('DESCRIBE categories');
    const [nodeCategoriesSchema] = await connection.query('DESCRIBE node_categories');
    console.log('\n--- CATEGORIES SCHEMA ---');
    console.log(categoriesSchema);
    console.log('\n--- NODE_CATEGORIES SCHEMA ---');
    console.log(nodeCategoriesSchema);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
