const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'homefaciliti.com',
    user: process.env.DB_USER || 'homef4fw_homefaci',
    password: process.env.DB_PASSWORD || 'Xnj3*t%F36RDK+!',
    database: process.env.DB_NAME || 'homef4fw_homefaci',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    const [usersSchema] = await connection.query('DESCRIBE users');
    const [nodeUsersSchema] = await connection.query('DESCRIBE node_users');
    console.log('--- USERS SCHEMA ---');
    console.log(usersSchema.map(c => `${c.Field}: ${c.Type}`));
    console.log('\n--- NODE_USERS SCHEMA ---');
    console.log(nodeUsersSchema.map(c => `${c.Field}: ${c.Type}`));

    const [partnersSchema] = await connection.query('DESCRIBE partners');
    const [nodePartnersSchema] = await connection.query('DESCRIBE node_partners');
    console.log('\n--- PARTNERS SCHEMA ---');
    console.log(partnersSchema.map(c => `${c.Field}: ${c.Type}`));
    console.log('\n--- NODE_PARTNERS SCHEMA ---');
    console.log(nodePartnersSchema.map(c => `${c.Field}: ${c.Type}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
