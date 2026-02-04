const OvertimeRequest = require('../models/OvertimeRequest');
const Timesheet = require('../models/Timesheet');

// @desc    Create overtime request
// @route   POST /api/overtime-requests
// @access  Private
exports.createOvertimeRequest = async (req, res) => {
  try {
    const { projectId, weekStartDate, dailyHours, reason, workDescription, disciplineCode, area } = req.body;

    if (!projectId || !weekStartDate || !dailyHours || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!Array.isArray(dailyHours) || dailyHours.length === 0 || dailyHours.length > 7) {
      return res.status(400).json({ message: 'Daily hours must be an array with 1-7 entries' });
    }

    // Validate each day's hours
    for (const day of dailyHours) {
      if (!day.date || day.hours === undefined) {
        return res.status(400).json({ message: 'Each day must have a date and hours' });
      }
      if (day.hours < 0 || day.hours > 24) {
        return res.status(400).json({ message: 'Hours must be between 0 and 24 for each day' });
      }
    }

    // Calculate week end date
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Check if request already exists for this user, project, and week
    const existingRequest = await OvertimeRequest.findOne({
      userId: req.user.id,
      projectId,
      weekStartDate: { $gte: startDate, $lte: endDate }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have an overtime request for this project and week' 
      });
    }

    const overtimeRequest = await OvertimeRequest.create({
      userId: req.user.id,
      projectId,
      weekStartDate: startDate,
      weekEndDate: endDate,
      dailyHours,
      reason,
      workDescription,
      disciplineCode,
      area
    });

    const populatedRequest = await OvertimeRequest.findById(overtimeRequest._id)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName');

    res.status(201).json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all overtime requests (admin/manager)
// @route   GET /api/overtime-requests
// @access  Private/Admin/Manager
exports.getAllOvertimeRequests = async (req, res) => {
  try {
    const { status, userId, projectId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (projectId) filter.projectId = projectId;

    const requests = await OvertimeRequest.find(filter)
      .populate('userId', 'firstName lastName email department employeeNo')
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's own overtime requests
// @route   GET /api/overtime-requests/my-requests
// @access  Private
exports.getMyOvertimeRequests = async (req, res) => {
  try {
    const requests = await OvertimeRequest.find({ userId: req.user.id })
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName')
      .populate('rejectedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update overtime request
// @route   PUT /api/overtime-requests/:id
// @access  Private
exports.updateOvertimeRequest = async (req, res) => {
  try {
    const overtimeRequest = await OvertimeRequest.findById(req.params.id);

    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    // Only owner can update and only if still pending
    if (overtimeRequest.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    if (overtimeRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot update a request that has already been approved or rejected' 
      });
    }

    const { projectId, weekStartDate, dailyHours, reason, workDescription, disciplineCode, area } = req.body;

    if (projectId) overtimeRequest.projectId = projectId;
    
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      overtimeRequest.weekStartDate = startDate;
      overtimeRequest.weekEndDate = endDate;
    }
    
    if (dailyHours) {
      if (!Array.isArray(dailyHours) || dailyHours.length === 0 || dailyHours.length > 7) {
        return res.status(400).json({ message: 'Daily hours must be an array with 1-7 entries' });
      }
      
      // Validate each day's hours
      for (const day of dailyHours) {
        if (!day.date || day.hours === undefined) {
          return res.status(400).json({ message: 'Each day must have a date and hours' });
        }
        if (day.hours < 0 || day.hours > 24) {
          return res.status(400).json({ message: 'Hours must be between 0 and 24 for each day' });
        }
      }
      
      overtimeRequest.dailyHours = dailyHours;
    }
    
    if (reason) overtimeRequest.reason = reason;
    if (workDescription !== undefined) overtimeRequest.workDescription = workDescription;
    if (disciplineCode !== undefined) overtimeRequest.disciplineCode = disciplineCode;
    if (area !== undefined) overtimeRequest.area = area;

    await overtimeRequest.save();

    const populatedRequest = await OvertimeRequest.findById(overtimeRequest._id)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName');

    res.json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete overtime request
// @route   DELETE /api/overtime-requests/:id
// @access  Private
exports.deleteOvertimeRequest = async (req, res) => {
  try {
    const overtimeRequest = await OvertimeRequest.findById(req.params.id);

    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    // Only owner can delete and only if still pending
    if (overtimeRequest.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    if (overtimeRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot delete a request that has already been approved or rejected' 
      });
    }

    await OvertimeRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Overtime request deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve overtime request
// @route   PUT /api/overtime-requests/:id/approve
// @access  Private/Admin/Manager
exports.approveOvertimeRequest = async (req, res) => {
  try {
    const overtimeRequest = await OvertimeRequest.findById(req.params.id);

    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    if (overtimeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    overtimeRequest.status = 'approved';
    overtimeRequest.approvedBy = req.user.id;
    overtimeRequest.approvedAt = new Date();

    await overtimeRequest.save();

    const populatedRequest = await OvertimeRequest.findById(overtimeRequest._id)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName')
      .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject overtime request
// @route   PUT /api/overtime-requests/:id/reject
// @access  Private/Admin/Manager
exports.rejectOvertimeRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const overtimeRequest = await OvertimeRequest.findById(req.params.id);

    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    if (overtimeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    overtimeRequest.status = 'rejected';
    overtimeRequest.rejectedBy = req.user.id;
    overtimeRequest.rejectionReason = rejectionReason;
    overtimeRequest.rejectedAt = new Date();

    await overtimeRequest.save();

    const populatedRequest = await OvertimeRequest.findById(overtimeRequest._id)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName')
      .populate('rejectedBy', 'firstName lastName');

    res.json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate overtime hours when filling timesheet
// @route   POST /api/overtime-requests/validate
// @access  Private
exports.validateOvertimeHours = async (req, res) => {
  try {
    const { projectId, date, hours, timesheetType } = req.body;

    // Only validate OT hours
    if (timesheetType !== 'ot') {
      return res.json({ valid: true });
    }

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    // Find approved request that covers this date
    const approvedRequest = await OvertimeRequest.findOne({
      userId: req.user.id,
      projectId,
      status: 'approved',
      weekStartDate: { $lte: entryDate },
      weekEndDate: { $gte: entryDate }
    });

    if (!approvedRequest) {
      return res.json({
        valid: false,
        message: 'No approved overtime request found for this date and project'
      });
    }

    // Find the specific day in dailyHours
    const dayEntry = approvedRequest.dailyHours.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === entryDate.getTime();
    });

    if (!dayEntry) {
      return res.json({
        valid: false,
        message: 'No approved overtime hours for this specific date'
      });
    }

    if (hours > dayEntry.hours) {
      return res.json({
        valid: false,
        message: `Overtime hours (${hours}) exceed approved request (${dayEntry.hours} hours) for this date`
      });
    }

    res.json({ valid: true, approvedRequest, approvedHours: dayEntry.hours });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
