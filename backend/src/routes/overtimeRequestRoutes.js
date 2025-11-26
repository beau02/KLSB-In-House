const express = require('express');
const {
  createOvertimeRequest,
  getAllOvertimeRequests,
  getMyOvertimeRequests,
  updateOvertimeRequest,
  deleteOvertimeRequest,
  approveOvertimeRequest,
  rejectOvertimeRequest,
  validateOvertimeHours
} = require('../controllers/overtimeRequestController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validation route
router.post('/validate', validateOvertimeHours);

// My requests route (must be before /:id)
router.get('/my-requests', getMyOvertimeRequests);

// Admin/Manager routes
router.get('/', authorize('admin', 'manager'), getAllOvertimeRequests);

// Approval routes (admin/manager only)
router.put('/:id/approve', authorize('admin', 'manager'), approveOvertimeRequest);
router.put('/:id/reject', authorize('admin', 'manager'), rejectOvertimeRequest);

// CRUD routes (employee can create/update/delete their own)
router.post('/', createOvertimeRequest);
router.put('/:id', updateOvertimeRequest);
router.delete('/:id', deleteOvertimeRequest);

module.exports = router;
