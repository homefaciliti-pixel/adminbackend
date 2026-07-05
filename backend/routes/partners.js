const express = require('express');
const router = express.Router();
const db = require('../db');

const laravelFields = [
  'name', 'email', 'mobile', 'city', 'state', 'locality', 'address', 'image',
  'status', 'isApproved', 'gender', 'experience', 'services', 'aadhaarNumber',
  'panNumber', 'bankName', 'accountNumber', 'ifscCode', 'documents', 'walletBalance',
  'totalEarnings', 'withdrawnAmount', 'totalBookings', 'completedBookings',
  'cancelledBookings', 'pendingBookings', 'rating', 'totalReviews'
];

async function getAllPartners() {
  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  
  // 1. Fetch from node_partners (translated to node_partners by db.query/prefixQuery)
  const [nodeRows] = await db.query('SELECT * FROM partners');
  
  // 2. Fetch from original Laravel users where role_id = 2 (partners)
  const [laravelRows] = await db.query(`
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
    WHERE u.role_id = 2
  `);

  // 3. Fetch categories and services for ID -> Title mapping
  const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
  const catMap = {};
  catRows.forEach(row => {
    catMap[row.id] = row.title;
  });

  const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
  const serviceMap = {};
  serviceRows.forEach(row => {
    serviceMap[row.id] = row.title;
  });

  const all = [];

  nodeRows.forEach(r => {
    all.push({
      ...r,
      source: 'Admin Partner (MySQL)'
    });
  });

  laravelRows.forEach(r => {
    let mappedServices = '';
    if (r.services) {
      mappedServices = r.services
        .split(',')
        .map(id => serviceMap[id.trim()])
        .filter(Boolean)
        .join(',');
    }

    all.push({
      ...r,
      id: r.id + 10000000, // Offset Laravel IDs by 10,000,000
      policeVerificationImage: '',
      aadhaarImage: r.aadharFront || '',
      panImage: r.panImage || '',
      password: '',
      aadharFront: r.aadharFront || '',
      aadharBack: r.aadharBack || '',
      hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
      category: catMap[r.category_id] || '',
      subCategory: catMap[r.sub_category_id] || '',
      accountHolder: r.accountHolder || '',
      isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      services: mappedServices,
      documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
      source: 'App Partner (Laravel)'
    });
  });

  return all;
}

