const Timesheet = require('../models/Timesheet');

// @desc    Get all timesheets
// @route   GET /api/timesheets
// @access  Private
exports.getAllTimesheets = async (req, res) => {
  try {
    const { status, month, year, userId, projectId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (userId) filter.userId = userId;
    if (projectId) filter.projectId = projectId;

    // If user is not admin/manager, only show their own timesheets
    if (req.user.role === 'employee') {
      filter.userId = req.user.id;
    }

    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });
    
    res.json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single timesheet
// @route   GET /api/timesheets/:id
// @access  Private
exports.getTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName');
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user has permission to view this timesheet
    if (req.user.role === 'employee' && timesheet.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this timesheet' });
    }

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get timesheets by user
// @route   GET /api/timesheets/user/:userId
// @access  Private
exports.getTimesheetsByUser = async (req, res) => {
  try {
    const timesheets = await Timesheet.find({ userId: req.params.userId })
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });
    
    res.json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get timesheets by project
// @route   GET /api/timesheets/project/:projectId
// @access  Private
exports.getTimesheetsByProject = async (req, res) => {
  try {
    const timesheets = await Timesheet.find({ projectId: req.params.projectId })
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });
    
    res.json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new timesheet
// @route   POST /api/timesheets
// @access  Private
exports.createTimesheet = async (req, res) => {
  try {
    const { projectId, month, year, entries } = req.body;
    const userId = req.user.id;

    // Check if timesheet already exists for this user/project/month/year
    const existingTimesheet = await Timesheet.findOne({
      userId,
      projectId,
      month,
      year
    });

    if (existingTimesheet) {
      return res.status(400).json({ 
        message: 'Timesheet already exists for this project and period' 
      });
    }

    const timesheet = await Timesheet.create({
      userId,
      projectId,
      month,
      year,
      entries
    });

    await timesheet.populate('projectId', 'projectCode projectName');

    res.status(201).json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update timesheet
// @route   PUT /api/timesheets/:id
// @access  Private
exports.updateTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user owns this timesheet
    if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this timesheet' });
    }

    // Can't update if already approved
    if (timesheet.status === 'approved') {
      return res.status(400).json({ message: 'Cannot update approved timesheet' });
    }

    const { entries, comments } = req.body;

    if (entries) timesheet.entries = entries;
    if (comments) timesheet.comments = comments;

    await timesheet.save();
    await timesheet.populate('projectId', 'projectCode projectName');

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit timesheet for approval
// @route   PATCH /api/timesheets/:id/submit
// @access  Private
exports.submitTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user owns this timesheet
    if (timesheet.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ message: 'Timesheet already submitted' });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = new Date();

    await timesheet.save();
    await timesheet.populate('projectId', 'projectCode projectName');

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve timesheet
// @route   PATCH /api/timesheets/:id/approve
// @access  Private/Manager/Admin
exports.approveTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Timesheet must be submitted first' });
    }

    const { comments } = req.body;

    timesheet.status = 'approved';
    timesheet.approvedBy = req.user.id;
    timesheet.approvalDate = new Date();
    if (comments) timesheet.comments = comments;

    await timesheet.save();
    await timesheet.populate(['userId', 'projectId']);

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject timesheet
// @route   PATCH /api/timesheets/:id/reject
// @access  Private/Manager/Admin
exports.rejectTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.status !== 'submitted') {
      return res.status(400).json({ message: 'Timesheet must be submitted first' });
    }

    const { comments } = req.body;

    timesheet.status = 'rejected';
    timesheet.approvedBy = req.user.id;
    timesheet.approvalDate = new Date();
    if (comments) timesheet.comments = comments;

    await timesheet.save();
    await timesheet.populate(['userId', 'projectId']);

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete timesheet
// @route   DELETE /api/timesheets/:id
// @access  Private
exports.deleteTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user owns this timesheet
    if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can't delete if already approved
    if (timesheet.status === 'approved') {
      return res.status(400).json({ message: 'Cannot delete approved timesheet' });
    }

    await timesheet.deleteOne();

    res.json({
      success: true,
      message: 'Timesheet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
