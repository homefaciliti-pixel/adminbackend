const express = require('express');
const cors = require('cors');
require('dotenv').config();

const server = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all domains so Flutter Web client can access APIs without origin blocks
server.use(cors());

// Middleware for parsing JSON and urlencoded request bodies
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

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