// Helper to map DB partner object to API partner object (lists, doubles, booleans)
function resolveDocUrl(url, req, type = 'document') {
  const currentBase = `${req.protocol}://${req.get('host')}`;
  if (!url || url.trim() === '') {
    return `${currentBase}/uploads/default-${type}.png`;
  }
  if (url.includes('cloudinary.com')) {
    return url;
  }
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${currentBase}${parsed.pathname}`;
      }
      return url;
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }
  return url;
}

function mapPartner(r, req) {
  if (!r) return null;

  const resolvedAadharFront = resolveDocUrl(r.aadharFront || r.aadhaarImage, req, 'document');
  const resolvedAadharBack = resolveDocUrl(r.aadharBack, req, 'document');
  const resolvedPanImage = resolveDocUrl(r.panImage, req, 'document');
  const resolvedPoliceImage = resolveDocUrl(r.policeVerificationImage, req, 'document');
  const resolvedImage = resolveDocUrl(r.image, req, 'profile');
  
  const documentsArray = [resolvedAadharFront, resolvedAadharBack, resolvedPanImage, resolvedPoliceImage].filter(Boolean);

  return {
    ...r,
    countryCode: r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '+91',
    status: r.status === 1 || r.status === '1' || r.status === true,
    isApproved: r.isApproved === 1 || r.isApproved === '1' || r.isApproved === true,
    services: r.services ? (Array.isArray(r.services) ? r.services : r.services.split(',').map(s => s.trim()).filter(Boolean)) : [],
    documents: documentsArray,
    walletBalance: parseFloat(r.walletBalance || 0),
    totalEarnings: parseFloat(r.totalEarnings || 0),
    withdrawnAmount: parseFloat(r.withdrawnAmount || 0),
    totalBookings: parseInt(r.totalBookings || 0),
    completedBookings: parseInt(r.completedBookings || 0),
    cancelledBookings: parseInt(r.cancelledBookings || 0),
    pendingBookings: parseInt(r.pendingBookings || 0),
    rating: parseFloat(r.rating || 0),
    totalReviews: parseInt(r.totalReviews || 0),
    policeVerificationImage: resolvedPoliceImage,
    aadhaarImage: resolvedAadharFront,
    aadharFront: resolvedAadharFront,
    aadharBack: resolvedAadharBack,
    panImage: resolvedPanImage,
    image: resolvedImage,
    isPaid: (r.isPaid === 1 || r.isPaid === '1' || r.isPaid === true || r.isPaid === 'Paid') ? 'Paid' : 'Unpaid'
  };
}

// GET all partners (with optional search/filtering)
router.get('/', async (req, res) => {
  try {
    const { name, mobile, city, state, date, status, isApproved } = req.query;
    let list = await getAllPartners();

    if (name) {
      const q = name.toLowerCase();
      list = list.filter(p => p.name && p.name.toLowerCase().includes(q));
    }
    if (mobile) {
      const q = mobile.toLowerCase();
      list = list.filter(p => p.mobile && p.mobile.toLowerCase().includes(q));
    }
    if (city) {
      const q = city.toLowerCase();
      list = list.filter(p => p.city && p.city.toLowerCase().includes(q));
    }
    if (state) {
      const q = state.toLowerCase();
      list = list.filter(p => p.state && p.state.toLowerCase().includes(q));
    }
    if (date) {
      const q = date.toLowerCase();
      list = list.filter(p => p.createdAt && p.createdAt.toLowerCase().includes(q));
    }
    if (status !== undefined) {
      const statusVal = (status === 'true' || status === '1' || status === true);
      list = list.filter(p => (p.status === statusVal));
    }
    if (isApproved !== undefined) {
      const isApprovedVal = (isApproved === 'true' || isApproved === '1' || isApproved === true);
      list = list.filter(p => (p.isApproved === isApprovedVal));
    }

    // Order by ID descending
    list.sort((a, b) => b.id - a.id);

    res.json({
      success: true,
      data: list.map(p => mapPartner(p, req))
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
      data: mapPartner(rows[0], req)
    });
  } catch (error) {
    console.error('Error registering partner:', error);
    res.status(500).json({ success: false, message: 'Failed to register partner', error: error.message });
  }
});

// GET /search - search partners
router.get('/search', async (req, res) => {
  const q = (req.query.q || req.query.query || '').trim().toLowerCase();
  try {
    let list = await getAllPartners();
    if (q !== '') {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.mobile && p.mobile.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => b.id - a.id);
    res.json({ success: true, data: list.map(p => mapPartner(p, req)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
});

// GET pending approval partners
router.get('/pending', async (req, res) => {
  try {
    const { name, mobile, city, state, date, status } = req.query;
    let list = await getAllPartners();

    list = list.filter(p => !p.isApproved);

    if (name) {
      const q = name.toLowerCase();
      list = list.filter(p => p.name && p.name.toLowerCase().includes(q));
    }
    if (mobile) {
      const q = mobile.toLowerCase();
      list = list.filter(p => p.mobile && p.mobile.toLowerCase().includes(q));
    }
    if (city) {
      const q = city.toLowerCase();
      list = list.filter(p => p.city && p.city.toLowerCase().includes(q));
    }
    if (state) {
      const q = state.toLowerCase();
      list = list.filter(p => p.state && p.state.toLowerCase().includes(q));
    }
    if (date) {
      const q = date.toLowerCase();
      list = list.filter(p => p.createdAt && p.createdAt.toLowerCase().includes(q));
    }
    if (status !== undefined) {
      const statusVal = (status === 'true' || status === '1' || status === true);
      list = list.filter(p => (p.status === statusVal));
    }

    list.sort((a, b) => b.id - a.id);
    res.json({
      success: true,
      data: list.map(p => mapPartner(p, req))
    });
  } catch (error) {
    console.error('Error fetching pending partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending partners', error: error.message });
  }
});

// PUT approve partner
router.put('/:id/approve', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }

  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    let query, params, selectQuery, selectParams;

    if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      query = `UPDATE \`${dbName}\`.\`users\` SET is_approval = '1', status = 1 WHERE id = ?`;
      params = [originalId];

      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      selectQuery = `
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
        WHERE u.id = ?
      `;
      selectParams = [originalId];
    } else {
      query = 'UPDATE partners SET isApproved = 1, status = 1 WHERE id = ?';
      params = [rawId];
      selectQuery = 'SELECT * FROM partners WHERE id = ?';
      selectParams = [rawId];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const [rows] = await db.query(selectQuery, selectParams);
    let partner = rows[0];

    if (rawId >= 10000000) {
      const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      let mappedServices = '';
      if (partner.services) {
        mappedServices = partner.services
          .split(',')
          .map(id => serviceMap[id.trim()])
          .filter(Boolean)
          .join(',');
      }

      partner = {
        ...partner,
        id: rawId,
        policeVerificationImage: '',
        aadhaarImage: partner.aadharFront || '',
        panImage: partner.panImage || '',
        password: '',
        aadharFront: partner.aadharFront || '',
        aadharBack: partner.aadharBack || '',
        hasVehicle: (partner.hasVehicle === 1 || partner.hasVehicle === '1') ? 'Yes' : 'No',
        category: catMap[partner.category_id] || '',
        subCategory: catMap[partner.sub_category_id] || '',
        accountHolder: partner.accountHolder || '',
        isPaid: (partner.isPaid === 1 || partner.isPaid === '1') ? 1 : 0,
        createdAt: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN') : '',
        services: mappedServices,
        documents: [partner.aadharFront, partner.aadharBack, partner.panImage].filter(Boolean).join(','),
        source: 'App Partner (Laravel)'
      };
    }

    res.json({
      success: true,
      message: 'Partner approved successfully',
      data: mapPartner(partner, req)
    });
  } catch (error) {
    console.error('Error approving partner:', error);
    res.status(500).json({ success: false, message: 'Failed to approve partner', error: error.message });
  }
});

