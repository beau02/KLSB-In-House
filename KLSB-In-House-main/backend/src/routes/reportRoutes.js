const express = require('express');
const {
  getMonthlyReport,
  getProjectReport,
  getUserReport
} = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/monthly', authorize('admin', 'manager'), getMonthlyReport);
router.get('/by-project', authorize('admin', 'manager'), getProjectReport);
router.get('/by-user', getUserReport);

module.exports = router;
