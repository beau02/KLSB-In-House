const Timesheet = require('../models/Timesheet');
const moment = require('moment');

// @desc    Get monthly report
// @route   GET /api/reports/monthly
// @access  Private/Manager/Admin
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const timesheets = await Timesheet.find({
      month: parseInt(month),
      year: parseInt(year),
      status: 'approved'
    })
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName');

    // Calculate summary statistics
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const uniqueProjects = [...new Set(timesheets.map(ts => ts.projectId._id.toString()))];
    const uniqueUsers = [...new Set(timesheets.map(ts => ts.userId._id.toString()))];

    res.json({
      success: true,
      period: {
        month: parseInt(month),
        year: parseInt(year)
      },
      summary: {
        totalTimesheets: timesheets.length,
        totalHours,
        projectsInvolved: uniqueProjects.length,
        employeesInvolved: uniqueUsers.length
      },
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report by project
// @route   GET /api/reports/by-project
// @access  Private/Manager/Admin
exports.getProjectReport = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const filter = { projectId, status: 'approved' };

    // Add date filtering if provided
    if (startDate && endDate) {
      const start = moment(startDate);
      const end = moment(endDate);
      
      filter.$or = [];
      for (let m = moment(start); m.isSameOrBefore(end, 'month'); m.add(1, 'month')) {
        filter.$or.push({
          month: m.month() + 1,
          year: m.year()
        });
      }
    }

    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName');

    // Group by user
    const userSummary = {};
    timesheets.forEach(ts => {
      const userId = ts.userId._id.toString();
      if (!userSummary[userId]) {
        userSummary[userId] = {
          user: ts.userId,
          totalHours: 0,
          timesheets: []
        };
      }
      userSummary[userId].totalHours += ts.totalHours;
      userSummary[userId].timesheets.push(ts);
    });

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);

    res.json({
      success: true,
      project: timesheets[0]?.projectId || null,
      summary: {
        totalTimesheets: timesheets.length,
        totalHours,
        employeesInvolved: Object.keys(userSummary).length
      },
      userSummary: Object.values(userSummary),
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report by user
// @route   GET /api/reports/by-user
// @access  Private
exports.getUserReport = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const targetUserId = userId || req.user.id;

    // Only admins/managers can view other users' reports
    if (req.user.role === 'employee' && targetUserId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter = { userId: targetUserId, status: 'approved' };

    // Add date filtering if provided
    if (startDate && endDate) {
      const start = moment(startDate);
      const end = moment(endDate);
      
      filter.$or = [];
      for (let m = moment(start); m.isSameOrBefore(end, 'month'); m.add(1, 'month')) {
        filter.$or.push({
          month: m.month() + 1,
          year: m.year()
        });
      }
    }

    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('projectId', 'projectCode projectName')
      .sort({ year: -1, month: -1 });

    // Group by project
    const projectSummary = {};
    timesheets.forEach(ts => {
      const projectId = ts.projectId._id.toString();
      if (!projectSummary[projectId]) {
        projectSummary[projectId] = {
          project: ts.projectId,
          totalHours: 0,
          timesheets: []
        };
      }
      projectSummary[projectId].totalHours += ts.totalHours;
      projectSummary[projectId].timesheets.push(ts);
    });

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);

    res.json({
      success: true,
      user: timesheets[0]?.userId || null,
      summary: {
        totalTimesheets: timesheets.length,
        totalHours,
        projectsInvolved: Object.keys(projectSummary).length
      },
      projectSummary: Object.values(projectSummary),
      timesheets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
