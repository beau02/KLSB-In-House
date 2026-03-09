const User = require('../models/User');
const Timesheet = require('../models/Timesheet');
const Project = require('../models/Project');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const lastMonthYear = currentDate.getMonth() === 0
      ? currentDate.getFullYear() - 1
      : currentDate.getFullYear();
    const isAdminView = req.user.role === 'admin' || req.user.role === 'manager';
    const baseFilter = isAdminView ? {} : { userId: req.user.id };

    const [
      totalTimesheets,
      pendingTimesheets,
      approvedTimesheets,
      rejectedTimesheets,
      lastMonthHoursAgg
    ] = await Promise.all([
      Timesheet.countDocuments(baseFilter),
      Timesheet.countDocuments({ ...baseFilter, status: 'submitted' }),
      Timesheet.countDocuments({ ...baseFilter, status: 'approved' }),
      Timesheet.countDocuments({ ...baseFilter, status: 'rejected' }),
      Timesheet.aggregate([
        {
          $match: {
            ...baseFilter,
            month: lastMonth,
            year: lastMonthYear,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: '$totalHours' }
          }
        }
      ])
    ]);

    let totalStaff = 0;
    let myProjects = [];

    if (isAdminView) {
      const [staffCount, activeProjects] = await Promise.all([
        User.countDocuments({
          role: { $ne: 'admin' },
          status: 'active'
        }),
        Project.find({ status: 'active' })
          .select('_id projectCode projectName')
          .sort({ projectCode: 1 })
          .lean()
      ]);

      totalStaff = staffCount;
      myProjects = activeProjects;
    } else {
      const userProjectIds = await Timesheet.distinct('projectId', baseFilter);

      if (userProjectIds.length > 0) {
        myProjects = await Project.find({
          _id: { $in: userProjectIds },
          status: 'active'
        })
          .select('_id projectCode projectName')
          .sort({ projectCode: 1 })
          .lean();
      }
    }

    res.json({
      success: true,
      stats: {
        totalStaff,
        totalTimesheets,
        pendingTimesheets,
        approvedTimesheets,
        rejectedTimesheets,
        currentMonthHours: lastMonthHoursAgg[0]?.totalHours || 0,
        activeProjects: myProjects.length,
        myProjects,
        currentMonth: lastMonth,
        currentYear: lastMonthYear
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
