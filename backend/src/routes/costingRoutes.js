const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getProjectCosting,
  getAllProjectsCosting
} = require('../controllers/costingController');

// All routes require authentication
router.use(auth);

// @route   GET /api/costing/summary
// @desc    Get all projects costing summary
// @access  Private/Manager/Admin
router.get('/summary', authorize('admin', 'manager'), getAllProjectsCosting);

// @route   GET /api/costing/project/:projectId
// @desc    Get detailed costing for a specific project
// @access  Private/Manager/Admin
router.get('/project/:projectId', authorize('admin', 'manager'), getProjectCosting);

module.exports = router;
