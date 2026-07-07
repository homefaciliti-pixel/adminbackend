const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Force redeploy 1
const server = express();
server.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Enable CORS for all domains so Flutter Web client can access APIs without origin blocks
server.use(cors());

// Enable Gzip compression to optimize payload size for large lists
const compression = require('compression');
server.use(compression());

// Middleware for parsing JSON and urlencoded request bodies
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Fallback middleware to parse JSON body when Content-Type is missing or not set to application/json
server.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return next();
    }
    if (req.body === undefined) {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => {
        if (data) {
          try {
            req.body = JSON.parse(data);
          } catch (e) {
            // Not JSON or failed to parse, leave as is
          }
        }
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Serve uploaded images statically, falling back to default PNGs if files are deleted/missing from disk
const fs = require('fs');
const db = require('./db');
const https = require('https');

const avatarColors = [
  '0B5FA5', // Primary Blue
  'E11D48', // Rose
  'DB2777', // Pink
  '7C3AED', // Violet
  '2563EB', // Blue
  '0D9488', // Teal
  '059669', // Green
  'D97706', // Amber
  'EA580C', // Orange
  '4B5563'  // Gray
];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

server.use('/uploads', async (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    const filename = req.path.replace(/^\//, ''); // Remove leading slash
    if (!filename) {
      return res.status(404).send('Not Found');
    }

    // Try to load/restore from database if missing from disk
    const { loadFileFromDb } = require('./filePersistence');
    const dbFile = await loadFileFromDb(filename, filePath);
    if (dbFile) {
      return res.sendFile(filePath);
    }

    // For video files (mp4, mov, avi, etc.), return 404 directly — don't serve a PNG fallback
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    const ext = path.extname(filename).toLowerCase();
    if (videoExtensions.includes(ext)) {
      return res.status(404).json({ error: 'Video file not found: ' + filename });
    }

    try {
      // Check if this filename is stored as the partner's profile image
      const [rows] = await db.query(
        'SELECT name FROM partners WHERE image LIKE ?',
        [`%${filename}`]
      );
      if (rows.length > 0) {
        const partnerName = rows[0].name || 'Partner';
        const nameEncoded = encodeURIComponent(partnerName);
        const color = getColorForName(partnerName);
        const avatarUrl = `https://ui-avatars.com/api/?name=${nameEncoded}&background=${color}&color=fff&size=250&bold=true`;
        
        return https.get(avatarUrl, (apiRes) => {
          res.setHeader('Content-Type', 'image/png');
          apiRes.pipe(res);
        }).on('error', (err) => {
          console.error('Error fetching dynamic avatar:', err.message);
          res.sendFile(path.join(__dirname, 'defaults', 'default-profile.png'));
        });
      }
    } catch (err) {
      console.error('Error in uploads fallback database check:', err.message);
    }

    // Default fallback to document placeholder
    return res.sendFile(path.join(__dirname, 'defaults', 'default-document.png'));
  }
});

// Smart redirect route for Refer & Earn links
server.get('/partner/join', async (req, res) => {
  const ref = req.query.ref || '';

  // Proactively save IP-based referral clicks for deferred deep linking
  if (ref) {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const ip = clientIp.split(',')[0].trim();
      await db.query(
        'INSERT INTO node_referrer_clicks (ip_address, referral_code) VALUES (?, ?)',
        [ip, ref.trim().toUpperCase()]
      );
      console.log(`[REFERRAL CLICK] Logged click from IP ${ip} with code ${ref}`);
    } catch (err) {
      console.error('[REFERRAL CLICK] Error logging click:', err.message);
    }
  }
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Home Faciliti Partner Join</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 20px;
      color: #F8FAFC;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px 30px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .logo-container {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      border-radius: 20px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
    }
    .logo-icon {
      font-size: 40px;
      font-weight: bold;
      color: white;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #FFFFFF;
    }
    p {
      color: #94A3B8;
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 32px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      font-weight: 600;
      padding: 14px 20px;
      border-radius: 12px;
      box-sizing: border-box;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      margin-bottom: 12px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #E2E8F0;
      box-shadow: none;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      box-shadow: none;
    }
    .loader {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid #10B981;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 20px auto 0;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <script>
    window.onload = function() {
      var ref = "${ref}";
      var appSchemeUrl = "hfpartner://join?ref=" + ref;
      var playStoreUrl = "https://play.google.com/store/apps/details?id=com.homefaciliti.partner"; 
      var appStoreUrl = "https://apps.apple.com/in/app/homeficiliti-partner-app/id6780466527"; 
      
      var isAndroid = /Android/i.test(navigator.userAgent);
      var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      var start = Date.now();
      
      if (isAndroid) {
        // Use Intent URL for Android Chrome to bypass browser redirect blocks and pass query parameter.
        // We omit package restriction so it can open debug/development builds (com.example.hf_partner) as well as production builds (com.homefaciliti.partner).
        var intentUrl = "intent://join?ref=" + ref + "#Intent;scheme=hfpartner;S.browser_fallback_url=" + encodeURIComponent(playStoreUrl) + ";end";
        window.location.href = intentUrl;
      } else {
        window.location.href = appSchemeUrl;
      }
      
      // Fallback redirection logic for non-intent situations or iOS
      setTimeout(function() {
        if (Date.now() - start < 1800) {
          if (isAndroid) {
            window.location.href = playStoreUrl;
          } else if (isIOS) {
            window.location.href = appStoreUrl;
          } else {
            window.location.href = playStoreUrl;
          }
        }
      }, 1500);
    };
  </script>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <span class="logo-icon">HF</span>
    </div>
    <h1>Home Faciliti Partner</h1>
    <p>Opening the partner application on your device...<br>Please wait.</p>
    
    <a href="hfpartner://join?ref=${ref}" id="openAppBtn" class="btn">Open App Directly</a>
    <a href="https://play.google.com/store/apps/details?id=com.homefaciliti.partner" class="btn btn-secondary">Install from Play Store</a>
    
    <div class="loader"></div>
  </div>
  <script>
    // Ensure button href is dynamically set in case user clicks it manually on Android
    var refVal = "${ref}";
    var isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      document.getElementById("openAppBtn").href = "intent://join?ref=" + refVal + "#Intent;scheme=hfpartner;end";
    } else {
      document.getElementById("openAppBtn").href = "hfpartner://join?ref=" + refVal;
    }
  </script>
</body>
</html>
  `);
});

// Root Route / Health Check - Serving a premium dashboard landing page with database stats
server.get('/', async (req, res) => {
  try {
    const [[partnersRow]] = await db.query('SELECT COUNT(*) AS count FROM partners');
    const [[bookingsRow]] = await db.query('SELECT COUNT(*) AS count FROM orders_v2');
    const [[completedRow]] = await db.query("SELECT COUNT(*) AS count FROM orders_v2 WHERE status = 'completed'");
    const [[earningsRow]] = await db.query("SELECT SUM(totalEarnings) AS total FROM partners");
    const [[withdrawalsRow]] = await db.query("SELECT SUM(withdrawnAmount) AS total FROM partners");

    const partnersCount = partnersRow ? partnersRow.count : 0;
    const bookingsCount = bookingsRow ? bookingsRow.count : 0;
    const completedCount = completedRow ? completedRow.count : 0;
    const totalEarnings = earningsRow ? (earningsRow.total || 0) : 0;
    const totalWithdrawals = withdrawalsRow ? (withdrawalsRow.total || 0) : 0;

    const formatCurrency = (val) => {
      return '₹' + Math.round(Number(val || 0)).toLocaleString('en-IN');
    };

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Services Partner API Backend</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border-top: 4px solid #10B981;
      padding: 40px;
      max-width: 850px;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      background-color: #D1FAE5;
      color: #059669;
      font-size: 14px;
      font-weight: 500;
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 24px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background-color: #10B981;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    h1 {
      font-size: 32px;
      color: #1E293B;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    p {
      color: #64748B;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #10B981;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footnote {
      color: #64748B;
      font-size: 14px;
      line-height: 1.5;
      border-top: 1px solid #F1F5F9;
      padding-top: 24px;
      margin: 0;
    }
    .code {
      background-color: #F1F5F9;
      color: #EF4444;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      Server Online
    </div>
    <h1>Home Services Partner API Backend</h1>
    <p>The backend server for your Home Services Partner Flutter application is running successfully and connected to <strong>MySQL Database (homefaciliti.com)</strong>.</p>
    
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-number">${partnersCount}</div>
        <div class="stat-label">Registered Partners</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${bookingsCount}</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${completedCount}</div>
        <div class="stat-label">Completed Bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${formatCurrency(totalEarnings)}</div>
        <div class="stat-label">Total Earnings</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${formatCurrency(totalWithdrawals)}</div>
        <div class="stat-label">Total Settlements</div>
      </div>
    </div>
    
    <p class="footnote">Please refer to the <span class="code">api_list.txt</span> document in your project folder for a complete list of endpoints and request body schemas.</p>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error rendering root dashboard:', error);
    res.status(500).json({
      status: 'Error',
      message: 'Failed to retrieve database stats',
      error: error.message
    });
  }
});

// Import Router Modules
const dashboardRouter = require('./routes/dashboard');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const servicesRouter = require('./routes/services');
const ordersRouter = require('./routes/orders');
const partnersRouter = require('./routes/partners');
const earningsRouter = require('./routes/earnings');
const pagesRouter = require('./routes/pages');
const settingsRouter = require('./routes/settings');
const reportsRouter = require('./routes/reports');
const supportRouter = require('./routes/support');
const uploadRouter = require('./routes/upload');
const partnerRouter = require('./routes/partner');
const adminsRouter = require('./routes/admins');

// Register API Routes
server.use('/api/dashboard', dashboardRouter);
server.use('/api/users', usersRouter);
server.use('/api/categories', categoriesRouter);
server.use('/api/services', servicesRouter);
server.use('/api/orders', ordersRouter);
server.use('/api/partners', partnersRouter);
server.use('/api/earnings', earningsRouter);
server.use('/api/pages', pagesRouter);
server.use('/api/settings', settingsRouter);
server.use('/api/reports', reportsRouter);
server.use('/api/support', supportRouter);
server.use('/api/upload', uploadRouter);
server.use('/api/admins', adminsRouter);
server.use('/api', partnerRouter);

// Android App Links / assetlinks.json route
server.get('/.well-known/assetlinks.json', (req, res) => {
  const package_name = process.env.APP_PACKAGE_NAME || 'com.homefaciliti.partner';
  const fingerprints = process.env.SHA256_FINGERPRINTS 
    ? process.env.SHA256_FINGERPRINTS.split(',').map(f => f.trim())
    : [
        '41:79:BC:A0:E1:AF:0F:38:19:E1:6D:00:CC:A1:3E:EA:79:A3:EB:F0:3D:CF:E7:F0:44:68:19:D4:3D:D8:A9:FD' // production release key
      ];

  const assetlinks = [
    {
      relation: [
        'delegate_permission/common.handle_all_urls'
      ],
      target: {
        namespace: 'android_app',
        package_name: package_name,
        sha256_cert_fingerprints: fingerprints
      }
    }
  ];

  res.setHeader('Content-Type', 'application/json');
  res.json(assetlinks);
});

// Page Not Found (404) Route
server.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
server.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: err.message
  });
});

// Start listening for incoming network requests
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/`);
  console.log(`⚡ Available endpoints under: http://localhost:${PORT}/api/`);

  // Automatically ensure correct version settings exist in DB on startup
  try {
    const db = require('./db');
    console.log('[Startup] Ensuring app version settings in database...');
    
    // android_latest_version
    const [rows1] = await db.query("SELECT * FROM settings_config WHERE `key` = 'android_latest_version'");
    if (rows1.length > 0) {
      await db.query("UPDATE settings_config SET `value` = '1.0.4' WHERE `key` = 'android_latest_version'");
    } else {
      await db.query("INSERT INTO settings_config (`key`, `value`) VALUES ('android_latest_version', '1.0.4')");
    }

    // android_force_update
    const [rows2] = await db.query("SELECT * FROM settings_config WHERE `key` = 'android_force_update'");
    if (rows2.length > 0) {
      await db.query("UPDATE settings_config SET `value` = 'true' WHERE `key` = 'android_force_update'");
    } else {
      await db.query("INSERT INTO settings_config (`key`, `value`) VALUES ('android_force_update', 'true')");
    }
    
    console.log('[Startup] Successfully verified/updated app version settings in DB.');
  } catch (err) {
    console.error('[Startup] Failed to ensure app version settings in DB:', err.message);
  }
});

module.exports = server;
