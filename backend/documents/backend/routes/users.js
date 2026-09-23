const express = require('express');
const router = express.Router();
const db = require('../db');

// IN-MEMORY CACHE STORAGE FOR USERS
let usersCache = null;
let usersCacheTimestamp = null;
const USERS_CACHE_TTL = 2 * 60 * 1000; // Cache lives for 2 minutes

function clearUsersCache() {
  usersCache = null;
  usersCacheTimestamp = null;
}

// Unified helper to fetch and normalize all users from all tables in parallel with caching
async function getAllUsers() {
  if (usersCache && (Date.now() - usersCacheTimestamp < USERS_CACHE_TTL)) {
    return usersCache;
  }

  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // Fetch from all three database sources simultaneously in parallel
  const [
    [nodeV2Rows],
    [nodeRows],
    [laravelRows]
  ] = await Promise.all([
    db.query("SELECT phone as mobile, name, email, CONCAT(locality, ' ', location) as address, gender, countryCode FROM node_users_v2").catch(() => [[]]),
    db.query("SELECT id, name, email, mobile, address, createdAt as created_at FROM users").catch(() => [[]]),
    db.query(`SELECT id, name, email, mobile_number as mobile, gender, address, created_at FROM \`${dbName}\`.\`users\` WHERE deleted_at IS NULL`).catch(() => [[]])
  ]);
  
  let allUsers = [];

  // 1. Normalize node_users_v2 (Flutter application users)
  nodeV2Rows.forEach((r, idx) => {
    const numericPhone = parseInt(r.mobile);
    const finalId = isNaN(numericPhone) ? (2000000000 + idx) : numericPhone;
    allUsers.push({
      id: finalId,
      name: r.name || 'Guest User',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: r.gender || '',
      created_at: null,
      source: 'User App (MySQL v2)',
      countryCode: r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91'
    });
  });

  // 2. Normalize node_users (Admin users)
  nodeRows.forEach(r => {
    allUsers.push({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: '',
      created_at: r.created_at,
      source: 'Admin User (MySQL)',
      countryCode: '+91'
    });
  });

  // 3. Normalize Laravel users (App Users)
  laravelRows.forEach(r => {
    allUsers.push({
      id: r.id + 10000000,
      name: r.name || '',
      email: r.email || '',
      mobile: r.mobile || '',
      address: r.address || '',
      gender: r.gender || '',
      created_at: r.created_at,
      source: 'App User (Laravel)',
      countryCode: '+91'
    });
  });

  // Save to cache
  usersCache = allUsers;
  usersCacheTimestamp = Date.now();

  return allUsers;
}

// GET all users (with optional search/filtering & pagination)
router.get('/', async (req, res) => {
  try {
    const { query: searchQuery, name, email, mobile, page = 1, limit = 50 } = req.query;
    let allUsers = await getAllUsers();

    // Apply filters in memory
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      allUsers = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) || 
        (u.mobile && u.mobile.toLowerCase().includes(q))
      );
    }
    if (name) {
      const n = name.toLowerCase();
      allUsers = allUsers.filter(u => u.name && u.name.toLowerCase().includes(n));
    }
    if (email) {
      const e = email.toLowerCase();
      allUsers = allUsers.filter(u => u.email && u.email.toLowerCase().includes(e));
    }
    if (mobile) {
      const m = mobile.toLowerCase();
      allUsers = allUsers.filter(u => u.mobile && u.mobile.toLowerCase().includes(m));
    }

    // Pagination slice
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedList = allUsers.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      total: allUsers.length,
      page: pageNum,
      pages: Math.ceil(allUsers.length / limitNum),
      data: paginatedList
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// GET /search - search users
router.get('/search', async (req, res) => {
  const q = req.query.q || req.query.query || '';
  try {
    let allUsers = await getAllUsers();
    
    if (q.trim() !== '') {
      const searchQ = q.toLowerCase();
      allUsers = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(searchQ)) || 
        (u.email && u.email.toLowerCase().includes(searchQ)) || 
        (u.mobile && u.mobile.toLowerCase().includes(searchQ))
      );
    }

    res.json({ success: true, data: allUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { name, email, mobile, address } = req.body;
  if (!name || !email || !mobile) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }
  try {
    await db.query(
      "INSERT INTO node_users_v2 (phone, name, email, referralCode) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)",
      [mobile, name, email, 'ADM' + Date.now().toString().slice(-6)]
    );

    const [result] = await db.query(
      'INSERT INTO users (name, email, mobile, address) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), address=VALUES(address)',
      [name, email, mobile, address || '']
    );

    // Clear cache immediately after creation
    clearUsersCache();

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
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid User ID format' });
  }
  
  try {
    if (rawId >= 2000000000) {
      const phone = rawId.toString();
      const [rows] = await db.query("SELECT * FROM node_users_v2 WHERE phone = ?", [phone]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      const r = rows[0];
      return res.json({
        success: true,
        data: {
          id: rawId,
          name: r.name,
          email: r.email,
          mobile: r.phone,
          address: `${r.locality || ''} ${r.location || ''}`.trim(),
          gender: r.gender,
          source: 'User App (MySQL v2)',
          countryCode: r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91'
        }
      });
    } else if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      const [rows] = await db.query(`SELECT * FROM \`${dbName}\`.\`users\` WHERE id = ?`, [originalId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      const r = rows[0];
      return res.json({
        success: true,
        data: {
          id: rawId,
          name: r.name,
          email: r.email,
          mobile: r.mobile_number,
          address: r.address,
          gender: r.gender,
          source: 'App User (Laravel)',
          countryCode: '+91'
        }
      });
    } else {
      const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [rawId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      const r = rows[0];
      return res.json({
        success: true,
        data: {
          id: rawId,
          name: r.name,
          email: r.email,
          mobile: r.mobile,
          address: r.address,
          gender: '',
          source: 'Admin User (MySQL)',
          countryCode: '+91'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid User ID format' });
  }

  try {
    let affected = 0;
    if (rawId >= 2000000000) {
      const phone = rawId.toString();
      const [result] = await db.query("DELETE FROM node_users_v2 WHERE phone = ?", [phone]);
      affected = result.affectedRows;
    } else if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      const [result] = await db.query(`DELETE FROM \`${dbName}\`.\`users\` WHERE id = ?`, [originalId]);
      affected = result.affectedRows;
    } else {
      const [result] = await db.query("DELETE FROM users WHERE id = ?", [rawId]);
      affected = result.affectedRows;
    }
    
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'User not found or already deleted' });
    }

    // Clear cache immediately after deletion
    clearUsersCache();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
});

module.exports = router;