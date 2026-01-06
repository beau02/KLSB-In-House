const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();
const passwordResetCodes = new Map();

// @desc    Get all users/staff
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, department, name } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (department) filter.department = department;

    if (name && String(name).trim() !== '') {
      const raw = String(name).trim();
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const escaped = escapeRegex(raw);
      // Case-insensitive partial match (contains)
      const partial = new RegExp(escaped, 'i');

      const or = [
        { firstName: partial },
        { lastName: partial },
        { email: partial },
        { employeeNo: partial }
      ];

      // If user entered a full name (contains space), try matching first+last
      const parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const first = escapeRegex(parts[0]);
        const last = escapeRegex(parts[parts.length - 1]);
        const firstRegex = new RegExp(first, 'i');
        const lastRegex = new RegExp(last, 'i');
        or.push({ $and: [ { firstName: firstRegex }, { lastName: lastRegex } ] });
      }

      filter.$or = or;
    }

    const users = await User.find(filter).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's own profile
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new user/staff
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department, phoneNumber, employeeNo, designation, contactNo, hourlyRate } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'employee',
      department,
      phoneNumber,
      employeeNo: employeeNo && employeeNo.trim() !== '' ? employeeNo.trim() : undefined,
      designation,
      contactNo,
      hourlyRate: hourlyRate || 0
    });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user's own profile
// @route   PUT /api/users/me
// @access  Private
exports.updateCurrentUser = async (req, res) => {
  try {
    const { firstName, lastName, department, phoneNumber, employeeNo, designation, contactNo } = req.body;

    console.log('updateCurrentUser called by:', req.user?.email, 'payload:', req.body);

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only update their own basic info (not role, status, or hourlyRate)
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (department) user.department = department;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (employeeNo !== undefined) {
      user.employeeNo = employeeNo && employeeNo.trim() !== '' ? employeeNo.trim() : undefined;
    }
    if (designation !== undefined) user.designation = designation;
    if (contactNo !== undefined) user.contactNo = contactNo;

    await user.save();

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, role, department, phoneNumber, status, employeeNo, designation, contactNo, password, hourlyRate } = req.body;

    // Debug logs to help diagnose hourlyRate update issues
    console.log('updateUser called by:', req.user?.email, 'payload:', req.body);

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Only admins may change the user's role or status
    if (role && req.user.role === 'admin') user.role = role;
    if (status && req.user.role === 'admin') user.status = status;

    if (department) user.department = department;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (employeeNo !== undefined) {
      user.employeeNo = employeeNo && employeeNo.trim() !== '' ? employeeNo.trim() : undefined;
    }
    if (designation !== undefined) user.designation = designation;
    if (contactNo !== undefined) user.contactNo = contactNo;

    // Allow hourlyRate updates by admin and manager
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (password) user.password = password;

    console.log('Before save - user hourlyRate will be:', user.hourlyRate);

    await user.save();

    console.log('After save - user hourlyRate saved as:', user.hourlyRate);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - set status to inactive instead of deleting
    user.status = 'inactive';
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete user
// @route   DELETE /api/users/:id/permanent
// @access  Private/Admin
exports.permanentDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request email change verification code
// @route   POST /api/users/change-email/request
// @access  Private
exports.requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    // Validate new email
    if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiry (10 minutes)
    const codeData = {
      code,
      newEmail,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    verificationCodes.set(userId, codeData);

    // Send verification email
    try {
      await sendVerificationEmail(newEmail, code);
      console.log(`Verification code sent to ${newEmail}: ${code}`);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Still allow the process to continue (code is stored)
    }

    res.json({
      success: true,
      message: 'Verification code sent to new email',
      // Show code in development for testing
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify code and change email
// @route   POST /api/users/change-email/verify
// @access  Private
exports.verifyEmailChange = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    // Get stored verification data
    const codeData = verificationCodes.get(userId);
    
    if (!codeData) {
      return res.status(400).json({ message: 'No verification request found' });
    }

    // Check if code expired
    if (Date.now() > codeData.expiresAt) {
      verificationCodes.delete(userId);
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Verify code
    if (code !== codeData.code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Update email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = codeData.newEmail;
    await user.save();

    // Clean up
    verificationCodes.delete(userId);

    res.json({
      success: true,
      message: 'Email updated successfully',
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset code (authenticated user)
// @route   POST /api/users/password-reset/request
// @access  Private
exports.requestPasswordReset = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with expiry (10 minutes)
    const codeData = {
      code,
      userId,
      email: user.email,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    passwordResetCodes.set(userId, codeData);

    // Send email with reset code
    try {
      await sendPasswordResetEmail(user.email, code);
      console.log(`Password reset code sent to ${user.email}: ${code}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue; code is stored so user can still use it
    }

    res.json({
      success: true,
      message: 'Password reset code sent to your email',
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify password reset code and set new password
// @route   POST /api/users/password-reset/verify
// @access  Private
exports.verifyPasswordReset = async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const userId = req.user.id;

    if (!code || !newPassword) {
      return res.status(400).json({ message: 'Code and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const codeData = passwordResetCodes.get(userId);
    if (!codeData) {
      return res.status(400).json({ message: 'No password reset request found' });
    }

    if (Date.now() > codeData.expiresAt) {
      passwordResetCodes.delete(userId);
      return res.status(400).json({ message: 'Reset code expired' });
    }

    if (code !== codeData.code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    passwordResetCodes.delete(userId);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   POST /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

