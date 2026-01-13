const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const OvertimeRequest = require('../models/OvertimeRequest');

// @desc Check if a date has conflicting hours across multiple timesheets
// Check if a date already has >= 8 normal hours in another timesheet
const checkDateConflict = async (userId, month, year, date, excludeTimesheetId = null) => {
  const startOfDay = new Date(year, month - 1, date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(year, month - 1, date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    userId,
    month,
    year,
    'entries.date': {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };

  if (excludeTimesheetId) {
    query._id = { $ne: excludeTimesheetId };
  }

  const existingTimesheets = await Timesheet.find(query);
  
  let totalNormalHours = 0;
  for (const ts of existingTimesheets) {
    const matchingEntries = ts.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDate() === date && 
             entryDate.getMonth() === month - 1 && 
             entryDate.getFullYear() === year;
    });
    
    for (const entry of matchingEntries) {
      totalNormalHours += entry.normalHours || 0;
    }
  }

  return {
    hasConflict: totalNormalHours >= 8,
    totalHours: totalNormalHours
  };
};

// Normalize discipline codes into an upper-cased, de-duplicated array
const normalizeDisciplineCodes = (codes, { required = false } = {}) => {
  if (codes === undefined || codes === null) {
    if (required) {
      const err = new Error('Discipline code is required');
      err.statusCode = 400;
      throw err;
    }
    return undefined;
  }

  const normalized = (Array.isArray(codes) ? codes : [codes])
    .map((c) => (c || '').toString().trim().toUpperCase())
    .filter(Boolean);

  const unique = Array.from(new Set(normalized));

  if (required && unique.length === 0) {
    const err = new Error('Discipline code is required');
    err.statusCode = 400;
    throw err;
  }

  if (unique.length > 8) {
    const err = new Error('You can select up to 8 discipline codes per timesheet');
    err.statusCode = 400;
    throw err;
  }

  return unique;
};

const normalizeEntriesWithDiscipline = (entries = []) => {
  return entries.map((entry) => {
    const codes = normalizeDisciplineCodes(
      entry.disciplineCodes !== undefined ? entry.disciplineCodes : entry.disciplineCode,
      { required: false }
    );

    return {
      ...entry,
      disciplineCodes: codes || []
    };
  });
};

