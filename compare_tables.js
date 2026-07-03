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
    // 1. Services comparison
    const [nodeServicesCount] = await connection.query('SELECT COUNT(*) as count FROM node_services');
    const [servicesCount] = await connection.query('SELECT COUNT(*) as count FROM services');
    console.log(`node_services count: ${nodeServicesCount[0].count}`);
    console.log(`services count: ${servicesCount[0].count}`);

    const [nodeServicesSample] = await connection.query('SELECT id, title FROM node_services ORDER BY id DESC LIMIT 5');
    const [servicesSample] = await connection.query('SELECT id, title FROM services ORDER BY id DESC LIMIT 5');
    console.log('\nnode_services samples (latest 5):', nodeServicesSample);
    console.log('services samples (latest 5):', servicesSample);

    // 2. Categories comparison
    const [nodeCategoriesCount] = await connection.query('SELECT COUNT(*) as count FROM node_categories');
    const [categoriesCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\nnode_categories count: ${nodeCategoriesCount[0].count}`);
    console.log(`categories count: ${categoriesCount[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
