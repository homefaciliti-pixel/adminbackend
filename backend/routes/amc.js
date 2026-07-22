const express = require('express');
const router = express.Router();
const db = require('../db');

// --- DATABASE TABLE INITIALIZATION ---
(async () => {
  try {
    // 1. node_amc_subscriptions
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`node_amc_subscriptions\` (
        \`amcId\` VARCHAR(50) PRIMARY KEY,
        \`userPhone\` VARCHAR(20) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`areaSqFt\` INT NOT NULL,
        \`floors\` INT NOT NULL,
        \`price\` DECIMAL(10,2) NOT NULL,
        \`status\` VARCHAR(20) DEFAULT 'active',
        \`startDate\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`endDate\` TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
        \`photoUrl\` VARCHAR(500),
        \`pdfUrl\` VARCHAR(500),
        \`note\` TEXT,
        \`fileUrl\` VARCHAR(500),
        \`razorpayOrderId\` VARCHAR(100),
        \`razorpayPaymentId\` VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. node_amc_visits
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`node_amc_visits\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`amcId\` VARCHAR(50) NOT NULL,
        \`userPhone\` VARCHAR(20) NOT NULL,
        \`scheduledDate\` DATE NOT NULL,
        \`timeSlot\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(20) DEFAULT 'pending',
        \`partnerName\` VARCHAR(100),
        \`partnerPhone\` VARCHAR(20),
        \`serviceName\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`images\` TEXT,
        \`otp\` VARCHAR(6),
        \`completedAt\` TIMESTAMP NULL,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. node_amc_partner_payments
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`node_amc_partner_payments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`visitId\` INT NOT NULL,
        \`amcId\` VARCHAR(50) NOT NULL,
        \`partnerPhone\` VARCHAR(20) NOT NULL,
        \`partnerName\` VARCHAR(100) NOT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`status\` VARCHAR(20) DEFAULT 'pending',
        \`releasedAt\` TIMESTAMP NULL,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ AMC module database tables initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize AMC tables:', err.message);
  }
})();


// ======================================================================
// 1. DASHBOARD APIS
// ======================================================================

// GET /api/amc/dashboard - Summary stats
router.get('/dashboard', async (req, res) => {
  try {
    const [[subStats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' AND endDate >= NOW() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' OR endDate < NOW() THEN 1 ELSE 0 END) as expired,
        SUM(price) as totalRevenue
      FROM node_amc_subscriptions
    `);

    const [[visitStats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(scheduledDate) = CURDATE() THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM node_amc_visits
    `);

    res.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalAmc: subStats.total || 0,
        activeAmc: subStats.active || 0,
        expiredAmc: subStats.expired || 0,
        totalVisits: visitStats.total || 0,
        todayVisits: visitStats.today || 0,
        pendingVisits: visitStats.pending || 0,
        revenue: parseFloat(subStats.totalRevenue || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats', error: err.message });
  }
});

// GET /api/amc/dashboard/recent-orders
router.get('/dashboard/recent-orders', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT * FROM node_orders_v2 
      WHERE amcId IS NOT NULL 
      ORDER BY id DESC LIMIT 5
    `);
    res.json({ success: true, message: 'Recent orders retrieved successfully', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recent orders', error: err.message });
  }
});

// GET /api/amc/dashboard/today-visits
router.get('/dashboard/today-visits', async (req, res) => {
  try {
    const [visits] = await db.query(`
      SELECT * FROM node_amc_visits 
      WHERE DATE(scheduledDate) = CURDATE() 
      ORDER BY id DESC
    `);
    res.json({ success: true, message: 'Today\'s visits retrieved successfully', data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve today\'s visits', error: err.message });
  }
});

// GET /api/amc/dashboard/renew-alerts
router.get('/dashboard/renew-alerts', async (req, res) => {
  try {
    // Contracts expiring in next 30 days
    const [alerts] = await db.query(`
      SELECT * FROM node_amc_subscriptions 
      WHERE status = 'active' AND endDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      ORDER BY endDate ASC
    `);
    res.json({ success: true, message: 'Renewal alerts retrieved successfully', data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve renewal alerts', error: err.message });
  }
});

// GET /api/amc/dashboard/recent-activities
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    // Combine recent subscriptions and completed visits into an activity stream
    const [subs] = await db.query('SELECT amcId, userPhone, startDate as timestamp, "subscription" as type FROM node_amc_subscriptions ORDER BY startDate DESC LIMIT 5');
    const [visits] = await db.query('SELECT id, amcId, serviceName, completedAt as timestamp, "visit_completed" as type FROM node_amc_visits WHERE status = "completed" ORDER BY completedAt DESC LIMIT 5');
    
    const activities = [...subs, ...visits]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    res.json({ success: true, message: 'Recent activities retrieved successfully', data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve recent activities', error: err.message });
  }
});


// ======================================================================
// 2. LIST SUBSCRIPTIONS (STATIC FIRST)
// ======================================================================

// GET /api/amc/active - Paginated active contracts
router.get('/active', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    let query = `SELECT * FROM node_amc_subscriptions WHERE status = 'active' AND endDate >= NOW()`;
    const params = [];

    if (search) {
      query += ` AND (amcId LIKE ? OR userPhone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY startDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    res.json({ success: true, message: 'Active subscriptions retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve active subscriptions', error: err.message });
  }
});

// GET /api/amc/expired - Paginated expired contracts
router.get('/expired', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    let query = `SELECT * FROM node_amc_subscriptions WHERE status = 'expired' OR endDate < NOW()`;
    const params = [];

    if (search) {
      query += ` AND (amcId LIKE ? OR userPhone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY endDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    res.json({ success: true, message: 'Expired subscriptions retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve expired subscriptions', error: err.message });
  }
});


// ======================================================================
// 3. SERVICE VISITS APIS
// ======================================================================

// GET /api/amc/visits - List all visits
router.get('/visits', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_amc_visits ORDER BY id DESC');
    res.json({ success: true, message: 'Visits retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visits list', error: err.message });
  }
});

// GET /api/amc/visits/:visitId - Visit details
router.get('/visits/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_amc_visits WHERE id = ?', [visitId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, message: 'Visit details retrieved successfully', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visit details', error: err.message });
  }
});

