const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'homefaciliti.com',
  user: 'homef4fw_homefaci',
  password: 'Xnj3*t%F36RDK+!',
  database: 'homef4fw_homefaci',
  port: 3306
});

async function run() {
  console.time('query');
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM node_users_v2) AS nodeUsersV2Count,
      (SELECT COUNT(*) FROM node_users) AS nodeUsersCount,
      (SELECT COUNT(*) FROM node_categories) AS totalCategories,
      (SELECT COUNT(*) FROM node_services) AS totalServices,
      (SELECT COUNT(*) FROM node_partners) AS nodePartnersCount,
      (SELECT COUNT(*) FROM node_orders) AS totalOrders,
      (SELECT COUNT(*) FROM node_orders WHERE status = 'Completed') AS completeOrders,
      (SELECT COUNT(*) FROM node_orders WHERE status = 'Assigned') AS assignedOrders,
      (SELECT COUNT(*) FROM node_orders WHERE status = 'In Progress') AS inProgressOrders,
      (SELECT COUNT(*) FROM node_orders WHERE status = 'Cancelled') AS cancelOrders,
      (SELECT COUNT(*) FROM node_orders WHERE serviceDate = '20-08-2026') AS todayOrders,
      (SELECT SUM(amount) FROM node_subscription_earnings) AS subEarningsVal,
      (SELECT SUM(totalAmount) FROM node_booking_earnings) AS orderEarningsVal,
      (SELECT COUNT(*) FROM node_support_tickets) AS totalSupporters,
      (SELECT COUNT(*) FROM \`homef4fw_homefaci\`.\`users\` WHERE deleted_at IS NULL) AS laravelUsersCount,
      (SELECT COUNT(*) FROM \`homef4fw_homefaci\`.\`users\` WHERE role_id = 2) AS laravelPartnersCount
  `);
  console.timeEnd('query');
  console.log(rows[0]);
  await pool.end();
}

run().catch(console.error);
