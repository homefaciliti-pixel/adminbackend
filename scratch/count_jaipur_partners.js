const mysql = require('mysql2/promise');

async function run() {
  const pool = await mysql.createPool({
    host: 'homefaciliti.com',
    user: 'homef4fw_homefaci',
    password: 'Xnj3*t%F36RDK+!',
    database: 'homef4fw_homefaci',
    port: 3306,
  });
  try {
    // node_partners table
    const [[node]] = await pool.query('SELECT COUNT(*) as count FROM node_partners WHERE city LIKE ?', ['%Jaipur%']);
    const [[nodeApproved]] = await pool.query('SELECT COUNT(*) as count FROM node_partners WHERE city LIKE ? AND isApproved = 1', ['%Jaipur%']);
    const [[nodePending]] = await pool.query('SELECT COUNT(*) as count FROM node_partners WHERE city LIKE ? AND isApproved = 0', ['%Jaipur%']);

    // Laravel users table
    const [[laravel]] = await pool.query('SELECT COUNT(*) as count FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id = 2 AND c.name LIKE ?', ['%Jaipur%']);
    const [[laravelApproved]] = await pool.query('SELECT COUNT(*) as count FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id = 2 AND c.name LIKE ? AND u.is_approval = 1', ['%Jaipur%']);
    const [[laravelPending]] = await pool.query('SELECT COUNT(*) as count FROM homef4fw_homefaci.users u LEFT JOIN homef4fw_homefaci.cities c ON u.city_id = c.id WHERE u.role_id = 2 AND c.name LIKE ? AND u.is_approval = 0', ['%Jaipur%']);

    console.log('=== node_partners (Admin Panel) ===');
    console.log('Total:    ' + node.count);
    console.log('Approved: ' + nodeApproved.count);
    console.log('Pending:  ' + nodePending.count);

    console.log('=== users table (Laravel/App) ===');
    console.log('Total:    ' + laravel.count);
    console.log('Approved: ' + laravelApproved.count);
    console.log('Pending:  ' + laravelPending.count);

    console.log('=== GRAND TOTAL ===');
    console.log('All Partners: ' + (parseInt(node.count) + parseInt(laravel.count)));
    console.log('All Approved: ' + (parseInt(nodeApproved.count) + parseInt(laravelApproved.count)));
    console.log('All Pending:  ' + (parseInt(nodePending.count) + parseInt(laravelPending.count)));

  } finally {
    await pool.end();
  }
}
run().catch(console.error);
