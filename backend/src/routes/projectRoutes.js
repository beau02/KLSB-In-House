const express = require('express');
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectArea,
  addProjectPlatform
} = require('../controllers/projectController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(getAllProjects)
  .post(authorize('admin', 'manager'), createProject);

router.post('/:id/areas', authorize('admin'), addProjectArea);
router.post('/:id/platforms', authorize('admin'), addProjectPlatform);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

module.exports = router;
