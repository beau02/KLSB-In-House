const express = require('express');
const {
  getAllTimesheets,
  getTimesheet,
  getTimesheetsByUser,
  getTimesheetsByProject,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  deleteTimesheet
} = require('../controllers/timesheetController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(getAllTimesheets)
  .post(createTimesheet);

router.get('/user/:userId', getTimesheetsByUser);
router.get('/project/:projectId', getTimesheetsByProject);

router.route('/:id')
  .get(getTimesheet)
  .put(updateTimesheet)
  .delete(deleteTimesheet);

router.patch('/:id/submit', submitTimesheet);
router.patch('/:id/approve', authorize('admin', 'manager'), approveTimesheet);
router.patch('/:id/reject', authorize('admin', 'manager'), rejectTimesheet);

module.exports = router;
