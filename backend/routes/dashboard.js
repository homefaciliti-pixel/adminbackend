const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to format today's date to match the DB string format (DD-MM-YYYY)
function getTodayDateString() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// GET dashboard statistics - all queries run in parallel for maximum performance
router.get('/', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const todayStr = getTodayDateString();

    // Run all queries in parallel using Promise.all for maximum speed
    const [
      [[{ total: nodeUsersV2Count }]],
      [[{ total: nodeUsersCount }]],
      [[{ total: laravelUsersCount }]],
      [[{ total: totalCategories }]],
      [[{ total: totalServices }]],
      [[{ total: nodePartnersCount }]],
      [[{ total: laravelPartnersCount }]],
      [[{ total: totalOrders }]],
      [[{ total: completeOrders }]],
      [[{ total: assignedOrders }]],
      [[{ total: inProgressOrders }]],
      [[{ total: cancelOrders }]],
      todayResult,
      subEarningsResult,
      orderEarningsResult,
      supportResult,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM node_users_v2'),
      db.query('SELECT COUNT(*) as total FROM users'),
      db.query(`SELECT COUNT(*) as total FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`),
      db.query('SELECT COUNT(*) as total FROM categories'),
      db.query('SELECT COUNT(*) as total FROM services'),
      db.query('SELECT COUNT(*) as total FROM partners'),
      db.query(`SELECT COUNT(*) as total FROM \`${dbName}\`.\`users\` WHERE role_id = 2`),
      db.query('SELECT COUNT(*) as total FROM orders'),
      db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'Completed'"),
      db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'Assigned'"),
      db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'In Progress'"),
      db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'Cancelled'"),
      db.query("SELECT COUNT(*) as total FROM orders WHERE serviceDate = ?", [todayStr]).catch(() => [[{ total: 0 }]]),
      db.query("SELECT SUM(amount) as total FROM subscription_earnings").catch(() => [[{ total: 0 }]]),
      db.query("SELECT SUM(totalAmount) as total FROM booking_earnings").catch(() => [[{ total: 0 }]]),
      db.query('SELECT COUNT(*) as total FROM support_tickets').catch(() => [[{ total: 0 }]]),
    ]);

    const totalUsers = nodeUsersV2Count + nodeUsersCount + laravelUsersCount;
    const totalPartners = nodePartnersCount + laravelPartnersCount;
    const todayOrders = todayResult[0][0]?.total ?? 0;
    const subEarningsVal = parseFloat(subEarningsResult[0][0]?.total || 0);
    const orderEarningsVal = parseFloat(orderEarningsResult[0][0]?.total || 0);
    const totalSupporters = supportResult[0][0]?.total ?? 0;

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      data: [
        { name: 'Total Users', totalAmount: totalUsers, imageIcon: `${baseUrl}/icons/users.png` },
        { name: 'Total Categories', totalAmount: totalCategories, imageIcon: `${baseUrl}/icons/categories.png` },
        { name: 'Total Services', totalAmount: totalServices, imageIcon: `${baseUrl}/icons/services.png` },
        { name: 'Total Partners', totalAmount: totalPartners, imageIcon: `${baseUrl}/icons/partners.png` },
        { name: 'Total Orders', totalAmount: totalOrders, imageIcon: `${baseUrl}/icons/orders.png` },
        { name: 'Today Orders', totalAmount: todayOrders, imageIcon: `${baseUrl}/icons/today_orders.png` },
        { name: 'Complete Orders', totalAmount: completeOrders, imageIcon: `${baseUrl}/icons/complete_orders.png` },
        { name: 'Assigned Orders', totalAmount: assignedOrders, imageIcon: `${baseUrl}/icons/assigned_orders.png` },
        { name: 'In Progress Orders', totalAmount: inProgressOrders, imageIcon: `${baseUrl}/icons/in_progress_orders.png` },
        { name: 'Cancel Orders', totalAmount: cancelOrders, imageIcon: `${baseUrl}/icons/cancel_orders.png` },
        { name: 'Total Supporters', totalAmount: totalSupporters, imageIcon: `${baseUrl}/icons/supporters.png` },
        { name: 'Subscription Earnings', totalAmount: subEarningsVal, imageIcon: `${baseUrl}/icons/subscription_earnings.png` },
        { name: 'Order Earnings', totalAmount: orderEarningsVal, imageIcon: `${baseUrl}/icons/order_earnings.png` }
      ]
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
