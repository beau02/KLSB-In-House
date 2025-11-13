const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get total staff count (excluding admins)
    const totalStaff = await User.countDocuments({ 
      role: { $ne: 'admin' },
      status: 'active'
    });

    // Get current month's total hours from approved timesheets
    const currentMonthTimesheets = await Timesheet.find({
      month: currentMonth,
      year: currentYear,
      status: 'approved'
    });

    const totalHoursThisMonth = currentMonthTimesheets.reduce(
      (sum, timesheet) => sum + (timesheet.totalHours || 0), 
      0
    );

    res.json({
      success: true,
      stats: {
        totalStaff,
        currentMonthHours: totalHoursThisMonth,
        currentMonth,
        currentYear
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
