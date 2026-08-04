const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // Select latest 10 orders from node_orders_v2
    const [orders] = await conn.query('SELECT * FROM node_orders_v2 ORDER BY id DESC LIMIT 10');
    console.log('Latest 10 node_orders_v2:', orders);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