// PUT disapprove partner
router.put('/:id/disapprove', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }

  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    let query, params, selectQuery, selectParams;

    if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      query = `UPDATE \`${dbName}\`.\`users\` SET is_approval = '0' WHERE id = ?`;
      params = [originalId];

      selectQuery = `
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
        WHERE u.id = ?
      `;
      selectParams = [originalId];
    } else {
      query = 'UPDATE partners SET isApproved = 0 WHERE id = ?';
      params = [rawId];
      selectQuery = 'SELECT * FROM partners WHERE id = ?';
      selectParams = [rawId];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const [rows] = await db.query(selectQuery, selectParams);
    let partner = rows[0];

    if (rawId >= 10000000) {
      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      let mappedServices = '';
      if (partner.services) {
        mappedServices = partner.services
          .split(',')
          .map(id => serviceMap[id.trim()])
          .filter(Boolean)
          .join(',');
      }

      partner = {
        ...partner,
        id: rawId,
        policeVerificationImage: '',
        aadhaarImage: partner.aadharFront || '',
        panImage: partner.panImage || '',
        password: '',
        aadharFront: partner.aadharFront || '',
        aadharBack: partner.aadharBack || '',
        hasVehicle: (partner.hasVehicle === 1 || partner.hasVehicle === '1') ? 'Yes' : 'No',
        category: catMap[partner.category_id] || '',
        subCategory: catMap[partner.sub_category_id] || '',
        accountHolder: partner.accountHolder || '',
        isPaid: (partner.isPaid === 1 || partner.isPaid === '1') ? 1 : 0,
        createdAt: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN') : '',
        services: mappedServices,
        documents: [partner.aadharFront, partner.aadharBack, partner.panImage].filter(Boolean).join(','),
        source: 'App Partner (Laravel)'
      };
    }

    res.json({
      success: true,
      message: 'Partner disapproved successfully',
      data: mapPartner(partner, req)
    });
  } catch (error) {
    console.error('Error disapproving partner:', error);
    res.status(500).json({ success: false, message: 'Failed to disapprove partner', error: error.message });
  }
});

