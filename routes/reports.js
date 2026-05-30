const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to convert date parameter (YYYY-MM-DD or DD-MM-YYYY) to standard YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Helper to export dataset to CSV
function exportToCsv(res, filename, columns, data) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Write headers
  let csv = columns.map(c => `"${c.label}"`).join(',') + '\n';
  
  // Write rows
  data.forEach(row => {
    csv += columns.map(c => {
      let val = row[c.key];
      if (val === true) val = 'Yes';
      if (val === false) val = 'No';
      return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
    }).join(',') + '\n';
  });
  
  return res.send(csv);
}

// Helper to format partners mapping lists/doubles
function mapPartner(r) {
  return {
    ...r,
    status: r.status === 1,
    isApproved: r.isApproved === 1,
    services: r.services ? r.services.split(',').map(s => s.trim()).filter(Boolean) : [],
    documents: r.documents ? r.documents.split(',').map(d => d.trim()).filter(Boolean) : [],
    walletBalance: parseFloat(r.walletBalance || 0),
    totalEarnings: parseFloat(r.totalEarnings || 0),
    withdrawnAmount: parseFloat(r.withdrawnAmount || 0),
    totalBookings: parseInt(r.totalBookings || 0),
    completedBookings: parseInt(r.completedBookings || 0),
    cancelledBookings: parseInt(r.cancelledBookings || 0),
    pendingBookings: parseInt(r.pendingBookings || 0),
    rating: parseFloat(r.rating || 0),
    totalReviews: parseInt(r.totalReviews || 0)
  };
}

// 1. Users Report
router.get('/users', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(createdAt, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(createdAt, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);

    if (exportType === 'csv') {
      const columns = [
        { label: 'User ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'Address', key: 'address' },
        { label: 'Joined Date', key: 'createdAt' }
      ];
      return exportToCsv(res, 'users_report.csv', columns, rows);
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users report', error: error.message });
  }
});

// 2. Partners Report
router.get('/partners', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM partners WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(createdAt, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(createdAt, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ? OR city LIKE ? OR state LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    const mapped = rows.map(mapPartner);

    if (exportType === 'csv') {
      const columns = [
        { label: 'Partner ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'City', key: 'city' },
        { label: 'State', key: 'state' },
        { label: 'Status', key: 'status' },
        { label: 'Is Approved', key: 'isApproved' },
        { label: 'Experience', key: 'experience' },
        { label: 'Joined Date', key: 'createdAt' }
      ];
      return exportToCsv(res, 'partners_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch partners report', error: error.message });
  }
});

// 3. Earnings (Bookings) Report
router.get('/earnings', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM booking_earnings WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(orderDate, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(orderDate, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (transactionId LIKE ? OR paymentMethod LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    const mapped = rows.map(r => ({
      ...r,
      serviceAmount: parseFloat(r.serviceAmount),
      extraServiceAmount: parseFloat(r.extraServiceAmount),
      totalAmount: parseFloat(r.totalAmount)
    }));

    if (exportType === 'csv') {
      const columns = [
        { label: 'Transaction ID', key: 'transactionId' },
        { label: 'Service Amount', key: 'serviceAmount' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Extra Service Amount', key: 'extraServiceAmount' },
        { label: 'Extra Payment Method', key: 'extraServicePaymentMethod' },
        { label: 'Total Amount', key: 'totalAmount' },
        { label: 'Date', key: 'orderDate' }
      ];
      return exportToCsv(res, 'bookings_earnings_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings report', error: error.message });
  }
});

// 4. Subscriptions Report
router.get('/subscriptions', async (req, res) => {
  try {
    const { startDate, endDate, query: searchQuery, export: exportType } = req.query;
    if (!startDate || !endDate || searchQuery === undefined || exportType === undefined) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, query, and export parameters are required'
      });
    }
    let sqlStr = 'SELECT * FROM subscription_earnings WHERE 1=1';
    const params = [];

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (normalizedStart) {
      sqlStr += " AND STR_TO_DATE(purchaseDate, '%d-%m-%Y') >= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedStart);
    }
    if (normalizedEnd) {
      sqlStr += " AND STR_TO_DATE(purchaseDate, '%d-%m-%Y') <= STR_TO_DATE(?, '%Y-%m-%d')";
      params.push(normalizedEnd);
    }
    if (searchQuery) {
      sqlStr += ' AND (partnerName LIKE ? OR paymentMethod LIKE ? OR status LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    const mapped = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));

    if (exportType === 'csv') {
      const columns = [
        { label: 'Earning ID', key: 'id' },
        { label: 'Partner Name', key: 'partnerName' },
        { label: 'Amount', key: 'amount' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Purchase Date', key: 'purchaseDate' },
        { label: 'Status', key: 'status' }
      ];
      return exportToCsv(res, 'subscriptions_report.csv', columns, mapped);
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions report', error: error.message });
  }
});

module.exports = router;
