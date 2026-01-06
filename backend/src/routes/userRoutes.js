const express = require('express');
const {
  getAllUsers,
  getUser,
  getCurrentUser,
  createUser,
  updateUser,
  updateCurrentUser,
  deleteUser,
  permanentDeleteUser,
  requestEmailChange,
  verifyEmailChange,
  requestPasswordReset,
  verifyPasswordReset,
  changePassword
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Email change routes (any authenticated user can change their own email)
router.post('/change-email/request', requestEmailChange);
router.post('/change-email/verify', verifyEmailChange);

// Password change route
router.post('/change-password', changePassword);

// Password reset routes (authenticated users)
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/verify', verifyPasswordReset);

// Self-access routes MUST be before /:id routes to avoid 'me' being treated as an ID
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);

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
