const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.warn(`[AUTH] No token provided for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn(`[AUTH] Invalid or expired token for ${req.method} ${req.originalUrl}:`, err.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.warn(`[AUTH] User not found for token (id: ${decoded.id}) on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      console.warn(`[AUTH] User account inactive (id: ${user._id}, status: ${user.status}) on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'User account is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[AUTH] Unexpected error for ${req.method} ${req.originalUrl}:`, error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