// GET /active - get all active (online) partners
router.get('/active', async (req, res) => {
  try {
    let list = await getAllPartners();
    
    // Filter to active/online partners: status = 1 or true
    const activeList = list.filter(p => p.status === 1 || p.status === '1' || p.status === true);

    // Map active list to the format expected by the ActivePartnerModel in the Flutter app
    const mapped = [];
    for (const p of activeList) {
      // Get currentOrders count
      const [[{ count }]] = await db.query(
        "SELECT COUNT(*) as count FROM orders WHERE (vendorName = ? OR vendorMobile = ?) AND status IN ('Assigned', 'In Progress')",
        [p.name || '', p.mobile || '']
      );

      mapped.push({
        partnerId: String(p.id),
        profileImage: resolveDocUrl(p.image, req, 'profile'),
        name: p.name || '',
        phone: p.mobile || '',
        category: p.category || '',
        subCategory: p.subCategory || '',
        area: p.city || p.locality || '',
        latitude: parseFloat(p.latitude || 0),
        longitude: parseFloat(p.longitude || 0),
        currentOrders: count,
        isOnline: p.status === 1 || p.status === '1' || p.status === true,
        activeAt: p.locationTime || '',
        lastActive: p.locationTime || ''
      });
    }

    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching active partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active partners', error: error.message });
  }
});

// GET single partner details
router.get('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }

  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    let rows;
    if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      [rows] = await db.query(`
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
        WHERE u.id = ?
      `, [originalId]);

      if (rows.length > 0) {
        const r = rows[0];
        let mappedServices = '';
        if (r.services) {
          mappedServices = r.services
            .split(',')
            .map(id => serviceMap[id.trim()])
            .filter(Boolean)
            .join(',');
        }
        rows[0] = {
          ...r,
          id: rawId,
          policeVerificationImage: '',
          aadhaarImage: r.aadharFront || '',
          panImage: r.panImage || '',
          password: '',
          aadharFront: r.aadharFront || '',
          aadharBack: r.aadharBack || '',
          hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
          category: catMap[r.category_id] || '',
          subCategory: catMap[r.sub_category_id] || '',
          accountHolder: r.accountHolder || '',
          isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
          services: mappedServices,
          documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
          source: 'App Partner (Laravel)'
        };
      }
    } else {
      [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [rawId]);
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.json({
      success: true,
      data: mapPartner(rows[0], req)
    });
  } catch (error) {
    console.error('Error fetching partner details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partner details', error: error.message });
  }
});

