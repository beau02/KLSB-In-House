const Timesheet = require('../models/Timesheet');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get project costing report with manhour costs
// @route   GET /api/costing/project/:projectId
// @access  Private/Manager/Admin
exports.getProjectCosting = async (req, res) => {
  try {
    const { projectId } = req.params;
    // EXTRACT month/year from query
    const { startDate, endDate, month, year, hourlyRate = 50, disciplineCode } = req.query; 

    console.log('[COSTING] getProjectCosting called with:', {
      projectId,
      month,
      year,
      user: req.user?.email,
      role: req.user?.role
    });

    // Validate Project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.error('[COSTING] Invalid Project ID format:', projectId);
      return res.status(400).json({ message: 'Invalid Project ID format' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const filter = { 
      projectId, 
      status: 'approved' 
    };

    // --- ADDED THIS MISSING LOGIC ---
    if (month && year) {
        filter.month = parseInt(month);
        filter.year = parseInt(year);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startMonth = start.getMonth() + 1;
      const startYear = start.getFullYear();
      const endMonth = end.getMonth() + 1;
      const endYear = end.getFullYear();
      
      filter.$or = [];
      for (let y = startYear; y <= endYear; y++) {
        const monthStart = (y === startYear) ? startMonth : 1;
        const monthEnd = (y === endYear) ? endMonth : 12;
        
        for (let m = monthStart; m <= monthEnd; m++) {
          filter.$or.push({ month: m, year: y });
        }
      }
    }
    // --------------------------------

    const timesheets = await Timesheet.find(filter)
      .populate('userId', 'firstName lastName email department designation employeeNo hourlyRate')
      .populate('projectId', 'projectCode projectName company contractor')
      .sort({ year: 1, month: 1 });

    const employeeCosts = {};
    const disciplineCosts = {};
    let totalNormalHours = 0;
    let totalOTHours = 0;
    let totalHours = 0;

    // Helper to extract discipline codes from entry
    const getDisciplineCodes = (entry) => {
      if (Array.isArray(entry.disciplineCodes) && entry.disciplineCodes.length > 0) {
        return entry.disciplineCodes;
      }
      return [];
    };

    // Process timesheets and calculate costs
    timesheets.forEach(ts => {
      // Safety check for deleted users
      if (!ts.userId) return;

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

      const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
      const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

      employeeCosts[userId].normalHours += normalHours;
      employeeCosts[userId].otHours += otHours;
      employeeCosts[userId].totalHours += hours;
      employeeCosts[userId].normalCost += normalHours * effectiveHourly;
      employeeCosts[userId].otCost += otHours * effectiveHourly;
      employeeCosts[userId].hourlyRate = effectiveHourly;
      employeeCosts[userId].totalCost = employeeCosts[userId].normalCost + employeeCosts[userId].otCost;
      employeeCosts[userId].timesheetCount += 1;

      totalNormalHours += normalHours;
      totalOTHours += otHours;
      totalHours += hours;

      // Track discipline-based costs from entries
      if (ts.entries && Array.isArray(ts.entries)) {
        ts.entries.forEach(entry => {
          const disciplines = getDisciplineCodes(entry);
          const entryNormalHours = entry.normalHours || 0;
          const entryOTHours = entry.otHours || 0;
          const entryTotalHours = entryNormalHours + entryOTHours;

          if (disciplines.length > 0 && entryTotalHours > 0) {
            // Split hours equally across disciplines if multiple
            const hoursPerDiscipline = entryTotalHours / disciplines.length;
            const normalPerDiscipline = entryNormalHours / disciplines.length;
            const otPerDiscipline = entryOTHours / disciplines.length;

            disciplines.forEach(disc => {
              // Filter if disciplineCode query param specified
              if (disciplineCode && disc !== disciplineCode.toUpperCase()) {
                return;
              }

              if (!disciplineCosts[disc]) {
                disciplineCosts[disc] = {
                  disciplineCode: disc,
                  normalHours: 0,
                  otHours: 0,
                  totalHours: 0,
                  normalCost: 0,
                  otCost: 0,
                  totalCost: 0,
                  employeeCount: new Set(),
                  entryCount: 0
                };
              }

              disciplineCosts[disc].normalHours += normalPerDiscipline;
              disciplineCosts[disc].otHours += otPerDiscipline;
              disciplineCosts[disc].totalHours += hoursPerDiscipline;
              disciplineCosts[disc].normalCost += normalPerDiscipline * effectiveHourly;
              disciplineCosts[disc].otCost += otPerDiscipline * effectiveHourly;
              disciplineCosts[disc].totalCost = disciplineCosts[disc].normalCost + disciplineCosts[disc].otCost;
              disciplineCosts[disc].employeeCount.add(userId);
              disciplineCosts[disc].entryCount += 1;
            });
          }
        });
      }
    });

    const totalNormalCost = Object.values(employeeCosts).reduce((s, e) => s + (e.normalCost || 0), 0);
    const totalOTCost = Object.values(employeeCosts).reduce((s, e) => s + (e.otCost || 0), 0);
    const totalCost = totalNormalCost + totalOTCost;

    const monthlyBreakdown = {};
    timesheets.forEach(ts => {
      if (!ts.userId) return;

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
      
      const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
      const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

      monthlyBreakdown[key].normalCost += normalHours * effectiveHourly;
      monthlyBreakdown[key].otCost += otHours * effectiveHourly;
      monthlyBreakdown[key].totalCost = monthlyBreakdown[key].normalCost + monthlyBreakdown[key].otCost;
      
      monthlyBreakdown[key].employeeCount.add(ts.userId._id.toString());
    });

    Object.keys(monthlyBreakdown).forEach(key => {
      monthlyBreakdown[key].employeeCount = monthlyBreakdown[key].employeeCount.size;
    });

    // Convert discipline costs Set to count
    const disciplineBreakdown = Object.values(disciplineCosts).map(d => ({
      ...d,
      employeeCount: d.employeeCount.size
    })).sort((a, b) => b.totalCost - a.totalCost);

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
        dateRange: month && year ? `${year}-${month}` : (startDate && endDate ? { startDate, endDate } : 'All time')
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
      }),
      disciplineBreakdown: disciplineBreakdown
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
    const { hourlyRate = 50 } = req.query;

    console.log('[COSTING] getAllProjectsCosting called by:', req.user?.email);

    const projects = await Project.find({ status: 'active' }).sort({ projectCode: 1 });
    console.log('[COSTING] Found', projects.length, 'active projects');

    const projectCostingSummary = [];

    for (const project of projects) {
      const timesheets = await Timesheet.find({
        projectId: project._id,
        status: 'approved'
      }).populate('userId', 'hourlyRate');

      let totalNormalHours = 0;
      let totalOTHours = 0;
      let totalHours = 0;
      let totalNormalCost = 0;
      let totalOTCost = 0;

      for (const ts of timesheets) {
        if (!ts.userId) continue;

        const normal = ts.totalNormalHours || 0;
        const ot = ts.totalOTHours || 0;
        const userHourly = (ts.userId && ts.userId.hourlyRate) ? parseFloat(ts.userId.hourlyRate) : parseFloat(hourlyRate);
        const effectiveHourly = isNaN(userHourly) ? 50 : userHourly;

        totalNormalHours += normal;
        totalOTHours += ot;
        totalHours += (ts.totalHours || 0);
        totalNormalCost += normal * effectiveHourly;
        totalOTCost += ot * effectiveHourly;
      }

      const totalCost = totalNormalCost + totalOTCost;
      
      const uniqueEmployees = [...new Set(
        timesheets
          .filter(ts => ts.userId) 
          .map(ts => ts.userId._id.toString())
      )];

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