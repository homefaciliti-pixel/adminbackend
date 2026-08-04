const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // List all tables
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables:', tables);

    // Get count for node_partners
    const [partners] = await conn.query('SELECT COUNT(*) AS count FROM node_partners');
    console.log('node_partners count:', partners[0].count);

    // Get count for node_orders
    const [orders] = await conn.query('SELECT COUNT(*) AS count FROM node_orders');
    console.log('node_orders count:', orders[0].count);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