// GET /api/amc/visits/:visitId/images - Visit images
router.get('/visits/:visitId/images', async (req, res) => {
  try {
    const { visitId } = req.params;
    const [rows] = await db.query('SELECT images FROM node_amc_visits WHERE id = ?', [visitId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    const imgStr = rows[0].images || '';
    const list = imgStr ? imgStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    res.json({ success: true, message: 'Visit images retrieved successfully', data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve visit images', error: err.message });
  }
});


// ======================================================================
// 4. ORDERS INTEGRATION APIS
// ======================================================================

// GET /api/amc/orders - Fetch AMC orders
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE amcId IS NOT NULL ORDER BY id DESC');
    res.json({ success: true, message: 'AMC orders retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AMC orders', error: err.message });
  }
});

// POST /api/amc/orders/assign-partner - Assign partner
router.post('/orders/assign-partner', async (req, res) => {
  try {
    const { orderId, visitId, partnerPhone, partnerName } = req.body;
    
    if (!partnerPhone || !partnerName) {
      return res.status(400).json({ success: false, message: 'Partner details (name and phone) are required' });
    }

    if (visitId) {
      await db.query(`
        UPDATE node_amc_visits 
        SET partnerName = ?, partnerPhone = ?, status = 'assigned'
        WHERE id = ?
      `, [partnerName, partnerPhone, visitId]);
    }

    if (orderId) {
      await db.query(`
        UPDATE node_orders_v2 
        SET partnerName = ?, status = 'Assigned', bookingStatus = 'assigned'
        WHERE id = ?
      `, [partnerName, orderId]);
    }

    res.json({ success: true, message: 'Partner assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign partner', error: err.message });
  }
});

// GET /api/amc/orders/:orderId - AMC order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_orders_v2 WHERE id = ? AND amcId IS NOT NULL', [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'AMC order not found' });
    }
    res.json({ success: true, message: 'AMC order retrieved successfully', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AMC order details', error: err.message });
  }
});

