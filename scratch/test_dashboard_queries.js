const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'homefaciliti.com',
  user: 'homef4fw_homefaci',
  password: 'Xnj3*t%F36RDK+!',
  database: 'homef4fw_homefaci',
  port: 3306
});

const tablePrefix = 'node_';

function prefixQuery(sql) {
  const tables = [
    'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
    'booking_earnings', 'subscription_earnings', 'banners', 'states',
    'cities', 'localities', 'notifications', 'reviews', 'settings_config',
    'support_tickets', 'uploaded_files', 'admin_accounts'
  ];
  const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
  return sql.replace(regex, (match, keyword, tableName) => {
    return `${keyword} \`${tablePrefix}${tableName}\``;
  });
}

const originalQuery = pool.query;
pool.query = function (sql, values) {
  if (typeof sql === 'string') {
    sql = prefixQuery(sql);
  }
  return originalQuery.call(this, sql, values);
};

async function testQuery(name, sql, params = []) {
  const start = Date.now();
  try {
    const [rows] = await pool.query(sql, params);
    console.log(`✅ ${name} succeeded in ${Date.now() - start}ms:`, rows);
  } catch (err) {
    console.log(`❌ ${name} FAILED in ${Date.now() - start}ms:`, err.message);
  }
}

async function run() {
  const dbName = 'homef4fw_homefaci';
  const todayStr = '20-08-2026';

  console.log('Testing individual dashboard queries:');
  await testQuery('Q1: node_users_v2', 'SELECT COUNT(*) as total FROM node_users_v2');
  await testQuery('Q2: node_users', 'SELECT COUNT(*) as total FROM users');
  await testQuery('Q3: laravel_users', `SELECT COUNT(*) as total FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`);
  await testQuery('Q4: categories', 'SELECT COUNT(*) as total FROM categories');
  await testQuery('Q5: services', 'SELECT COUNT(*) as total FROM services');
  await testQuery('Q6: partners', 'SELECT COUNT(*) as total FROM partners');
  await testQuery('Q7: laravel_partners', `SELECT COUNT(*) as total FROM \`${dbName}\`.\`users\` WHERE role_id = 2`);
  await testQuery('Q8: orders', 'SELECT COUNT(*) as total FROM orders');
  await testQuery('Q9: complete_orders', "SELECT COUNT(*) as total FROM orders WHERE status = 'Completed'");
  await testQuery('Q10: assigned_orders', "SELECT COUNT(*) as total FROM orders WHERE status = 'Assigned'");
  await testQuery('Q11: in_progress_orders', "SELECT COUNT(*) as total FROM orders WHERE status = 'In Progress'");
  await testQuery('Q12: cancel_orders', "SELECT COUNT(*) as total FROM orders WHERE status = 'Cancelled'");
  await testQuery('Q13: today_orders', "SELECT COUNT(*) as total FROM orders WHERE serviceDate = ?", [todayStr]);
  await testQuery('Q14: sub_earnings', "SELECT SUM(amount) as total FROM subscription_earnings");
  await testQuery('Q15: order_earnings', "SELECT SUM(totalAmount) as total FROM booking_earnings");
  await testQuery('Q16: support_tickets', 'SELECT COUNT(*) as total FROM support_tickets');

  await pool.end();
}

run();
