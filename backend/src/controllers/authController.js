const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Verify reCAPTCHA token. Supports both v2/siteverify and Enterprise assessment.
const verifyRecaptcha = async (token, action = 'login') => {
  try {
    // If Enterprise env vars present, use Recaptcha Enterprise API
    const enterpriseApiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
    const enterpriseProject = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
    const enterpriseSiteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY || process.env.RECAPTCHA_SITE_KEY;

    if (enterpriseApiKey && enterpriseProject) {
      // Build request body per Recaptcha Enterprise API
      const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${enterpriseProject}/assessments?key=${enterpriseApiKey}`;
      const body = {
        event: {
          token: token,
          siteKey: enterpriseSiteKey,
          expectedAction: action
        }
      };

      const resp = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = resp && resp.data;
      if (!data) {
        console.warn('reCAPTCHA Enterprise: empty response');
        return false;
      }

      // tokenProperties.valid indicates token validity. You can also inspect riskAnalysis.score
      const valid = data.tokenProperties && data.tokenProperties.valid;
      if (!valid) {
        console.warn('reCAPTCHA Enterprise token invalid:', data.tokenProperties);
        return false;
      }

      // Optionally, you may check the action matches expectedAction
      if (data.tokenProperties.action && data.tokenProperties.action !== action) {
        console.warn('reCAPTCHA Enterprise action mismatch:', data.tokenProperties.action, 'expected:', action);
        // treat as invalid
        return false;
      }

      // Optionally inspect riskAnalysis.score and decide threshold (0.0 - 1.0)
      // For now accept valid tokens; operators can tune by checking data.riskAnalysis.score
      return true;
    }

    // Fallback to legacy reCAPTCHA v2 siteverify using secret key
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    console.log('reCAPTCHA Secret Key (first 10 chars):', secretKey ? secretKey.substring(0, 10) : 'NOT SET');
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not configured - skipping verification');
      return true; // Allow login if captcha not configured
    }

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (!response || !response.data) {
      console.warn('reCAPTCHA: invalid response from verification endpoint');
      return false;
    }

    if (!response.data.success) {
      console.warn('reCAPTCHA verification failed:', response.data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error?.response?.data || error.message || error);
    return false;
  }
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department, employeeNo, designation, contactNo } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if employeeNo is provided and already exists
    if (employeeNo) {
      const employeeExists = await User.findOne({ employeeNo });
      if (employeeExists) {
        return res.status(400).json({ message: 'Employee number already exists' });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'employee',
      department,
      employeeNo,
      designation,
      contactNo
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        employeeNo: user.employeeNo,
        designation: user.designation,
        contactNo: user.contactNo,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    console.log('[SERVER] /api/auth/login received payload:', {
      email: email || '[missing]',
      captchaTokenPresent: !!captchaToken,
      captchaTokenLength: captchaToken ? captchaToken.length : 0
    });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // If server has reCAPTCHA configured (v2 or Enterprise), require captchaToken and verify it
    const enterpriseEnabled = process.env.RECAPTCHA_ENTERPRISE_API_KEY && process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
    const v2Enabled = !!process.env.RECAPTCHA_SECRET_KEY;

    // TEMPORARY: Bypass reCAPTCHA for testing authentication
    console.warn('[reCAPTCHA] TEMPORARILY BYPASSED for testing - remove this after debugging');
    if (false && process.env.RECAPTCHA_BYPASS === 'true') {
      console.warn('[reCAPTCHA] Bypass enabled - skipping captcha verification');
    } else if (false && (enterpriseEnabled || v2Enabled)) {
      if (!captchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA token is required' });
      }

      // Pass expected action for enterprise assessment; default to 'login'
      const isCaptchaValid = await verifyRecaptcha(captchaToken, 'login');
      console.log('[SERVER] reCAPTCHA verification result:', isCaptchaValid);
      if (!isCaptchaValid) {
        return res.status(401).json({ message: 'Invalid captcha verification. Please try again.' });
      }
    }

    // Check for user (explicitly select password)
    const user = await User.findOne({ email }).select('+password');
    console.log('[SERVER] user lookup result:', user ? { id: user._id.toString(), email: user.email, role: user.role, status: user.status } : null);
    if (!user) {
      console.warn('[SERVER] login failed - user not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('[SERVER] password match result for user', user._id.toString(), ':', !!isMatch);
    if (!isMatch) {
      console.warn('[SERVER] login failed - invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('[SERVER] generated JWT token length:', token ? token.length : 0);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
