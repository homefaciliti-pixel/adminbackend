const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all support tickets (with optional search)
router.get('/', async (req, res) => {
  try {
    const { query: searchQuery, status } = req.query;
    let sqlStr = 'SELECT * FROM support_tickets WHERE 1=1';
    const params = [];

    if (searchQuery) {
      sqlStr += ' AND (userName LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (status) {
      sqlStr += ' AND status = ?';
      params.push(status);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch support tickets', error: error.message });
  }
});

// GET single support ticket details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket details', error: error.message });
  }
});

// POST add support ticket
router.post('/', async (req, res) => {
  const { userName, email, mobile, subject, message } = req.body;
  if (!userName || !email || !mobile || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const createdAtStr = new Date().toLocaleDateString('en-IN');
  try {
    const [result] = await db.query(
      'INSERT INTO support_tickets (userName, email, mobile, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, "Open", ?)',
      [userName, email, mobile, subject, message, createdAtStr]
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket logged successfully',
      data: {
        id: result.insertId,
        userName,
        email,
        mobile,
        subject,
        message,
        status: 'Open',
        createdAt: createdAtStr
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create support ticket', error: error.message });
  }
});

// PUT update support ticket details (e.g. update status/resolve)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { userName, email, mobile, subject, message, status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (userName !== undefined) { fields.push('`userName` = ?'); values.push(userName); }
    if (email !== undefined) { fields.push('`email` = ?'); values.push(email); }
    if (mobile !== undefined) { fields.push('`mobile` = ?'); values.push(mobile); }
    if (subject !== undefined) { fields.push('`subject` = ?'); values.push(subject); }
    if (message !== undefined) { fields.push('`message` = ?'); values.push(message); }
    if (status !== undefined) { fields.push('`status` = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const [rows] = await db.query('SELECT * FROM support_tickets WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
});

// DELETE support ticket
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM support_tickets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete ticket', error: error.message });
  }
});

module.exports = router;