// PUT /api/amc/orders/:orderId/change-partner
router.put('/orders/:orderId/change-partner', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerPhone, partnerName } = req.body;

    if (!partnerPhone || !partnerName) {
      return res.status(400).json({ success: false, message: 'Partner details are required' });
    }

    await db.query(`
      UPDATE node_orders_v2 
      SET partnerName = ?, status = 'Assigned', bookingStatus = 'assigned'
      WHERE id = ?
    `, [partnerName, orderId]);

    // Sync to visit too
    await db.query(`
      UPDATE node_amc_visits 
      SET partnerName = ?, partnerPhone = ?, status = 'assigned'
      WHERE amcId = (SELECT amcId FROM node_orders_v2 WHERE id = ? LIMIT 1) 
      AND (status = 'assigned' OR status = 'pending')
    `, [partnerName, partnerPhone, orderId]);

    res.json({ success: true, message: 'Partner changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change partner', error: err.message });
  }
});

// PUT /api/amc/orders/:orderId/status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    await db.query('UPDATE node_orders_v2 SET status = ? WHERE id = ?', [status, orderId]);

    // Sync status to visit
    const [orders] = await db.query('SELECT amcId, partnerName, serviceName FROM node_orders_v2 WHERE id = ?', [orderId]);
    if (orders.length > 0) {
      const order = orders[0];
      const visitStatus = status.toLowerCase() === 'completed' ? 'completed' : 'assigned';
      
      const updateVisitSql = status.toLowerCase() === 'completed' 
        ? `UPDATE node_amc_visits SET status = ?, completedAt = NOW() WHERE amcId = ? AND serviceName = ?`
        : `UPDATE node_amc_visits SET status = ? WHERE amcId = ? AND serviceName = ?`;
      
      await db.query(updateVisitSql, [visitStatus, order.amcId, order.serviceName]);

      // If completed, trigger partner payment payout creation
      if (status.toLowerCase() === 'completed') {
        const [visits] = await db.query('SELECT id, partnerPhone, partnerName FROM node_amc_visits WHERE amcId = ? AND serviceName = ? ORDER BY id DESC LIMIT 1', [order.amcId, order.serviceName]);
        if (visits.length > 0 && visits[0].partnerPhone) {
          const visit = visits[0];
          await db.query(`
            INSERT INTO node_amc_partner_payments (visitId, amcId, partnerPhone, partnerName, amount, status)
            VALUES (?, ?, ?, ?, 350.00, 'pending')
          `, [visit.id, order.amcId, visit.partnerPhone, visit.partnerName]);
        }
      }
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
});


// ======================================================================
// 5. PARTNER PAYMENTS APIS
// ======================================================================

// GET /api/amc/partner-payments - List partner payments
router.get('/partner-payments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_amc_partner_payments ORDER BY id DESC');
    res.json({ success: true, message: 'Partner payments retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve partner payments', error: err.message });
  }
});

// POST /api/amc/partner-payments/release
router.post('/partner-payments/release', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId parameter is required' });
    }

    const [result] = await db.query(`
      UPDATE node_amc_partner_payments 
      SET status = 'released', releasedAt = NOW()
      WHERE id = ? AND status = 'pending'
    `, [paymentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pending payment record not found or already released' });
    }

    res.json({ success: true, message: 'Partner payment released successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to release partner payment', error: err.message });
  }
});

// GET /api/amc/partner-payments/:id - Details of a payment
router.get('/partner-payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM node_amc_partner_payments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    res.json({ success: true, message: 'Payment record retrieved successfully', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment record', error: err.message });
  }
});


// ======================================================================
// 6. REPORTS APIS
// ======================================================================

