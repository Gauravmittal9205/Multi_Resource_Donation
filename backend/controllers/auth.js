const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  console.log('Registration request received:', JSON.stringify(req.body, null, 2));
  try {
    const { name, email, userType, organizationName, phone, firebaseUid } = req.body;
    
    console.log('Registration attempt with data:', { name, email, userType, firebaseUid });

    // Check if user already exists by email or firebaseUid
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { firebaseUid: firebaseUid || null }
      ]
    });

    if (existingUser) {
      console.log('Registration failed: User already exists with email or firebaseUid:', { email, firebaseUid });
      return next(new ErrorResponse('User already exists', 400));
    }

    // For Firebase-authenticated users, we don't need to store the password
    const userData = {
      name,
      email,
      userType,
      phone: phone || '',
      firebaseUid,
      isVerified: true // Since Firebase already verified the email
    };

    // Add organization name if user type is NGO
    if (userType === 'ngo') {
      if (!organizationName) {
        return next(new ErrorResponse('Organization name is required for NGOs', 400));
      }
      userData.organizationName = organizationName;
    }

    console.log('Creating user with data:', JSON.stringify(userData, null, 2));

    // Create user in MongoDB
    const user = await User.create(userData);
    console.log('User created successfully in MongoDB:', { id: user._id, email: user.email });
    
    // Send response without token since we're using Firebase for auth
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        organizationName: user.organizationName
      }
    });
  } catch (err) {
    console.error('Registration error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      errors: err.errors ? JSON.stringify(err.errors, null, 2) : 'No errors object'
    });
    
    // Handle duplicate key error (E11000)
    if (err.code === 11000) {
      return next(new ErrorResponse('Email or account already exists', 400));
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    
    next(err);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Validate email & password
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('Login failed: No user found with email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Login failed: Invalid password for email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    console.log('Login successful for user:', { id: user._id, email: user.email });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        organizationName: user.organizationName
      }
    });
};
