const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to map DB partner object to API partner object (lists, doubles, booleans)
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

// GET all partners (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { name, mobile, city, state, date, status, isApproved } = req.query;
    let query = 'SELECT * FROM partners WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (mobile) {
      query += ' AND mobile LIKE ?';
      params.push(`%${mobile}%`);
    }
    if (city) {
      query += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }
    if (state) {
      query += ' AND state LIKE ?';
      params.push(`%${state}%`);
    }
    if (date) {
      query += ' AND createdAt LIKE ?';
      params.push(`%${date}%`);
    }
    if (status !== undefined) {
      const statusVal = (status === 'true' || status === '1') ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusVal);
    }
    if (isApproved !== undefined) {
      const isApprovedVal = (isApproved === 'true' || isApproved === '1') ? 1 : 0;
      query += ' AND isApproved = ?';
      params.push(isApprovedVal);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(mapPartner)
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partners', error: error.message });
  }
});

// POST create partner
router.post('/', async (req, res) => {
  const {
    name, email, mobile, city, state, locality, address, image,
    gender, experience, services, aadhaarNumber, panNumber,
    bankName, accountNumber, ifscCode, documents
  } = req.body;

  if (!name || !email || !mobile || !city || !state || !locality || !address) {
    return res.status(400).json({ success: false, message: 'Missing basic partner details' });
  }

  // Convert array lists to comma separated string if provided as array
  const servicesStr = Array.isArray(services) ? services.join(',') : (services || '');
  const docsStr = Array.isArray(documents) ? documents.join(',') : (documents || '');
  const imageVal = image || '';
  const genderVal = gender || 'Male';
  const expVal = experience || '0 Years';
  const aadhaarVal = aadhaarNumber || '';
  const panVal = panNumber || '';
  const bankVal = bankName || '';
  const accVal = accountNumber || '';
  const ifscVal = ifscCode || '';
  const createdDate = new Date().toLocaleDateString('en-IN');

  try {
    const [result] = await db.query(
      `INSERT INTO partners (
        name, email, mobile, city, state, locality, address, image,
        status, isApproved, gender, experience, services,
        aadhaarNumber, panNumber, bankName, accountNumber, ifscCode, documents,
        walletBalance, totalEarnings, withdrawnAmount,
        totalBookings, completedBookings, cancelledBookings, pendingBookings,
        rating, totalReviews, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, 0, 0, 0, 0, 0.0, 0, ?)`,
      [
        name, email, mobile, city, state, locality, address, imageVal,
        genderVal, expVal, servicesStr, aadhaarVal, panVal, bankVal, accVal, ifscVal, docsStr, createdDate
      ]
    );

    const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Partner registered successfully',
      data: mapPartner(rows[0])
    });
  } catch (error) {
    console.error('Error registering partner:', error);
    res.status(500).json({ success: false, message: 'Failed to register partner', error: error.message });
  }
});

// GET pending approval partners (with optional search/filtering)
router.get('/pending', async (req, res) => {
  try {
    const { name, mobile, city, state, date, status } = req.query;
    let query = 'SELECT * FROM partners WHERE isApproved = 0';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (mobile) {
      query += ' AND mobile LIKE ?';
      params.push(`%${mobile}%`);
    }
    if (city) {
      query += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }
    if (state) {
      query += ' AND state LIKE ?';
      params.push(`%${state}%`);
    }
    if (date) {
      query += ' AND createdAt LIKE ?';
      params.push(`%${date}%`);
    }
    if (status !== undefined) {
      const statusVal = (status === 'true' || status === '1') ? 1 : 0;
      query += ' AND status = ?';
      params.push(statusVal);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows.map(mapPartner)
    });
  } catch (error) {
    console.error('Error fetching pending partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending partners', error: error.message });
  }
});

// PUT approve partner
router.put('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE partners SET isApproved = 1, status = 1 WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Partner approved successfully',
      data: mapPartner(rows[0])
    });
  } catch (error) {
    console.error('Error approving partner:', error);
    res.status(500).json({ success: false, message: 'Failed to approve partner', error: error.message });
  }
});

// PUT disapprove partner
router.put('/:id/disapprove', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE partners SET isApproved = 0 WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Partner disapproved successfully',
      data: mapPartner(rows[0])
    });
  } catch (error) {
    console.error('Error disapproving partner:', error);
    res.status(500).json({ success: false, message: 'Failed to disapprove partner', error: error.message });
  }
});

// GET single partner details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.json({
      success: true,
      data: mapPartner(rows[0])
    });
  } catch (error) {
    console.error('Error fetching partner details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner details', error: error.message });
  }
});

// PUT update partner details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const fields = [];
    const values = [];

    // Map each field dynamically if provided
    Object.keys(body).forEach(key => {
      // Exclude read-only columns
      if (['id', 'createdAt'].includes(key)) return;

      let val = body[key];
      if (key === 'services' || key === 'documents') {
        if (Array.isArray(val)) {
          val = val.join(',');
        }
      } else if (key === 'status' || key === 'isApproved') {
        val = (val === true || val === 1 || val === 'true') ? 1 : 0;
      } else if (['walletBalance', 'totalEarnings', 'withdrawnAmount', 'rating'].includes(key)) {
        val = parseFloat(val);
      } else if (['totalBookings', 'completedBookings', 'cancelledBookings', 'pendingBookings', 'totalReviews'].includes(key)) {
        val = parseInt(val);
      }

      fields.push(`\`${key}\` = ?`);
      values.push(val);
    });

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE partners SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Retrieve updated partner
    const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: mapPartner(rows[0])
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to update partner', error: error.message });
  }
});

// DELETE partner
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM partners WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ success: false, message: 'Failed to delete partner', error: error.message });
  }
});

module.exports = router;
