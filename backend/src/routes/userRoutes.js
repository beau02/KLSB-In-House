const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  permanentDeleteUser
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(authorize('admin', 'manager'), getAllUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(authorize('admin', 'manager'), getUser)
  .put(authorize('admin', 'manager'), updateUser)
  .delete(authorize('admin'), deleteUser);

router.route('/:id/permanent')
  .delete(authorize('admin'), permanentDeleteUser);

module.exports = router;

module.exports = router;
