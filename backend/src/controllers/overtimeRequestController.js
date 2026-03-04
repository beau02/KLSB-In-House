const OvertimeRequest = require('../models/OvertimeRequest');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const LeaveTransaction = require('../models/LeaveTransaction');
const OvertimeSettlement = require('../models/OvertimeSettlement');

const COMPENSATION_TYPES = ['ot_payment', 'replacement_leave'];

const calculateApprovedHours = (dailyHours = []) => {
  return dailyHours.reduce((sum, day) => sum + (day.hours || 0), 0);
};

// @desc    Create overtime request
// @route   POST /api/overtime-requests
// @access  Private
exports.createOvertimeRequest = async (req, res) => {
  try {
    const {
      projectId,
      weekStartDate,
      dailyHours,
      reason,
      workDescription,
      disciplineCode,
      area,
      compensationType
    } = req.body;

    if (!projectId || !weekStartDate || !dailyHours || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (compensationType && !COMPENSATION_TYPES.includes(compensationType)) {
      return res.status(400).json({ message: 'Invalid compensation type' });
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
      area,
      compensationType: compensationType || 'ot_payment'
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

    const {
      projectId,
      weekStartDate,
      dailyHours,
      reason,
      workDescription,
      disciplineCode,
      area,
      compensationType
    } = req.body;

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
    if (compensationType !== undefined) {
      if (!COMPENSATION_TYPES.includes(compensationType)) {
        return res.status(400).json({ message: 'Invalid compensation type' });
      }
      overtimeRequest.compensationType = compensationType;
    }

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

// @desc    Approve overtime request and auto-fill timesheet
// @route   PUT /api/overtime-requests/:id/approve
// @access  Private/Admin/Manager
exports.approveOvertimeRequest = async (req, res) => {
  try {
    const { compensationType } = req.body || {};
    const overtimeRequest = await OvertimeRequest.findById(req.params.id);

    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    if (overtimeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    const requestedCompensationType = overtimeRequest.compensationType || 'ot_payment';
    const approvedCompensationType = compensationType || requestedCompensationType;

    if (!COMPENSATION_TYPES.includes(approvedCompensationType)) {
      return res.status(400).json({ message: 'Invalid compensation type' });
    }

    const approvedHours = calculateApprovedHours(overtimeRequest.dailyHours);
    const leaveCreditHours = approvedCompensationType === 'replacement_leave' ? approvedHours : 0;
    const leaveCreditDays = approvedCompensationType === 'replacement_leave'
      ? Number((approvedHours / 8).toFixed(2))
      : 0;

    overtimeRequest.status = 'approved';
    overtimeRequest.approvedBy = req.user.id;
    overtimeRequest.approvedAt = new Date();
    overtimeRequest.approvedCompensationType = approvedCompensationType;
    overtimeRequest.approvedTotalHours = approvedHours;
    overtimeRequest.leaveCreditHours = leaveCreditHours;
    overtimeRequest.leaveCreditDays = leaveCreditDays;

    await overtimeRequest.save();

    if (approvedCompensationType === 'ot_payment') {
      await autoFillTimesheetWithOvertimeHours(overtimeRequest);
    } else {
      await creditReplacementLeave(overtimeRequest, req.user.id);
    }

    await OvertimeSettlement.create({
      requestId: overtimeRequest._id,
      userId: overtimeRequest.userId,
      projectId: overtimeRequest.projectId,
      compensationType: approvedCompensationType,
      approvedHours,
      leaveCreditHours,
      leaveCreditDays,
      settledBy: req.user.id,
      settledAt: new Date()
    });

    overtimeRequest.settlementProcessed = true;
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

const creditReplacementLeave = async (overtimeRequest, approverUserId) => {
  try {
    const approvedHours = calculateApprovedHours(overtimeRequest.dailyHours);
    const creditDays = Number((approvedHours / 8).toFixed(2));

    const user = await User.findById(overtimeRequest.userId);
    if (!user) {
      throw new Error('User not found for leave crediting');
    }

    const updatedHours = Number(((user.replacementLeaveBalanceHours || 0) + approvedHours).toFixed(2));
    const updatedDays = Number(((user.replacementLeaveBalanceDays || 0) + creditDays).toFixed(2));

    user.replacementLeaveBalanceHours = updatedHours;
    user.replacementLeaveBalanceDays = updatedDays;
    await user.save();

    await LeaveTransaction.create({
      userId: user._id,
      sourceType: 'overtime_approval',
      sourceId: overtimeRequest._id,
      transactionType: 'credit',
      hours: approvedHours,
      days: creditDays,
      balanceHoursAfter: updatedHours,
      balanceDaysAfter: updatedDays,
      remarks: `OT converted to replacement leave for week starting ${new Date(overtimeRequest.weekStartDate).toLocaleDateString('en-MY')}`,
      createdBy: approverUserId
    });
  } catch (error) {
    console.error('Error crediting replacement leave:', error);
    throw error;
  }
};

// Helper function to auto-fill timesheet with approved overtime hours
const autoFillTimesheetWithOvertimeHours = async (overtimeRequest) => {
  try {
    const { userId, projectId, dailyHours, disciplineCode, area } = overtimeRequest;

    console.log('=== AUTO-FILL TIMESHEET ===');
    console.log('User ID:', userId);
    console.log('Project ID:', projectId);
    console.log('Daily Hours:', dailyHours);
    console.log('===========================');

    // Process each day in the approved request
    for (const dayEntry of dailyHours) {
      const entryDate = new Date(dayEntry.date);
      const month = entryDate.getMonth() + 1;
      const year = entryDate.getFullYear();
      const dayOfMonth = entryDate.getDate();

      console.log(`Processing: ${dayOfMonth}/${month}/${year} with ${dayEntry.hours} hours`);

      // Find or create timesheet for the given month/year/project
      let timesheet = await Timesheet.findOne({
        userId,
        projectId,
        month,
        year
      });

      if (!timesheet) {
        // Create new timesheet if it doesn't exist
        timesheet = new Timesheet({
          userId,
          projectId,
          month,
          year,
          entries: [],
          status: 'draft'
        });
        console.log('Created new timesheet');
      } else {
        console.log('Found existing timesheet');
      }

      // Check if entry already exists for this date
      const existingEntryIndex = timesheet.entries.findIndex(entry => {
        const entryDateCheck = new Date(entry.date);
        return entryDateCheck.getDate() === dayOfMonth &&
               entryDateCheck.getMonth() === month - 1 &&
               entryDateCheck.getFullYear() === year;
      });

      if (existingEntryIndex >= 0) {
        // Update existing entry: add the approved OT hours
        timesheet.entries[existingEntryIndex].otHours = dayEntry.hours;
        console.log('Updated existing entry');
      } else {
        // Create new entry with the approved OT hours
        timesheet.entries.push({
          date: entryDate,
          otHours: dayEntry.hours,
          normalHours: 0,
          disciplineCodes: disciplineCode ? [disciplineCode] : []
        });
        console.log('Created new entry with', dayEntry.hours, 'hours');
      }

      // Update discipline code and area if provided
      if (disciplineCode) {
        timesheet.disciplineCode = [disciplineCode];
      }
      if (area) {
        timesheet.area = area;
      }

      // Save the updated timesheet
      await timesheet.save();
      console.log('Saved timesheet');
    }
    console.log('===========================');
  } catch (error) {
    // Log the error but don't fail the approval
    console.error('Error auto-filling timesheet with overtime hours:', error);
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
      $or: [
        { approvedCompensationType: 'ot_payment' },
        { approvedCompensationType: { $exists: false }, compensationType: { $ne: 'replacement_leave' } },
        { approvedCompensationType: { $exists: false }, compensationType: { $exists: false } }
      ],
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

// @desc    Get current user's overtime/leave summary
// @route   GET /api/overtime-requests/my-summary
// @access  Private
exports.getMyOvertimeSummary = async (req, res) => {
  try {
    const [user, settlements] = await Promise.all([
      User.findById(req.user.id).select('replacementLeaveBalanceHours replacementLeaveBalanceDays'),
      OvertimeSettlement.find({ userId: req.user.id }).sort({ settledAt: -1 }).limit(10)
    ]);

    const totalApprovedOtPaymentHours = settlements
      .filter((s) => s.compensationType === 'ot_payment')
      .reduce((sum, s) => sum + (s.approvedHours || 0), 0);

    const totalConvertedToLeaveHours = settlements
      .filter((s) => s.compensationType === 'replacement_leave')
      .reduce((sum, s) => sum + (s.leaveCreditHours || 0), 0);

    res.json({
      success: true,
      summary: {
        replacementLeaveBalanceHours: user?.replacementLeaveBalanceHours || 0,
        replacementLeaveBalanceDays: user?.replacementLeaveBalanceDays || 0,
        totalApprovedOtPaymentHours,
        totalConvertedToLeaveHours
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's replacement leave history
// @route   GET /api/overtime-requests/my-leave-history
// @access  Private
exports.getMyReplacementLeaveHistory = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);

    const [user, transactions] = await Promise.all([
      User.findById(req.user.id).select('replacementLeaveBalanceHours replacementLeaveBalanceDays'),
      LeaveTransaction.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('createdBy', 'firstName lastName')
    ]);

    const totalCreditedHours = transactions
      .filter((tx) => tx.transactionType === 'credit')
      .reduce((sum, tx) => sum + (tx.hours || 0), 0);

    const totalDebitedHours = transactions
      .filter((tx) => tx.transactionType === 'debit')
      .reduce((sum, tx) => sum + Math.abs(tx.hours || 0), 0);

    res.json({
      success: true,
      summary: {
        replacementLeaveBalanceHours: user?.replacementLeaveBalanceHours || 0,
        replacementLeaveBalanceDays: user?.replacementLeaveBalanceDays || 0,
        totalCreditedHours,
        totalDebitedHours
      },
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
