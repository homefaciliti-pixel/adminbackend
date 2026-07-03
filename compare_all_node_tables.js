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
    const tables = [
      'users', 'categories', 'services', 'orders', 'pages', 'partners',
      'booking_earnings', 'subscription_earnings', 'banners', 'states',
      'cities', 'localities', 'notifications', 'reviews', 'settings_config',
      'support_tickets'
    ];

    console.log('--- COMPARING ROW COUNTS ---');
    for (const table of tables) {
      try {
        const [[{ count: nonPrefixed }]] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        const [[{ count: prefixed }]] = await connection.query(`SELECT COUNT(*) as count FROM \`node_${table}\``);
        console.log(`${table.padEnd(25)} | Non-prefixed: ${String(nonPrefixed).padEnd(4)} | Prefixed: ${String(prefixed).padEnd(4)}`);
      } catch (err) {
        console.log(`Failed to compare table: ${table} - ${err.message}`);
      }
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
