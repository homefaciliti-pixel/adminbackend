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

// CACHE memory STORAGE FOR DASHBOARD STATS
let dashboardStatsCache = null;
let dashboardCacheTimestamp = null;
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000; // Cache lives for 2 minutes

function clearDashboardCache() {
  dashboardStatsCache = null;
  dashboardCacheTimestamp = null;
}

// GET dashboard statistics - all queries run in parallel for maximum performance
router.get('/', async (req, res) => {
  try {
    // Check if valid cache exists
    if (dashboardStatsCache && (Date.now() - dashboardCacheTimestamp < DASHBOARD_CACHE_TTL)) {
      return res.json({
        success: true,
        source: 'cache',
        data: dashboardStatsCache
      });
    }

    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const todayStr = getTodayDateString();


    const [
      [nodeUsersV2Rows],
      [nodeUsersRows],
      [catRows],
      [serviceRows],
      [nodePartnersRows],
      [orderCountsRows],
      [todayOrdersRows],
      [subEarningsRows],
      [orderEarningsRows],
      [supportRows],
      [laravelUsersRows],
      [laravelPartnersRows]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM node_users_v2'),
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM categories'),
      db.query('SELECT COUNT(*) as count FROM services'),
      db.query('SELECT COUNT(*) as count FROM partners'),
      db.query(`
        SELECT 
          SUM(status = 'Completed') as completeOrders,
          SUM(status = 'Assigned') as assignedOrders,
          SUM(status = 'In Progress') as inProgressOrders,
          SUM(status = 'Cancelled') as cancelOrders,
          COUNT(*) as totalOrders
        FROM orders
      `),
      db.query('SELECT COUNT(*) as count FROM orders WHERE serviceDate = ?', [todayStr]),
      db.query('SELECT SUM(amount) as total FROM subscription_earnings'),
      db.query('SELECT SUM(totalAmount) as total FROM booking_earnings'),
      db.query('SELECT COUNT(*) as count FROM support_tickets'),
      db.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`),
      db.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`users\` WHERE role_id = 2`)
    ]);

    // const [rows] = await db.query(`
    //   SELECT
    //     (SELECT COUNT(*) FROM node_users_v2) AS nodeUsersV2Count,
    //     (SELECT COUNT(*) FROM users) AS nodeUsersCount,
    //     (SELECT COUNT(*) FROM categories) AS totalCategories,
    //     (SELECT COUNT(*) FROM services) AS totalServices,
    //     (SELECT COUNT(*) FROM partners) AS nodePartnersCount,
    //     (SELECT COUNT(*) FROM orders) AS totalOrders,
    //     (SELECT COUNT(*) FROM orders WHERE status = 'Completed') AS completeOrders,
    //     (SELECT COUNT(*) FROM orders WHERE status = 'Assigned') AS assignedOrders,
    //     (SELECT COUNT(*) FROM orders WHERE status = 'In Progress') AS inProgressOrders,
    //     (SELECT COUNT(*) FROM orders WHERE status = 'Cancelled') AS cancelOrders,
    //     (SELECT COUNT(*) FROM orders WHERE serviceDate = ?) AS todayOrders,
    //     (SELECT SUM(amount) FROM subscription_earnings) AS subEarningsVal,
    //     (SELECT SUM(totalAmount) FROM booking_earnings) AS orderEarningsVal,
    //     (SELECT COUNT(*) FROM support_tickets) AS totalSupporters,
    //     (SELECT COUNT(*) FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL) AS laravelUsersCount,
    //     (SELECT COUNT(*) FROM \`${dbName}\`.\`users\` WHERE role_id = 2) AS laravelPartnersCount
    // `, [todayStr]);

    const nodeUsersV2Count = parseInt(nodeUsersV2Rows[0]?.count || 0);
    const nodeUsersCount = parseInt(nodeUsersRows[0]?.count || 0);
    const totalCategories = parseInt(catRows[0]?.count || 0);
    const totalServices = parseInt(serviceRows[0]?.count || 0);
    const nodePartnersCount = parseInt(nodePartnersRows[0]?.count || 0);

    const orderStats = orderCountsRows[0] || {};
    const totalOrders = parseInt(orderStats.totalOrders || 0);
    const completeOrders = parseInt(orderStats.completeOrders || 0);
    const assignedOrders = parseInt(orderStats.assignedOrders || 0);
    const inProgressOrders = parseInt(orderStats.inProgressOrders || 0);
    const cancelOrders = parseInt(orderStats.cancelOrders || 0);

    const todayOrders = parseInt(todayOrdersRows[0]?.count || 0);
    const subEarningsVal = parseFloat(subEarningsRows[0]?.total || 0);
    const orderEarningsVal = parseFloat(orderEarningsRows[0]?.total || 0);
    const totalSupporters = parseInt(supportRows[0]?.count || 0);
    const laravelUsersCount = parseInt(laravelUsersRows[0]?.count || 0);
    const laravelPartnersCount = parseInt(laravelPartnersRows[0]?.count || 0);


    // const nodeUsersV2Count = parseInt(r.nodeUsersV2Count || 0);
    // const nodeUsersCount = parseInt(r.nodeUsersCount || 0);
    // const laravelUsersCount = parseInt(r.laravelUsersCount || 0);
    // const totalCategories = parseInt(r.totalCategories || 0);
    // const totalServices = parseInt(r.totalServices || 0);
    // const nodePartnersCount = parseInt(r.nodePartnersCount || 0);
    // const laravelPartnersCount = parseInt(r.laravelPartnersCount || 0);
    // const totalOrders = parseInt(r.totalOrders || 0);
    // const completeOrders = parseInt(r.completeOrders || 0);
    // const assignedOrders = parseInt(r.assignedOrders || 0);
    // const inProgressOrders = parseInt(r.inProgressOrders || 0);
    // const cancelOrders = parseInt(r.cancelOrders || 0);
    // const todayOrders = parseInt(r.todayOrders || 0);
    // const subEarningsVal = parseFloat(r.subEarningsVal || 0);
    // const orderEarningsVal = parseFloat(r.orderEarningsVal || 0);
    // const totalSupporters = parseInt(r.totalSupporters || 0);

    const totalUsers = nodeUsersV2Count + nodeUsersCount + laravelUsersCount;
    const totalPartners = nodePartnersCount + laravelPartnersCount;

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const responseData = [
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
    ];

    // Save to cache
    dashboardStatsCache = responseData;
    dashboardCacheTimestamp = Date.now();

    res.json({
      success: true,
      source: 'database',
      data: responseData
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

// GET /api/dashboard/pending-partners - Fetch list of pending approval partners
router.get('/pending-partners', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';

    // Fetch all required data in parallel to optimize DB load latency
    const [
      [nodeRows],
      [laravelRows],
      [catRows],
      [serviceRows]
    ] = await Promise.all([
      db.query('SELECT * FROM partners WHERE isApproved = 0 OR isApproved IS NULL'),

      db.query(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.mobile_number AS mobile, 
          s.name AS state, 
          c.name AS city, 
          l.name AS locality,
          u.address, 
          u.image, 
          u.status, 
          u.is_approval AS isApproved, 
          u.gender, 
          u.experience, 
          u.service_id AS services, 
          u.aadhaar_number AS aadhaarNumber, 
          u.aadhaar_front_image AS aadharFront, 
          u.aadhaar_back_image AS aadharBack, 
          u.pan_number AS panNumber, 
          u.pan_image AS panImage, 
          u.bank_name AS bankName, 
          u.account_number AS accountNumber, 
          u.ifsc_code AS ifscCode, 
          u.created_at AS createdAt,
          u.do_you_have_vehicle AS hasVehicle,
          u.category_id,
          u.sub_category_id,
          u.account_holder_name AS accountHolder,
          u.payment_status AS isPaid
        FROM \`${dbName}\`.\`users\` u
        LEFT JOIN \`${dbName}\`.\`states\` s ON u.state_id = s.id
        LEFT JOIN \`${dbName}\`.\`cities\` c ON u.city_id = c.id
        LEFT JOIN \`${dbName}\`.\`localities\` l ON u.locality_id = l.id
        WHERE u.role_id = 2 AND (u.is_approval = 0 OR u.is_approval IS NULL)
      `),
      db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``),
      db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``)
    ]);

    const catMap = {};
    catRows.forEach(row => {
      catMap[row.id] = row.title;
    });

    const serviceMap = {};
    serviceRows.forEach(row => {
      serviceMap[row.id] = row.title;
    });

    const list = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const mapPartner = (p, source) => {
      let mappedServices = '';
      if (p.services) {
        mappedServices = p.services
          .split(',')
          .map(id => serviceMap[id.trim()])
          .filter(Boolean)
          .join(',');
      }

      return {
        id: source === 'laravel' ? p.id + 10000000 : p.id,
        name: p.name || '',
        email: p.email || '',
        mobile: p.mobile || '',
        countryCode: p.countryCode || '+91',
        city: p.city || '',
        state: p.state || '',
        locality: p.locality || '',
        address: p.address || '',
        image: p.image ? (p.image.startsWith('http') ? p.image : `${baseUrl}/uploads/${p.image}`) : '',
        status: p.status === 1 || p.status === true,
        isApproved: false,
        gender: p.gender || '',
        experience: p.experience || '',
        services: mappedServices,
        aadhaarNumber: p.aadhaarNumber || '',
        panNumber: p.panNumber || '',
        bankName: p.bankName || '',
        accountNumber: p.accountNumber || '',
        ifscCode: p.ifscCode || '',
        aadharFront: p.aadharFront ? (p.aadharFront.startsWith('http') ? p.aadharFront : `${baseUrl}/uploads/${p.aadharFront}`) : '',
        aadharBack: p.aadharBack ? (p.aadharBack.startsWith('http') ? p.aadharBack : `${baseUrl}/uploads/${p.aadharBack}`) : '',
        panImage: p.panImage ? (p.panImage.startsWith('http') ? p.panImage : `${baseUrl}/uploads/${p.panImage}`) : '',
        policeVerificationImage: p.policeVerificationImage ? (p.policeVerificationImage.startsWith('http') ? p.policeVerificationImage : `${baseUrl}/uploads/${p.policeVerificationImage}`) : '',
        hasVehicle: (p.hasVehicle === 1 || p.hasVehicle === '1') ? 'Yes' : 'No',
        category: catMap[p.category_id] || p.category || '',
        subCategory: catMap[p.sub_category_id] || p.subCategory || '',
        accountHolder: p.accountHolder || '',
        isPaid: (p.isPaid === 1 || p.isPaid === '1' || p.isPaid === true || p.isPaid === 'Paid') ? 'Paid' : 'Unpaid',
        source: source === 'laravel' ? 'App Partner (Laravel)' : 'Admin Partner (MySQL)'
      };
    };

    nodeRows.forEach(r => {
      list.push(mapPartner(r, 'node'));
    });

    laravelRows.forEach(r => {
      list.push(mapPartner(r, 'laravel'));
    });

    list.sort((a, b) => b.id - a.id);

    // ✅ THE CORRECTION: Add optional pagination so the list never gets too heavy
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedList = list.slice(startIndex, endIndex);

    res.json({
      success: true,
      total: list.length,
      page,
      pages: Math.ceil(list.length / limit),
      data: paginatedList
    });
  } catch (error) {
    console.error('Error fetching dashboard pending partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending partners', error: error.message });
  }
});

module.exports = router;
