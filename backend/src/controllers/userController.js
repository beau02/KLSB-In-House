const User = require('../models/User');

// @desc    Get all users/staff
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, department } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (department) filter.department = department;

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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
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
