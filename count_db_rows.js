const db = require('./backend/db');

async function main() {
  try {
    const conn = await db.getConnection();
    
    // We want to count:
    // 1. `users` (Laravel users)
    const [[usersRow]] = await conn.query('SELECT COUNT(*) AS count FROM users');
    console.log('Laravel users count:', usersRow.count);

    // 2. `node_users_v2`
    const [[nodeUsersV2Row]] = await conn.query('SELECT COUNT(*) AS count FROM node_users_v2');
    console.log('node_users_v2 count:', nodeUsersV2Row.count);

    // 3. `orders` (Laravel orders)
    const [[ordersRow]] = await conn.query('SELECT COUNT(*) AS count FROM orders');
    console.log('Laravel orders count:', ordersRow.count);

    // 4. `node_orders_v2`
    const [[nodeOrdersV2Row]] = await conn.query('SELECT COUNT(*) AS count FROM node_orders_v2');
    console.log('node_orders_v2 count:', nodeOrdersV2Row.count);

    // 5. Let's also check if there is an `orders_v2` table without prefix
    const [hasV2] = await conn.query("SHOW TABLES LIKE 'orders_v2'");
    if (hasV2.length > 0) {
      const [[v2Row]] = await conn.query('SELECT COUNT(*) AS count FROM orders_v2');
      console.log('orders_v2 (no prefix) count:', v2Row.count);
    } else {
      console.log('orders_v2 (no prefix) table does not exist');
    }

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
