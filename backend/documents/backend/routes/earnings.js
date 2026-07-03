const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all booking earnings (with search & aggregates)
router.get('/bookings', async (req, res) => {
  try {
    const { query: searchQuery, transactionId, paymentMethod, orderDate } = req.query;

    // 1. Overall stats
    const [overallRes] = await db.query('SELECT SUM(totalAmount) as totalAmount, COUNT(*) as totalCount FROM booking_earnings');
    const totalBookingEarnings = parseFloat(overallRes[0].totalAmount || 0);
    const totalTransactions = parseInt(overallRes[0].totalCount || 0);

    // 2. Build filtered query
    let queryStr = 'SELECT * FROM booking_earnings WHERE 1=1';
    const params = [];

    if (searchQuery) {
      queryStr += ' AND (transactionId LIKE ? OR paymentMethod LIKE ? OR extraServicePaymentMethod LIKE ? OR orderDate LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (transactionId) {
      queryStr += ' AND transactionId LIKE ?';
      params.push(`%${transactionId}%`);
    }
    if (paymentMethod) {
      queryStr += ' AND paymentMethod LIKE ?';
      params.push(`%${paymentMethod}%`);
    }
    if (orderDate) {
      queryStr += ' AND orderDate LIKE ?';
      params.push(`%${orderDate}%`);
    }

    queryStr += ' ORDER BY id DESC';
    const [rows] = await db.query(queryStr, params);

    // Mapped results
    const mapped = rows.map(r => ({
      ...r,
      serviceAmount: parseFloat(r.serviceAmount),
      extraServiceAmount: parseFloat(r.extraServiceAmount),
      totalAmount: parseFloat(r.totalAmount)
    }));

    // Filtered stats
    const filteredBookingEarnings = mapped.reduce((sum, r) => sum + r.totalAmount, 0);
    const filteredTransactions = mapped.length;

    res.json({
      success: true,
      totalBookingEarnings,
      totalTransactions,
      filteredBookingEarnings,
      filteredTransactions,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching booking earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking earnings', error: error.message });
  }
});

// POST add booking earning
router.post('/bookings', async (req, res) => {
  const { transactionId, serviceAmount, paymentMethod, extraServiceAmount, extraServicePaymentMethod, totalAmount, orderDate } = req.body;
  
  if (!transactionId || serviceAmount === undefined || !paymentMethod || totalAmount === undefined || !orderDate) {
    return res.status(400).json({ success: false, message: 'Missing transaction details' });
  }

  const sAmt = parseFloat(serviceAmount);
  const eAmt = parseFloat(extraServiceAmount || 0);
  const tAmt = parseFloat(totalAmount);
  const ePayMethod = extraServicePaymentMethod || '-';

  try {
    const [result] = await db.query(
      `INSERT INTO booking_earnings 
      (transactionId, serviceAmount, paymentMethod, extraServiceAmount, extraServicePaymentMethod, totalAmount, orderDate) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, sAmt, paymentMethod, eAmt, ePayMethod, tAmt, orderDate]
    );

    res.status(201).json({
      success: true,
      message: 'Booking transaction logged successfully',
      data: {
        id: result.insertId,
        transactionId,
        serviceAmount: sAmt,
        paymentMethod,
        extraServiceAmount: eAmt,
        extraServicePaymentMethod: ePayMethod,
        totalAmount: tAmt,
        orderDate
      }
    });
  } catch (error) {
    console.error('Error logging booking earning:', error);
    res.status(500).json({ success: false, message: 'Failed to log booking transaction', error: error.message });
  }
});

// GET all subscription earnings (with search & aggregates)
router.get('/subscriptions', async (req, res) => {
  try {
    const { query: searchQuery, partnerName, paymentMethod, status, purchaseDate } = req.query;

    // 1. Overall stats
    const [overallRes] = await db.query('SELECT SUM(amount) as totalAmount, COUNT(*) as totalCount FROM subscription_earnings');
    const totalSubscriptionsEarnings = parseFloat(overallRes[0].totalAmount || 0);
    const totalPlans = parseInt(overallRes[0].totalCount || 0);

    // 2. Build filtered query
    let queryStr = 'SELECT * FROM subscription_earnings WHERE 1=1';
    const params = [];

    if (searchQuery) {
      queryStr += ' AND (partnerName LIKE ? OR paymentMethod LIKE ? OR status LIKE ? OR purchaseDate LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (partnerName) {
      queryStr += ' AND partnerName LIKE ?';
      params.push(`%${partnerName}%`);
    }
    if (paymentMethod) {
      queryStr += ' AND paymentMethod LIKE ?';
      params.push(`%${paymentMethod}%`);
    }
    if (status) {
      queryStr += ' AND status = ?';
      params.push(status);
    }
    if (purchaseDate) {
      queryStr += ' AND purchaseDate LIKE ?';
      params.push(`%${purchaseDate}%`);
    }

    queryStr += ' ORDER BY id DESC';
    const [rows] = await db.query(queryStr, params);

    // Mapped results
    const mapped = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));

    // Filtered stats
    const filteredSubscriptionsEarnings = mapped.reduce((sum, r) => sum + r.amount, 0);
    const filteredPlans = mapped.length;

    res.json({
      success: true,
      totalSubscriptionsEarnings,
      totalPlans,
      filteredSubscriptionsEarnings,
      filteredPlans,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching subscription earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription earnings', error: error.message });
  }
});

// POST add subscription earning
router.post('/subscriptions', async (req, res) => {
  const { partnerName, amount, paymentMethod, purchaseDate, status } = req.body;
  
  if (!partnerName || amount === undefined || !paymentMethod || !purchaseDate || !status) {
    return res.status(400).json({ success: false, message: 'Missing subscription details' });
  }

  const amt = parseFloat(amount);

  try {
    const [result] = await db.query(
      `INSERT INTO subscription_earnings 
      (partnerName, amount, paymentMethod, purchaseDate, status) 
      VALUES (?, ?, ?, ?, ?)`,
      [partnerName, amt, paymentMethod, purchaseDate, status]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription purchase logged successfully',
      data: {
        id: result.insertId,
        partnerName,
        amount: amt,
        paymentMethod,
        purchaseDate,
        status
      }
    });
  } catch (error) {
    console.error('Error logging subscription earning:', error);
    res.status(500).json({ success: false, message: 'Failed to log subscription transaction', error: error.message });
  }
});

module.exports = router;
