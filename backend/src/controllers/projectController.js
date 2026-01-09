const Project = require('../models/Project');

const normalizeAreas = (areas) => {
  if (!areas) return undefined;
  const list = Array.isArray(areas) ? areas : [areas];
  const seen = new Set();

  const normalized = list
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return normalized.length > 0 ? normalized : [];
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getAllProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const projects = await Project.find(filter)
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
    const { projectCode, projectName, description, startDate, endDate, company, contractor, teamMembers, areas } = req.body;
    const normalizedAreas = normalizeAreas(areas);

    // Check if project with same code AND name already exists
    // Allow same projectCode for different projectName values
    const projectExists = await Project.findOne({ projectCode, projectName });
    if (projectExists) {
      return res.status(400).json({ message: 'Project with same code and title already exists' });
    }

    const project = await Project.create({
      projectCode,
      projectName,
      description,
      startDate,
      endDate,
      company,
      contractor,
      teamMembers,
      areas: normalizedAreas
    });

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

    const { projectName, description, startDate, endDate, status, company, contractor, teamMembers, areas } = req.body;
    const normalizedAreas = normalizeAreas(areas);

    // Update fields
    if (projectName) project.projectName = projectName;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (status) project.status = status;
    if (company) project.company = company;
    if (contractor) project.contractor = contractor;
    if (teamMembers) project.teamMembers = teamMembers;
    if (normalizedAreas) project.areas = normalizedAreas;

    await project.save();

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

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add an area to a project
// @route   POST /api/projects/:id/areas
// @access  Private/Admin
exports.addProjectArea = async (req, res) => {
  try {
    const { area } = req.body;

    if (!area || !String(area).trim()) {
      return res.status(400).json({ message: 'Area name is required' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const normalizedArea = String(area).trim();
    const hasDuplicate = (project.areas || []).some(
      (existing) => existing.toLowerCase() === normalizedArea.toLowerCase()
    );

    if (hasDuplicate) {
      return res.status(400).json({ message: 'Area already exists for this project' });
    }

    project.areas = [...(project.areas || []), normalizedArea];
    await project.save();

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a platform to a project
// @route   POST /api/projects/:id/platforms
// @access  Private/Admin
exports.addProjectPlatform = async (req, res) => {
  try {
    const { platform } = req.body;

    if (!platform || !String(platform).trim()) {
      return res.status(400).json({ message: 'Platform name is required' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const normalizedPlatform = String(platform).trim();
    const hasDuplicate = (project.platforms || []).some(
      (existing) => existing.toLowerCase() === normalizedPlatform.toLowerCase()
    );

    if (hasDuplicate) {
      return res.status(400).json({ message: 'Platform already exists for this project' });
    }

    project.platforms = [...(project.platforms || []), normalizedPlatform];
    await project.save();

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