// PUT update partner details
router.put('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }
  const body = req.body;

  try {
    const isLaravel = rawId >= 10000000;
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    const originalId = isLaravel ? (rawId - 10000000) : rawId;

    if (isLaravel) {
      const fields = [];
      const values = [];

      const keyMap = {
        name: 'name',
        email: 'email',
        mobile: 'mobile_number',
        address: 'address',
        image: 'image',
        status: 'status',
        isApproved: 'is_approval',
        gender: 'gender',
        experience: 'experience',
        aadhaarNumber: 'aadhaar_number',
        aadharFront: 'aadhaar_front_image',
        aadharBack: 'aadhaar_back_image',
        panNumber: 'pan_number',
        panImage: 'pan_image',
        bankName: 'bank_name',
        accountNumber: 'account_number',
        ifscCode: 'ifsc_code',
        hasVehicle: 'do_you_have_vehicle',
        accountHolder: 'account_holder_name',
        isPaid: 'payment_status'
      };

      for (const key of Object.keys(body)) {
        if (['id', 'createdAt', 'services', 'documents', 'state', 'city', 'locality', 'category', 'subCategory'].includes(key)) continue;

        if (keyMap[key]) {
          let val = body[key];
          if (key === 'isApproved') {
            val = (val === true || val === 1 || val === 'true') ? '1' : '0';
          } else if (key === 'status' || key === 'isPaid') {
            val = (val === true || val === 1 || val === 'true') ? 1 : 0;
          } else if (key === 'hasVehicle') {
            val = (val === 'Yes' || val === '1' || val === 1 || val === true) ? 1 : 0;
          }
          fields.push(`\`${keyMap[key]}\` = ?`);
          values.push(val);
        }
      }

      if (body.category !== undefined) {
        const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`categories\` WHERE title = ?`, [body.category]);
        if (rows.length > 0) {
          fields.push('`category_id` = ?');
          values.push(rows[0].id);
        }
      }
      if (body.subCategory !== undefined) {
        const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`categories\` WHERE title = ?`, [body.subCategory]);
        if (rows.length > 0) {
          fields.push('`sub_category_id` = ?');
          values.push(rows[0].id);
        }
      }

      if (body.state !== undefined) {
        const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`states\` WHERE name = ?`, [body.state]);
        if (rows.length > 0) {
          fields.push('`state_id` = ?');
          values.push(rows[0].id);
        }
      }
      if (body.city !== undefined) {
        const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`cities\` WHERE name = ?`, [body.city]);
        if (rows.length > 0) {
          fields.push('`city_id` = ?');
          values.push(rows[0].id);
        }
      }
      if (body.locality !== undefined) {
        const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`localities\` WHERE name = ?`, [body.locality]);
        if (rows.length > 0) {
          fields.push('`locality_id` = ?');
          values.push(rows[0].id);
        }
      }

      if (body.services !== undefined) {
        const servicesArray = Array.isArray(body.services) ? body.services : (body.services || '').split(',').map(s => s.trim()).filter(Boolean);
        if (servicesArray.length > 0) {
          const [rows] = await db.query(`SELECT id FROM \`${dbName}\`.\`services\` WHERE title IN (?)`, [servicesArray]);
          const serviceIds = rows.map(r => r.id).join(',');
          fields.push('`service_id` = ?');
          values.push(serviceIds);
        } else {
          fields.push('`service_id` = ?');
          values.push(null);
        }
      }

      if (fields.length === 0) {
        const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
        const catMap = {};
        catRows.forEach(row => { catMap[row.id] = row.title; });

        const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
        const serviceMap = {};
        serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

        const [rows] = await db.query(`
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
          WHERE u.id = ?
        `, [originalId]);

        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        const r = rows[0];
        let mappedServices = '';
        if (r.services) {
          mappedServices = r.services
            .split(',')
            .map(id => serviceMap[id.trim()])
            .filter(Boolean)
            .join(',');
        }
        const updatedPartner = {
          ...r,
          id: rawId,
          policeVerificationImage: '',
          aadhaarImage: r.aadharFront || '',
          panImage: r.panImage || '',
          password: '',
          aadharFront: r.aadharFront || '',
          aadharBack: r.aadharBack || '',
          hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
          category: catMap[r.category_id] || '',
          subCategory: catMap[r.sub_category_id] || '',
          accountHolder: r.accountHolder || '',
          isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
          services: mappedServices,
          documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
          source: 'App Partner (Laravel)'
        };

        return res.json({
          success: true,
          message: 'Partner updated successfully (no changes made)',
          data: mapPartner(updatedPartner, req)
        });
      }

      values.push(originalId);
      const query = `UPDATE \`${dbName}\`.\`users\` SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);
    } else {
      const fields = [];
      const values = [];
      Object.keys(body).forEach(key => {
        if (['id', 'createdAt'].includes(key)) return;
        let val = body[key];
        if (key === 'services' || key === 'documents') {
          if (Array.isArray(val)) val = val.join(',');
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
        const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [originalId]);
        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Partner not found' });
        }
        return res.json({
          success: true,
          message: 'Partner updated successfully (no changes made)',
          data: mapPartner(rows[0], req)
        });
      }

      values.push(originalId);
      const query = `UPDATE partners SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);
    }

    let rows;
    if (isLaravel) {
      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      [rows] = await db.query(`
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
        WHERE u.id = ?
      `, [originalId]);

      if (rows.length > 0) {
        const r = rows[0];
        let mappedServices = '';
        if (r.services) {
          mappedServices = r.services
            .split(',')
            .map(id => serviceMap[id.trim()])
            .filter(Boolean)
            .join(',');
        }
        rows[0] = {
          ...r,
          id: rawId,
          policeVerificationImage: '',
          aadhaarImage: r.aadharFront || '',
          panImage: r.panImage || '',
          password: '',
          aadharFront: r.aadharFront || '',
          aadharBack: r.aadharBack || '',
          hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
          category: catMap[r.category_id] || '',
          subCategory: catMap[r.sub_category_id] || '',
          accountHolder: r.accountHolder || '',
          isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
          services: mappedServices,
          documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
          source: 'App Partner (Laravel)'
        };
      }
    } else {
      [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [originalId]);
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: mapPartner(rows[0], req)
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to update partner', error: error.message });
  }
});

