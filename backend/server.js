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

// Root Route / Health Check - Serving a premium dashboard landing page with database stats
server.get('/', async (req, res) => {
  try {
    const [[partnersRow]] = await db.query('SELECT COUNT(*) AS count FROM partners');
    const [[bookingsRow]] = await db.query('SELECT COUNT(*) AS count FROM orders_v2');
    const partnersCount = partnersRow ? partnersRow.count : 0;
    const bookingsCount = bookingsRow ? bookingsRow.count : 0;

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
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border-top: 4px solid #10B981;
      padding: 40px;
      max-width: 600px;
      width: 90%;
      text-align: left;
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
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #10B981;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 12px;
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/`);
  console.log(`⚡ Available endpoints under: http://localhost:${PORT}/api/`);
});

module.exports = server;
