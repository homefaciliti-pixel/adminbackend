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

// Root Route / Health Check
server.get('/', (req, res) => {
  res.json({
    status: 'Healthy',
    name: 'Home Faciliti Admin Panel Backend API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
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
