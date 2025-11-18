const Timesheet = require('../models/Timesheet');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get project costing report with manhour costs
// @route   GET /api/costing/project/:projectId
// @access  Private/Manager/Admin
exports.getProjectCosting = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, hourlyRate = 50 } = req.query; // Default hourly rate of $50

    // Get project details
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Build filter for timesheets
    const filter = { 
      projectId, 
      status: 'approved' 
    };

    // Add date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startMonth = start.getMonth() + 1;
      const startYear = start.getFullYear();
      const endMonth = end.getMonth() + 1;
      const endYear = end.getFullYear();
      
      filter.$or = [];
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = (year === startYear) ? startMonth : 1;
        const monthEnd = (year === endYear) ? endMonth : 12;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          filter.$or.push({ month, year });
        }
      }
    }

    // Get all approved timesheets for the project
    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email department designation employeeNo hourlyRate')
      .populate('projectId', 'projectCode projectName company contractor')
      .sort({ year: 1, month: 1 });

    // Calculate costing by employee
    const employeeCosts = {};
    let totalNormalHours = 0;
    let totalOTHours = 0;
    let totalHours = 0;

    timesheets.forEach(ts => {
      const userId = ts.userId._id.toString();
      
      if (!employeeCosts[userId]) {
        employeeCosts[userId] = {
          user: {
            id: ts.userId._id,
            name: `${ts.userId.firstName} ${ts.userId.lastName}`,
            email: ts.userId.email,
            department: ts.userId.department,
            designation: ts.userId.designation,
            employeeNo: ts.userId.employeeNo
          },
          normalHours: 0,
          otHours: 0,
          totalHours: 0,
          normalCost: 0,
          otCost: 0,
          totalCost: 0,
          timesheetCount: 0
        };
      }

      const normalHours = ts.totalNormalHours || 0;
      const otHours = ts.totalOTHours || 0;
      const hours = ts.totalHours || 0;

      // Use per-user hourly rate if provided, otherwise fallback to query param hourlyRate
      const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
      const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

      employeeCosts[userId].normalHours += normalHours;
      employeeCosts[userId].otHours += otHours;
      employeeCosts[userId].totalHours += hours;
      employeeCosts[userId].normalCost += normalHours * effectiveHourly;
      // OT is treated the same as normal hourly rate (no extra multiplier)
      employeeCosts[userId].otCost += otHours * effectiveHourly;
      // expose the effective hourly rate used for this employee (for UI/debug)
      employeeCosts[userId].hourlyRate = effectiveHourly;
      employeeCosts[userId].totalCost = employeeCosts[userId].normalCost + employeeCosts[userId].otCost;
      employeeCosts[userId].timesheetCount += 1;

      totalNormalHours += normalHours;
      totalOTHours += otHours;
      totalHours += hours;
    });

    // For totals, if per-user rates vary we sum per-user costs from employeeCosts
    const totalNormalCost = Object.values(employeeCosts).reduce((s, e) => s + (e.normalCost || 0), 0);
    const totalOTCost = Object.values(employeeCosts).reduce((s, e) => s + (e.otCost || 0), 0);
    const totalCost = totalNormalCost + totalOTCost;

    // Calculate monthly breakdown
    const monthlyBreakdown = {};
    timesheets.forEach(ts => {
      const key = `${ts.year}-${String(ts.month).padStart(2, '0')}`;
      
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = {
          month: ts.month,
          year: ts.year,
          normalHours: 0,
          otHours: 0,
          totalHours: 0,
          normalCost: 0,
          otCost: 0,
          totalCost: 0,
          employeeCount: new Set()
        };
      }

      const normalHours = ts.totalNormalHours || 0;
      const otHours = ts.totalOTHours || 0;
      
      monthlyBreakdown[key].normalHours += normalHours;
      monthlyBreakdown[key].otHours += otHours;
      monthlyBreakdown[key].totalHours += ts.totalHours || 0;
      // Determine effective hourly for this timesheet's user
      const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
      const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

      monthlyBreakdown[key].normalCost += normalHours * effectiveHourly;
      // OT is treated the same as normal hourly rate (no extra multiplier)
      monthlyBreakdown[key].otCost += otHours * effectiveHourly;
      monthlyBreakdown[key].totalCost = monthlyBreakdown[key].normalCost + monthlyBreakdown[key].otCost;
      monthlyBreakdown[key].employeeCount.add(ts.userId._id.toString());
    });

    // Convert Set to count
    Object.keys(monthlyBreakdown).forEach(key => {
      monthlyBreakdown[key].employeeCount = monthlyBreakdown[key].employeeCount.size;
    });

    res.json({
      success: true,
      project: {
        id: project._id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        company: project.company,
        contractor: project.contractor,
        status: project.status
      },
      costingParameters: {
        hourlyRate: parseFloat(hourlyRate),
        overtimeMultiplier: 1.0,
        overtimeRate: parseFloat(hourlyRate) * 1.0,
        dateRange: startDate && endDate ? { startDate, endDate } : 'All time'
      },
      summary: {
        totalNormalHours,
        totalOTHours,
        totalHours,
        totalNormalCost,
        totalOTCost,
        totalCost,
        employeeCount: Object.keys(employeeCosts).length,
        timesheetCount: timesheets.length,
        averageCostPerEmployee: Object.keys(employeeCosts).length > 0 
          ? totalCost / Object.keys(employeeCosts).length 
          : 0
      },
      employeeCosts: Object.values(employeeCosts).sort((a, b) => b.totalCost - a.totalCost),
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
    });
  } catch (error) {
    console.error('Error in getProjectCosting:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects costing summary
// @route   GET /api/costing/summary
// @access  Private/Manager/Admin
exports.getAllProjectsCosting = async (req, res) => {
  try {
    // Summary should reflect per-user hourly rates. We'll compute costs by populating users on timesheets
    const { hourlyRate = 50 } = req.query;

    // Get all active projects
    const projects = await Project.find({ status: 'active' }).sort({ projectCode: 1 });

    const projectCostingSummary = [];

    for (const project of projects) {
      // Get all approved timesheets for this project and populate user hourlyRate
      const timesheets = await Timesheet.find({
        projectId: project._id,
        status: 'approved'
      }).populate('userId', 'hourlyRate');

      // Compute totals using per-user rates where available
      let totalNormalHours = 0;
      let totalOTHours = 0;
      let totalHours = 0;
      let totalNormalCost = 0;
      let totalOTCost = 0;

      for (const ts of timesheets) {
        const normal = ts.totalNormalHours || 0;
        const ot = ts.totalOTHours || 0;
        const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
        const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

        totalNormalHours += normal;
        totalOTHours += ot;
        totalHours += (ts.totalHours || 0);
        totalNormalCost += normal * effectiveHourly;
        // OT is treated the same as normal hourly rate
        totalOTCost += ot * effectiveHourly;
      }

      const totalCost = totalNormalCost + totalOTCost;
      const uniqueEmployees = [...new Set(timesheets.map(ts => ts.userId ? ts.userId._id.toString() : ts.userId.toString()))];

      projectCostingSummary.push({
        project: {
          id: project._id,
          projectCode: project.projectCode,
          projectName: project.projectName,
          company: project.company,
          status: project.status
        },
        totalHours,
        totalNormalHours,
        totalOTHours,
        totalCost,
        totalNormalCost,
        totalOTCost,
        employeeCount: uniqueEmployees.length,
        timesheetCount: timesheets.length
      });
    }

    // Sort by total cost descending
    projectCostingSummary.sort((a, b) => b.totalCost - a.totalCost);

    const grandTotal = projectCostingSummary.reduce((sum, p) => sum + p.totalCost, 0);
    const grandTotalHours = projectCostingSummary.reduce((sum, p) => sum + p.totalHours, 0);

    res.json({
      success: true,
      costingParameters: {
        hourlyRate: parseFloat(hourlyRate),
        overtimeMultiplier: 1.0,
        overtimeRate: parseFloat(hourlyRate) * 1.0
      },
      summary: {
        totalProjects: projectCostingSummary.length,
        grandTotalCost: grandTotal,
        grandTotalHours: grandTotalHours,
        averageCostPerProject: projectCostingSummary.length > 0 
          ? grandTotal / projectCostingSummary.length 
          : 0
      },
      projects: projectCostingSummary
    });
  } catch (error) {
    console.error('Error in getAllProjectsCosting:', error);
    res.status(500).json({ message: error.message });
  }
};
