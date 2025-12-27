const User = require('../models/User');
const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { validatePassword } = require('../utils/passwordValidator');
const Profile = require('../models/Profile');
const admin = require('../config/firebase');
const EmailService = require('../utils/emailService');
const OTPService = require('../utils/otpService');

const emailService = new EmailService();
const otpService = new OTPService();

exports.getUserByFirebaseUid = asyncHandler(async (req, res) => {
  const { firebaseUid } = req.params;
  const user = await User.findOne({ firebaseUid }).select('userType organizationName firebaseUid');
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  return res.status(200).json({ success: true, data: user });
});

exports.deleteMe = asyncHandler(async (req, res, next) => {
  const firebaseUid = req.firebaseUid;
  if (!firebaseUid) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    await admin.auth().deleteUser(firebaseUid);
  } catch (err) {
    if (err?.errorInfo?.code !== 'auth/user-not-found') {
      return next(new ErrorResponse('Failed to delete Firebase account', 500));
    }
  }

  const user = await User.findOne({ firebaseUid }).select('_id');

  await Profile.deleteOne({ firebaseUid });
  await User.deleteOne({ firebaseUid });

  return res.status(200).json({ success: true, data: {} });
});

// @desc    Send OTP for email verification
// @route   POST /api/v1/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse('Email is required', 400));
    }

    // Check if user already exists and needs email verification
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return next(new ErrorResponse('User with this email is already verified', 400));
    }
    
    // Allow OTP for unverified users or new users
    console.log('Sending OTP for email:', email, 'User exists:', !!existingUser);

    // Generate and store OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp);

    // Send OTP email
    await emailService.sendVerificationEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    next(error);
  }
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new ErrorResponse('Email and OTP are required', 400));
    }

    const verification = otpService.verifyOTP(email, otp);

    if (!verification.success) {
      return next(new ErrorResponse(verification.message, 400));
    }

    // Update user's email verification status in MongoDB
    try {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { emailVerified: true },
        { new: true }
      );
      
      if (updatedUser) {
        console.log('Email verification status updated for:', email);
      } else {
        console.log('User not found for email verification update:', email);
      }
    } catch (updateError) {
      console.error('Error updating email verification status:', updateError);
      // Don't fail the OTP verification if MongoDB update fails
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    next(error);
  }
});

// @desc    Debug endpoint to get OTP for testing
// @route   POST /api/v1/auth/debug-otp
// @access  Public (development only)
exports.debugOTP = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new ErrorResponse('Email is required', 400));
    }
    
    const otpData = otpService.getOTPForEmail(email);
    
    if (!otpData) {
      return res.status(404).json({
        success: false,
        message: 'No OTP found for this email'
      });
    }
    
    res.status(200).json({
      success: true,
      data: otpData
    });
  } catch (error) {
    console.error('Debug OTP error:', error);
    next(error);
  }
});

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  console.log('Registration request received:', JSON.stringify(req.body, null, 2));
  try {
    const { name, email, userType, organizationName, phone, firebaseUid, password, emailVerified } = req.body;
    
    console.log('Registration attempt with data:', { name, email, userType, firebaseUid });

    // Check if email verification is required and not completed
    // Allow registration without email verification for email/password users
    // They will be verified via OTP process
    if (!firebaseUid && emailVerified === false) {
      // This is the initial registration before OTP verification - allow it
      console.log('Allowing initial registration before email verification');
    } else if (!firebaseUid && !emailVerified) {
      return next(new ErrorResponse('Email verification is required', 400));
    }

    // Validate password if provided (for email/password registration)
    if (password && !firebaseUid) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return next(new ErrorResponse(passwordValidation.errors.join(', '), 400));
      }
    }

    // Check if user already exists by email or firebaseUid
    console.log('Checking for existing user with email:', email);
    
    // Temporarily bypass existing user check for debugging
    // TODO: Fix MongoDB query issue
    console.log('Bypassing existing user check for debugging');
    const existingUser = null;

    // For Firebase-authenticated users, we don't need to store the password
    const userData = {
      name,
      email,
      userType,
      phone: phone || '',
      firebaseUid,
      isVerified: firebaseUid ? true : emailVerified || false
    };

    // Add password for email/password registration
    if (password && !firebaseUid) {
      userData.password = password;
    }

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

    // Send welcome email for email/password registration
    if (!firebaseUid && emailVerified) {
      try {
        await emailService.sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the registration if welcome email fails
      }
    }
    
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

// @desc    Admin Login
// @route   POST /api/v1/auth/admin/login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt for email:', email);

    // Validate email & password
    if (!email || !password) {
      console.log('Admin login failed: Missing email or password');
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for admin in MongoDB
    const adminUser = await Admin.findOne({ email, isActive: true }).select('+password');

    if (!adminUser) {
      console.log('Admin login failed: No admin found with email:', email);
      return next(new ErrorResponse('Invalid admin credentials', 401));
    }

    // Check if password matches
    const isMatch = await adminUser.matchPassword(password);

    if (!isMatch) {
      console.log('Admin login failed: Invalid password for email:', email);
      return next(new ErrorResponse('Invalid admin credentials', 401));
    }

    // Verify admin exists in Firebase or create Firebase user
    let firebaseUid = adminUser.firebaseUid;
    
    try {
      if (firebaseUid) {
        // Verify Firebase user exists
        try {
          await admin.auth().getUser(firebaseUid);
        } catch (firebaseError) {
          // If Firebase user doesn't exist, create one
          firebaseUid = null;
        }
      }

      if (!firebaseUid) {
        // Create Firebase user for admin (without password - will be set by frontend)
        // Frontend will handle Firebase authentication after MongoDB verification
        const firebaseUser = await admin.auth().createUser({
          email: adminUser.email,
          displayName: adminUser.name,
          disabled: false
        });
        
        firebaseUid = firebaseUser.uid;
        
        // Update admin record with Firebase UID
        adminUser.firebaseUid = firebaseUid;
        await adminUser.save();
        
        // Set password for Firebase user (this is a one-time operation)
        await admin.auth().updateUser(firebaseUid, {
          password: password
        });
      }
    } catch (firebaseError) {
      console.error('Firebase admin creation/verification error:', firebaseError);
      // Continue with MongoDB authentication even if Firebase fails
    }

    console.log('Admin login successful:', { id: adminUser._id, email: adminUser.email });

    res.status(200).json({
      success: true,
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        firebaseUid: firebaseUid,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    next(err);
  }
});

// @desc    Check if user is admin
// @route   GET /api/v1/auth/admin/check
// @access  Public
exports.checkAdmin = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        isAdmin: false,
        error: 'Email is required'
      });
    }

    const adminUser = await Admin.findOne({ email: email.toLowerCase(), isActive: true });

    res.status(200).json({
      success: true,
      isAdmin: !!adminUser
    });
  } catch (err) {
    console.error('Check admin error:', err);
    res.status(200).json({
      success: true,
      isAdmin: false
    });
  }
});
