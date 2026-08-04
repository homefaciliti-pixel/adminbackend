const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // Search for 673 in any table that could be order-related
    // Let's first search in `node_orders_v2` and `orders_v2` (original table in Laravel if it exists)
    // Wait, let's search table `orders` (original Laravel table)
    const [laravelOrders] = await conn.query('SELECT * FROM orders WHERE id = 673');
    console.log('Laravel orders ID 673:', laravelOrders);

    // Let's search for phone number '9653853414'
    const [users] = await conn.query('SELECT * FROM node_users_v2 WHERE phone = "9653853414"');
    console.log('node_users_v2:', users);

    const [lUsers] = await conn.query('SELECT * FROM users WHERE mobile = "9653853414"');
    console.log('Laravel users:', lUsers);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