// @desc    Get all timesheets
// @route   GET /api/timesheets
// @access  Private
exports.getAllTimesheets = async (req, res) => {
  try {
    const { status, month, year, userId, projectId, name } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (userId) filter.userId = userId;
    if (projectId) filter.projectId = projectId;

    // If a name filter is provided, resolve matching user IDs and filter by them (exact match)
    if (name && String(name).trim() !== '') {
      const raw = String(name).trim();
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const escaped = escapeRegex(raw);
      const exact = new RegExp(`^${escaped}$`, 'i');

      const or = [
        { firstName: exact },
        { lastName: exact },
        { email: exact },
        { employeeNo: exact }
      ];

      const parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const first = escapeRegex(parts[0]);
        const last = escapeRegex(parts[parts.length - 1]);
        const firstRegex = new RegExp(`^${first}$`, 'i');
        const lastRegex = new RegExp(`^${last}$`, 'i');
        or.push({ $and: [ { firstName: firstRegex }, { lastName: lastRegex } ] });
      }

      const matchedUsers = await User.find({ $or: or }).select('_id');
      const matchedIds = matchedUsers.map(u => u._id);
      // If no users matched, short-circuit to empty result
      if (matchedIds.length === 0) {
        return res.json({ success: true, count: 0, timesheets: [] });
      }
      filter.userId = { $in: matchedIds };
    }

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
    res.status(error.statusCode || 500).json({ message: error.message });
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
    res.status(error.statusCode || 500).json({ message: error.message });
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
    res.status(error.statusCode || 500).json({ message: error.message });
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
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Create new timesheet
// @route   POST /api/timesheets
// @access  Private
exports.createTimesheet = async (req, res) => {
  try {
    const { projectId, area, month, year } = req.body;
    const userId = req.user.id;

    console.log('=== CREATE TIMESHEET REQUEST ===');
    console.log('User ID:', userId);
    console.log('Project ID:', projectId);
    console.log('Area:', area);
    console.log('Month:', month);
    console.log('Year:', year);
    console.log('Entries count:', req.body.entries?.length || 0);
    console.log('First entry:', req.body.entries?.[0]);
    console.log('================================');

    const normalizedEntries = normalizeEntriesWithDiscipline(req.body.entries || []);

    console.log('Normalized entries:', normalizedEntries.length);
    console.log('First normalized entry:', normalizedEntries[0]);

    // Only one timesheet per user/project/month/year
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

    // Check for date conflicts - if a date already has >= 8 normal hours in another timesheet
    const conflictingDates = [];
    for (const entry of normalizedEntries) {
      const entryDate = new Date(entry.date);
      const day = entryDate.getDate();
      
      if (entry.normalHours > 0) {
        const conflict = await checkDateConflict(userId, month, year, day);
        if (conflict.hasConflict) {
          conflictingDates.push({
            date: day,
            existingHours: conflict.totalHours,
            newHours: entry.normalHours
          });
        }
      }
    }

    if (conflictingDates.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot create timesheet. Some dates already have >= 8 normal hours assigned in other timesheets for this month.',
        conflictingDates
      });
    }

    const timesheet = await Timesheet.create({
      userId,
      projectId,
      area,
      month,
      year,
      entries: normalizedEntries
    });

    console.log('Timesheet created:', timesheet._id);

    await timesheet.populate('projectId', 'projectCode projectName');

    res.status(201).json({
      success: true,
      timesheet
    });
  } catch (error) {
    console.error('=== CREATE TIMESHEET ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.error('==============================');
    res.status(error.statusCode || 500).json({ message: error.message });
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

    // Can't update if already approved or submitted
    if (timesheet.status === 'approved' || timesheet.status === 'submitted') {
      return res.status(400).json({ message: 'Cannot update approved or submitted timesheet' });
    }

    const { entries, area, comments } = req.body;
    const normalizedEntries = entries ? normalizeEntriesWithDiscipline(entries) : undefined;

    // Validate date conflicts - check if updated entries would conflict with other timesheets
    if (normalizedEntries && Array.isArray(normalizedEntries)) {
      const conflictingDates = [];
      for (const entry of normalizedEntries) {
        const entryDate = new Date(entry.date);
        const day = entryDate.getDate();
        
        if (entry.normalHours > 0) {
          const conflict = await checkDateConflict(timesheet.userId, timesheet.month, timesheet.year, day, timesheet._id);
          if (conflict.hasConflict) {
            conflictingDates.push({
              date: day,
              existingHours: conflict.totalHours,
              newHours: entry.normalHours
            });
          }
        }
      }

      if (conflictingDates.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot update timesheet. Some dates already have >= 8 normal hours assigned in other timesheets for this month.',
          conflictingDates
        });
      }
    }

    // Validate OT hours against approved overtime requests
    if (entries && Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.type === 'ot' && entry.hours > 0) {
          const entryDate = new Date(timesheet.year, timesheet.month - 1, entry.day);
          
          const approvedRequest = await OvertimeRequest.findOne({
            userId: timesheet.userId,
            projectId: timesheet.projectId,
            date: entryDate,
            status: 'approved'
          });

          if (!approvedRequest) {
            return res.status(400).json({ 
              message: `No approved overtime request found for day ${entry.day}. Please submit an overtime request first.` 
            });
          }

          if (entry.hours > approvedRequest.requestedHours) {
            return res.status(400).json({ 
              message: `Overtime hours for day ${entry.day} (${entry.hours}h) exceed approved request (${approvedRequest.requestedHours}h)` 
            });
          }

          // Update actual hours in the overtime request
          approvedRequest.actualHours = entry.hours;
          await approvedRequest.save();
        }
      }
    }

    if (normalizedEntries) timesheet.entries = normalizedEntries;
    if (area !== undefined) timesheet.area = area;
    if (comments) timesheet.comments = comments;

    // If timesheet was rejected, reset it to draft when user edits
    if (timesheet.status === 'rejected') {
      timesheet.status = 'draft';
      timesheet.approvedBy = undefined;
      timesheet.approvalDate = undefined;
      timesheet.rejectionReason = undefined;
    }

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

    // Allow submission for draft or rejected timesheets
    if (timesheet.status !== 'draft' && timesheet.status !== 'rejected') {
      return res.status(400).json({ message: 'Timesheet already submitted or approved' });
    }

    // If resubmitting a rejected timesheet, mark as resubmitted
    if (timesheet.status === 'rejected') {
      timesheet.status = 'resubmitted';
      timesheet.resubmissionCount = (timesheet.resubmissionCount || 0) + 1;
    } else {
      timesheet.status = 'submitted';
    }
    
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

    if (timesheet.status !== 'submitted' && timesheet.status !== 'resubmitted') {
      return res.status(400).json({ message: 'Timesheet must be submitted first' });
    }

    const { comments } = req.body;

    timesheet.status = 'approved';
    timesheet.approvedBy = req.user.id;
    timesheet.approvalDate = new Date();
    if (comments) timesheet.comments = comments;
    // Clear rejection reason on approval
    timesheet.rejectionReason = undefined;

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

    if (timesheet.status !== 'submitted' && timesheet.status !== 'resubmitted') {
      return res.status(400).json({ message: 'Timesheet must be submitted first' });
    }

    const { comments, rejectionReason } = req.body;

    timesheet.status = 'rejected';
    timesheet.approvedBy = req.user.id;
    timesheet.approvalDate = new Date();
    if (comments) timesheet.comments = comments;
    if (rejectionReason) timesheet.rejectionReason = rejectionReason;

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
// @desc    Check for date conflicts with existing timesheets
// @route   POST /api/timesheets/check-conflicts
// @access  Private
exports.checkDateConflicts = async (req, res) => {
  try {
    const { month, year, entries, timesheetId } = req.body;
    const userId = req.user.id;

    if (!month || !year || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ 
        message: 'month, year, and entries array are required' 
      });
    }

    const conflictingDates = [];
    
    for (const entry of entries) {
      if (!entry.date) continue;
      
      const entryDate = new Date(entry.date);
      const day = entryDate.getDate();
      
      if (entry.normalHours > 0) {
        const conflict = await checkDateConflict(userId, month, year, day, timesheetId || null);
        if (conflict.hasConflict) {
          conflictingDates.push({
            date: day,
            existingHours: conflict.totalHours,
            newHours: entry.normalHours,
            totalHours: conflict.totalHours + entry.normalHours
          });
        }
      }
    }

    res.json({
      success: true,
      hasConflicts: conflictingDates.length > 0,
      conflictingDates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed conflict information for a specific date
// @route   POST /api/timesheets/conflicts-details
// @access  Private
exports.getConflictDetails = async (req, res) => {
  try {
    const { month, year, date, timesheetId } = req.body;
    const userId = req.user.id;

    if (!month || !year || !date) {
      return res.status(400).json({ 
        message: 'month, year, and date are required' 
      });
    }

    const startOfDay = new Date(year, month - 1, date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(year, month - 1, date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      userId,
      month,
      year,
      'entries.date': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    if (timesheetId) {
      query._id = { $ne: timesheetId };
    }

    const existingTimesheets = await Timesheet.find(query)
      .populate('projectId', 'projectCode projectName')
      .select('projectId entries');
    
    const conflictDetails = [];
    let totalHours = 0;

    for (const ts of existingTimesheets) {
      const matchingEntries = ts.entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === date && 
               entryDate.getMonth() === month - 1 && 
               entryDate.getFullYear() === year;
      });
      
      for (const entry of matchingEntries) {
        if (entry.normalHours > 0) {
          totalHours += entry.normalHours;
          conflictDetails.push({
            projectCode: ts.projectId?.projectCode || 'Unknown',
            projectName: ts.projectId?.projectName || 'Unknown',
            normalHours: entry.normalHours,
            date: date
          });
        }
      }
    }

    res.json({
      success: true,
      date,
      totalExistingHours: totalHours,
      conflictDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};