const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getAllProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('managerId', 'firstName lastName email')
      .populate('teamMembers', 'firstName lastName email');
    
    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('managerId', 'firstName lastName email')
      .populate('teamMembers', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin/Manager
exports.createProject = async (req, res) => {
  try {
    const { projectCode, projectName, description, startDate, endDate, managerId, budget, teamMembers } = req.body;

    // Check if project code already exists
    const projectExists = await Project.findOne({ projectCode });
    if (projectExists) {
      return res.status(400).json({ message: 'Project code already exists' });
    }

    const project = await Project.create({
      projectCode,
      projectName,
      description,
      startDate,
      endDate,
      managerId,
      budget,
      teamMembers
    });

    await project.populate('managerId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin/Manager
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { projectName, description, startDate, endDate, status, managerId, budget, teamMembers } = req.body;

    // Update fields
    if (projectName) project.projectName = projectName;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (status) project.status = status;
    if (managerId) project.managerId = managerId;
    if (budget !== undefined) project.budget = budget;
    if (teamMembers) project.teamMembers = teamMembers;

    await project.save();
    await project.populate('managerId', 'firstName lastName email');

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Soft delete - set status to cancelled
    project.status = 'cancelled';
    await project.save();

    res.json({
      success: true,
      message: 'Project cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
