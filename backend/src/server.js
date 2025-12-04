require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const statsRoutes = require('./routes/stats');
const costingRoutes = require('./routes/costingRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const overtimeRequestRoutes = require('./routes/overtimeRequestRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes with /timesheet prefix
app.use('/timesheet/api/auth', authRoutes);
app.use('/timesheet/api/users', userRoutes);
app.use('/timesheet/api/projects', projectRoutes);
app.use('/timesheet/api/timesheets', timesheetRoutes);
app.use('/timesheet/api/reports', reportRoutes);
app.use('/timesheet/api/stats', statsRoutes);
app.use('/timesheet/api/costing', costingRoutes);
app.use('/timesheet/api/departments', departmentRoutes);
app.use('/timesheet/api/overtime-requests', overtimeRequestRoutes);

// Also support without prefix for flexibility
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/costing', costingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/overtime-requests', overtimeRequestRoutes);

// Helper function to get readable Mongoose connection state
const getMongooseConnectionState = (state) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[state] || 'Unknown';
};

// Health check route handler
const healthCheckHandler = (req, res) => {
  const mongoose = require('mongoose');
  const dbConnected = mongoose.connection.readyState === 1;
  
  // Extract database name from connection URI
  let dbName = 'Unknown';
  if (process.env.MONGODB_URI) {
    const match = process.env.MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    if (match) {
      dbName = match[1];
    }
  }
  
  const healthStatus = {
    status: dbConnected ? 'OK' : 'Database Connection Failed',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      connectionState: getMongooseConnectionState(mongoose.connection.readyState),
      databaseName: dbName
    }
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};

// Health check routes (all three paths)
app.get('/timesheet/api/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Serve static files from frontend build
const pathRoot = path.join(__dirname, '../../dist');
const pathFrontend = path.join(__dirname, '../frontend/dist');
const fs = require('fs');

let frontendDistPath = pathRoot;
if (!fs.existsSync(pathRoot) && fs.existsSync(pathFrontend)) {
  frontendDistPath = pathFrontend;
}

console.log(`ROOT DIST PATH: ${pathRoot} - EXISTS: ${fs.existsSync(pathRoot)}`);
console.log(`FRONTEND DIST PATH: ${pathFrontend} - EXISTS: ${fs.existsSync(pathFrontend)}`);
console.log(`USING: ${frontendDistPath}`);

// Manual route for assets to bypass express.static issues
app.get('/timesheet/assets/*', (req, res) => {
  const filePath = path.join(frontendDistPath, 'assets', req.params[0]);
  console.log(`Asset request: ${req.path} -> ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Asset error for ${filePath}:`, err.message);
      res.status(404).send('Not found');
    }
  });
});

// Manual route for logo at root
app.get('/timesheet/*.png', (req, res) => {
  const fileName = req.path.split('/').pop();
  const filePath = path.join(frontendDistPath, fileName);
  console.log(`Logo request: ${req.path} -> ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Logo error for ${filePath}:`, err.message);
      res.status(404).send('Not found');
    }
  });
});

// Try express.static anyway
app.use(express.static(frontendDistPath, { 
  maxAge: '1d',
  etag: false 
}));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip API routes and health check
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  
  // Skip file extensions - these are static assets that should 404 if not found
  const hasExtension = /\.\w+$/.test(req.path);
  if (hasExtension) {
    console.log(`Asset not found (skipping SPA fallback): ${req.path}`);
    return res.status(404).json({ message: 'Asset not found' });
  }
  
  // For routes without extensions, serve index.html (SPA fallback)
  const indexPath = path.join(frontendDistPath, 'index.html');
  console.log(`Serving SPA fallback for ${req.path} from ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Error serving index.html for ${req.path}:`, err.message);
      res.status(404).json({ message: 'Frontend index not found', path: indexPath, error: err.message });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Warn if JWT_SECRET is missing — helpful during development
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Authentication tokens will fail. Set JWT_SECRET in backend/.env');
}

// Global error handlers for silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on ${HOST}:${PORT}`);
  console.log(`Access the server at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.2.20:${PORT}`);
  console.log(`Health check: http://192.168.2.20:${PORT}/health`);
});

module.exports = app;