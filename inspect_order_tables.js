const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // Describe node_orders_v2
    const [colsV2] = await conn.query('DESCRIBE node_orders_v2');
    console.log('node_orders_v2 columns:', colsV2.map(c => c.Field));

    // Get order ID 673 from node_orders_v2
    const [orders673] = await conn.query('SELECT * FROM node_orders_v2 WHERE id = 673');
    console.log('node_orders_v2 id 673:', orders673);

    // Let's also check node_orders
    const [cols] = await conn.query('DESCRIBE node_orders');
    console.log('node_orders columns:', cols.map(c => c.Field));

    const [nodeOrders673] = await conn.query('SELECT * FROM node_orders WHERE id = 673');
    console.log('node_orders id 673:', nodeOrders673);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
