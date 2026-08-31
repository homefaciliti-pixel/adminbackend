const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'homefaciliti.com',
  user: 'homef4fw_homefaci',
  password: 'Xnj3*t%F36RDK+!',
  database: 'homef4fw_homefaci',
  port: 3306
});

const tablePrefix = 'node_';

function prefixQuery(sql) {
  const tables = [
    'users', 'categories', 'services', 'orders', 'orders_v2', 'pages', 'partners',
    'booking_earnings', 'subscription_earnings', 'banners', 'states',
    'cities', 'localities', 'notifications', 'reviews', 'settings_config',
    'support_tickets', 'uploaded_files', 'admin_accounts'
  ];
  const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DESCRIBE|TABLE)\\s+\`?(${tables.join('|')})\`?\\b`, 'gi');
  return sql.replace(regex, (match, keyword, tableName) => {
    return `${keyword} \`${tablePrefix}${tableName}\``;
  });
}

const originalQuery = pool.query;
pool.query = function (sql, values) {
  if (typeof sql === 'string') sql = prefixQuery(sql);
  return originalQuery.call(this, sql, values);
};

// Original resolveDocUrl
function resolveDocUrlOriginal(url, currentBase, type = 'document') {
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
    return `${currentBase}/uploads/${url}`;
  } catch (e) {
    return `${currentBase}/uploads/${url}`;
  }
}

// Optimized resolveDocUrl
function resolveDocUrlOptimized(url, currentBase, type = 'document') {
  if (!url || url.trim() === '') {
    return `${currentBase}/uploads/default-${type}.png`;
  }
  if (url.includes('cloudinary.com')) {
    return url;
  }
  if (url.startsWith('http')) {
    const uploadsIdx = url.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      return currentBase + url.substring(uploadsIdx);
    }
    return url;
  }
  return `${currentBase}/uploads/${url}`;
}

async function run() {
  const dbName = 'homef4fw_homefaci';
  console.log('Fetching database data...');
  const [
    [nodeRows],
    [laravelRows],
    [catRows],
    [serviceRows]
  ] = await Promise.all([
    pool.query('SELECT * FROM node_partners'),
    pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile_number AS mobile, 
        s.name AS state, 
        c.name AS city, 
        l.name AS locality,
        cat.title AS categoryName,
        subcat.title AS subCategoryName,
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
      LEFT JOIN \`${dbName}\`.\`categories\` cat ON u.category_id = cat.id
      LEFT JOIN \`${dbName}\`.\`categories\` subcat ON u.sub_category_id = subcat.id
      WHERE u.role_id = 2
    `),
    pool.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``),
    pool.query(`SELECT id, title FROM \`${dbName}\`.\`services\``)
  ]);

  const catMap = {};
  catRows.forEach(row => { catMap[row.id] = row.title; });
  const serviceMap = {};
  serviceRows.forEach(row => { serviceMap[row.id] = row.title; });

  const all = [];
  nodeRows.forEach(r => {
    all.push({ ...r, isApproved: r.isApproved === 1, status: r.status === 1, source: 'Admin Partner (MySQL)' });
  });
  laravelRows.forEach(r => {
    let mappedServices = '';
    if (r.services) {
      mappedServices = r.services.split(',').map(id => serviceMap[id.trim()]).filter(Boolean).join(',');
    }
    all.push({
      ...r,
      id: r.id + 10000000,
      isApproved: r.isApproved === 1 || r.isApproved === '1' || r.isApproved === true,
      status: r.status === 1 || r.status === '1' || r.status === true,
      policeVerificationImage: '',
      aadhaarImage: r.aadharFront || '',
      panImage: r.panImage || '',
      password: '',
      aadharFront: r.aadharFront || '',
      aadharBack: r.aadharBack || '',
      hasVehicle: (r.hasVehicle === 1 || r.hasVehicle === '1') ? 'Yes' : 'No',
      category: r.categoryName || '',
      subCategory: r.subCategoryName || '',
      accountHolder: r.accountHolder || '',
      isPaid: (r.isPaid === 1 || r.isPaid === '1') ? 1 : 0,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      services: mappedServices,
      documents: [r.aadharFront, r.aadharBack, r.panImage].filter(Boolean).join(','),
      source: 'App Partner (Laravel)'
    });
  });

  const currentBase = 'https://adminbackend-1-h03r.onrender.com';

  console.log(`\nBenchmarking mapping of ${all.length} partners:`);

  console.time('Original mapping');
  for (let i = 0; i < 5; i++) {
    const list1 = all.map(r => {
      const resolvedAadharFront = resolveDocUrlOriginal(r.aadharFront || r.aadhaarImage, currentBase, 'document');
      const resolvedAadharBack = resolveDocUrlOriginal(r.aadharBack, currentBase, 'document');
      const resolvedPanImage = resolveDocUrlOriginal(r.panImage, currentBase, 'document');
      const resolvedPoliceImage = resolveDocUrlOriginal(r.policeVerificationImage, currentBase, 'document');
      const resolvedImage = resolveDocUrlOriginal(r.image, currentBase, 'profile');
      const documentsArray = [resolvedAadharFront, resolvedAadharBack, resolvedPanImage, resolvedPoliceImage].filter(Boolean);
      return { ...r, documents: documentsArray };
    });
  }
  console.timeEnd('Original mapping');

  console.time('Optimized mapping');
  for (let i = 0; i < 5; i++) {
    const list2 = all.map(r => {
      const resolvedAadharFront = resolveDocUrlOptimized(r.aadharFront || r.aadhaarImage, currentBase, 'document');
      const resolvedAadharBack = resolveDocUrlOptimized(r.aadharBack, currentBase, 'document');
      const resolvedPanImage = resolveDocUrlOptimized(r.panImage, currentBase, 'document');
      const resolvedPoliceImage = resolveDocUrlOptimized(r.policeVerificationImage, currentBase, 'document');
      const resolvedImage = resolveDocUrlOptimized(r.image, currentBase, 'profile');
      const documentsArray = [resolvedAadharFront, resolvedAadharBack, resolvedPanImage, resolvedPoliceImage].filter(Boolean);
      return { ...r, documents: documentsArray };
    });
  }
  console.timeEnd('Optimized mapping');

  await pool.end();
}

run();
