const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all booking earnings
router.get('/bookings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM booking_earnings ORDER BY id DESC');
    const mapped = rows.map(r => ({
      ...r,
      serviceAmount: parseFloat(r.serviceAmount),
      extraServiceAmount: parseFloat(r.extraServiceAmount),
      totalAmount: parseFloat(r.totalAmount)
    }));
    res.json({
      success: true,
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

// GET all subscription earnings
router.get('/subscriptions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subscription_earnings ORDER BY id DESC');
    const mapped = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
    res.json({
      success: true,
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
