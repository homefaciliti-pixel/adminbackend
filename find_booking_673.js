const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // connection.query is NOT overridden by db.js, so it won't prepend "node_"
    const [ordersV2] = await conn.query('SELECT * FROM orders_v2 WHERE id = 673');
    console.log('orders_v2:', ordersV2);

    const [orders] = await conn.query('SELECT * FROM orders WHERE id = 673');
    console.log('orders:', orders);

    const [allRecentV2] = await conn.query('SELECT id, serviceName, date, status, serviceAmount FROM orders_v2 ORDER BY id DESC LIMIT 5');
    console.log('Recent orders_v2:', allRecentV2);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