// DELETE partner
router.delete('/:id', async (req, res) => {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }

  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    let query, params;
    if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      query = `DELETE FROM \`${dbName}\`.\`users\` WHERE id = ?`;
      params = [originalId];
    } else {
      query = 'DELETE FROM partners WHERE id = ?';
      params = [rawId];
    }

    const [result] = await db.query(query, params);
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

// PUT/PATCH toggle partner status
async function toggleStatus(req, res) {
  const rawId = parseInt(req.params.id);
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }
  const { status } = req.body;
  if (status === undefined) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const statusInt = (status === true || status === 1 || status === 'true') ? 1 : 0;

  try {
    const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
    let query, params, selectQuery, selectParams;
    if (rawId >= 10000000) {
      const originalId = rawId - 10000000;
      query = `UPDATE \`${dbName}\`.\`users\` SET status = ? WHERE id = ?`;
      params = [statusInt, originalId];
      selectQuery = `
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
        WHERE u.id = ?
      `;
      selectParams = [originalId];
    } else {
      query = 'UPDATE partners SET status = ? WHERE id = ?';
      params = [statusInt, rawId];
      selectQuery = 'SELECT * FROM partners WHERE id = ?';
      selectParams = [rawId];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const [rows] = await db.query(selectQuery, selectParams);
    let partner = rows[0];
    if (rawId >= 10000000) {
      const [catRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
      const catMap = {};
      catRows.forEach(row => { catMap[row.id] = row.title; });

      const [serviceRows] = await db.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
      const serviceMap = {};
      serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

      let mappedServices = '';
      if (partner.services) {
        mappedServices = partner.services
          .split(',')
          .map(id => serviceMap[id.trim()])
          .filter(Boolean)
          .join(',');
      }

      partner = {
        ...partner,
        id: rawId,
        policeVerificationImage: '',
        aadhaarImage: partner.aadharFront || '',
        panImage: partner.panImage || '',
        password: '',
        aadharFront: partner.aadharFront || '',
        aadharBack: partner.aadharBack || '',
        hasVehicle: (partner.hasVehicle === 1 || partner.hasVehicle === '1') ? 'Yes' : 'No',
        category: catMap[partner.category_id] || '',
        subCategory: catMap[partner.sub_category_id] || '',
        accountHolder: partner.accountHolder || '',
        isPaid: (partner.isPaid === 1 || partner.isPaid === '1') ? 1 : 0,
        createdAt: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN') : '',
        services: mappedServices,
        documents: [partner.aadharFront, partner.aadharBack, partner.panImage].filter(Boolean).join(','),
        source: 'App Partner (Laravel)'
      };
    }

    res.json({
      success: true,
      message: `Partner status updated to ${statusInt === 1 ? 'active' : 'inactive'}`,
      data: mapPartner(partner, req)
    });
  } catch (error) {
    console.error('Error toggling partner status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
}

router.put('/:id/status', toggleStatus);
router.patch('/:id/status', toggleStatus);

// PUT /api/partners/:id/password - Change partner password
router.put('/:id/password', async (req, res) => {
  const rawId = parseInt(req.params.id);
  const password = req.body.password || req.body.newPassword;
  
  if (isNaN(rawId)) {
    return res.status(400).json({ success: false, message: 'Invalid Partner ID format' });
  }
  if (!password || String(password).trim() === '') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const dbName = process.env.DB_NAME || 'homef4fw_homefaci';
  const bcrypt = require('bcryptjs');

  try {
    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    if (rawId >= 10000000) {
      // Laravel partner
      const originalId = rawId - 10000000;
      const [result] = await db.query(
        `UPDATE \`${dbName}\`.\`users\` SET password = ? WHERE id = ? AND role_id = 2`,
        [hashedPassword, originalId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Partner not found in Laravel database' });
      }
    } else {
      // Node partners
      const [result] = await db.query(
        'UPDATE partners SET password = ? WHERE id = ?',
        [hashedPassword, rawId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Partner not found in node database' });
      }
    }

    res.json({
      success: true,
      message: 'Partner password changed successfully'
    });

  } catch (error) {
    console.error('Error changing partner password:', error);
    res.status(500).json({ success: false, message: 'Failed to change partner password', error: error.message });
  }
});

module.exports = router;