// GET /api/amc/reports
router.get('/reports', async (req, res) => {
  try {
    const { type } = req.query; // type = revenue, amc, orders, visits, payments

    if (type === 'revenue') {
      const [rows] = await db.query(`
        SELECT DATE_FORMAT(startDate, '%Y-%m') as month, SUM(price) as revenue, COUNT(*) as subscriptionsSold
        FROM node_amc_subscriptions GROUP BY month ORDER BY month DESC
      `);
      return res.json({ success: true, message: 'Revenue report generated', data: rows });
    }

    if (type === 'amc') {
      const [rows] = await db.query(`
        SELECT status, category, COUNT(*) as count FROM node_amc_subscriptions GROUP BY status, category
      `);
      return res.json({ success: true, message: 'AMC status report generated', data: rows });
    }

    if (type === 'orders') {
      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count FROM node_orders_v2 WHERE amcId IS NOT NULL GROUP BY status
      `);
      return res.json({ success: true, message: 'AMC orders report generated', data: rows });
    }

    if (type === 'visits') {
      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count FROM node_amc_visits GROUP BY status
      `);
      return res.json({ success: true, message: 'Visits status report generated', data: rows });
    }

    if (type === 'payments') {
      const [rows] = await db.query(`
        SELECT status, SUM(amount) as totalAmount, COUNT(*) as count FROM node_amc_partner_payments GROUP BY status
      `);
      return res.json({ success: true, message: 'Partner payments report generated', data: rows });
    }

    // Default fallback to aggregated report overview
    const [[subCount]] = await db.query('SELECT COUNT(*) as count, SUM(price) as revenue FROM node_amc_subscriptions');
    const [[visitCount]] = await db.query('SELECT COUNT(*) as count FROM node_amc_visits');
    const [[releasedPayouts]] = await db.query('SELECT SUM(amount) as total FROM node_amc_partner_payments WHERE status = "released"');

    res.json({
      success: true,
      message: 'AMC Reports summary overview retrieved',
      data: {
        totalSubscriptions: subCount.count || 0,
        totalRevenue: parseFloat(subCount.revenue || 0),
        totalVisits: visitCount.count || 0,
        totalPayoutsReleased: parseFloat(releasedPayouts.total || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
  }
});


// ======================================================================
// 7. NOTIFICATIONS APIS
// ======================================================================

// GET /api/amc/notifications
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM node_notifications WHERE title LIKE "%AMC%" ORDER BY id DESC LIMIT 20');
    res.json({ success: true, message: 'AMC notifications retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: err.message });
  }
});

// PUT /api/amc/notifications/mark-read
router.put('/notifications/mark-read', async (req, res) => {
  try {
    await db.query('UPDATE node_notifications SET isRead = 1 WHERE title LIKE "%AMC%" AND isRead = 0');
    res.json({ success: true, message: 'AMC notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: err.message });
  }
});


// ======================================================================
// 8. GLOBAL SEARCH API
// ======================================================================

// GET /api/amc/search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query q parameter is required' });
    }

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId LIKE ? OR userPhone LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`]);
    const [visits] = await db.query('SELECT * FROM node_amc_visits WHERE amcId LIKE ? OR serviceName LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`]);
    const [orders] = await db.query('SELECT * FROM node_orders_v2 WHERE amcId LIKE ? OR serviceName LIKE ? LIMIT 5', [`%${q}%`, `%${q}%`]);

    res.json({
      success: true,
      message: 'Global search executed successfully',
      data: {
        subscriptions: subs,
        visits: visits,
        orders: orders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Global search failed', error: err.message });
  }
});


// ======================================================================
// 9. PARAMETERIZED AMC SUBSCRIPTION ROUTES (MUST BE AT THE END)
// ======================================================================

// GET /api/amc/:amcId - Single contract details
router.get('/:amcId', async (req, res) => {
  try {
    const { amcId } = req.params;
    const [rows] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    // Fetch customer details if exists
    const [users] = await db.query('SELECT name FROM node_users_v2 WHERE phone = ?', [rows[0].userPhone]);
    const customerName = users.length > 0 ? users[0].name : 'Unknown User';

    res.json({
      success: true,
      message: 'Subscription retrieved successfully',
      data: {
        ...rows[0],
        customerName
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve subscription details', error: err.message });
  }
});

// POST /api/amc/:amcId/renew
router.post('/:amcId/renew', async (req, res) => {
  try {
    const { amcId } = req.params;
    const { planId, note, price, durationMonths } = req.body;

    const [subs] = await db.query('SELECT * FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const currentSub = subs[0];
    const months = parseInt(durationMonths) || 12;
    const renewPrice = parseFloat(price) || parseFloat(currentSub.price);

    // Calculate new endDate
    let baseDate = new Date();
    if (new Date(currentSub.endDate) > new Date()) {
      baseDate = new Date(currentSub.endDate);
    }
    baseDate.setMonth(baseDate.getMonth() + months);
    const newEndDate = baseDate.toISOString().slice(0, 19).replace('T', ' ');

    await db.query(`
      UPDATE node_amc_subscriptions 
      SET status = 'active', price = ?, endDate = ?, note = ?
      WHERE amcId = ?
    `, [renewPrice, newEndDate, note || currentSub.note, amcId]);

    res.json({
      success: true,
      message: 'AMC subscription renewed successfully',
      data: {
        amcId,
        status: 'active',
        endDate: newEndDate,
        price: renewPrice
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to renew AMC subscription', error: err.message });
  }
});

// POST /api/amc/:amcId/book-service
router.post('/:amcId/book-service', async (req, res) => {
  try {
    const { amcId } = req.params;
    const { serviceName, scheduledDate, timeSlot, description } = req.body;

    if (!serviceName || !scheduledDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required booking parameters' });
    }

    const [subs] = await db.query('SELECT userPhone FROM node_amc_subscriptions WHERE amcId = ?', [amcId]);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const userPhone = subs[0].userPhone;

    // 1. Create a Visit record
    const [visitResult] = await db.query(`
      INSERT INTO node_amc_visits (amcId, userPhone, scheduledDate, timeSlot, serviceName, description, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [amcId, userPhone, scheduledDate, timeSlot, serviceName, description || '']);

    // 2. Insert into node_orders_v2 for app/dashboard order listing compatibility
    const initialAddress = JSON.stringify({
      id: 0,
      userPhone: userPhone,
      type: 'Home',
      houseNo: 'AMC Managed Site',
      society: 'AMC Contract Location',
      city: 'Noida',
      locality: 'AMC Locality',
      pincode: '201301',
      name: 'AMC Client'
    });

    const [orderResult] = await db.query(`
      INSERT INTO node_orders_v2 (userPhone, serviceName, price, date, status, bookingStatus, productId, description, timeSlot, address, payment, amcId, createdAt)
      VALUES (?, ?, 0.00, ?, 'Pending', 'searching', ?, ?, ?, ?, '{"paymentMethod":"AMC","amountPaid":0}', ?, ?)
    `, [userPhone, serviceName, scheduledDate, serviceName, description || '', timeSlot, initialAddress, amcId, Date.now()]);

    res.status(201).json({
      success: true,
      message: 'AMC Service visit booked successfully',
      data: {
        visitId: visitResult.insertId,
        orderId: orderResult.insertId,
        amcId,
        serviceName,
        scheduledDate,
        timeSlot
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to book service visit', error: err.message });
  }
});

// GET /api/amc/:amcId/service-history
router.get('/:amcId/service-history', async (req, res) => {
  try {
    const { amcId } = req.params;
    const [rows] = await db.query(`
      SELECT * FROM node_amc_visits 
      WHERE amcId = ? AND status = 'completed'
      ORDER BY completedAt DESC
    `, [amcId]);
    res.json({ success: true, message: 'Service history retrieved successfully', data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve service history', error: err.message });
  }
});

module.exports = router;
