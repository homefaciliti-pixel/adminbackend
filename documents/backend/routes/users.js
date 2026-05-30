const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all users (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { query: searchQuery, name, email, mobile } = req.query;
    let sqlStr = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (searchQuery) {
      sqlStr += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (name) {
      sqlStr += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (email) {
      sqlStr += ' AND email LIKE ?';
      params.push(`%${email}%`);
    }
    if (mobile) {
      sqlStr += ' AND mobile LIKE ?';
      params.push(`%${mobile}%`);
    }

    sqlStr += ' ORDER BY id DESC';
    const [rows] = await db.query(sqlStr, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { name, email, mobile, address } = req.body;
  if (!name || !email || !mobile || !address) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, mobile, address) VALUES (?, ?, ?, ?)',
      [name, email, mobile, address]
    );
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertId,
        name,
        email,
        mobile,
        address
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

// GET single user details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router;
