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

async function run() {
  const dbName = 'homef4fw_homefaci';
  console.log('Measuring database query times individual...');

  console.time('Q1: node_partners');
  const [nodeRows] = await pool.query('SELECT * FROM node_partners');
  console.timeEnd('Q1: node_partners');
  console.log(`  Count: ${nodeRows.length}`);

  console.time('Q2: laravel_users');
  const [laravelRows] = await pool.query(`
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
  `);
  console.timeEnd('Q2: laravel_users');
  console.log(`  Count: ${laravelRows.length}`);

  console.time('Q3: categories');
  const [catRows] = await pool.query(`SELECT id, title FROM \`${dbName}\`.\`categories\``);
  console.timeEnd('Q3: categories');
  console.log(`  Count: ${catRows.length}`);

  console.time('Q4: services');
  const [serviceRows] = await pool.query(`SELECT id, title FROM \`${dbName}\`.\`services\``);
  console.timeEnd('Q4: services');
  console.log(`  Count: ${serviceRows.length}`);

  await pool.end();
}

run();
