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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/costing', costingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/overtime-requests', overtimeRequestRoutes);

// Health check route (API path)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from frontend build
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
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