const admin = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');
const Admin = require('../models/Admin');

exports.firebaseProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const idToken = header.split(' ')[1];
    if (!idToken) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    req.firebaseUid = decoded.uid;
    return next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Middleware to check if user is admin
exports.adminProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const idToken = header.split(' ')[1];
    if (!idToken) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    req.firebaseUid = decoded.uid;

    // Check if user is admin - try by firebaseUid first, then by email
    let adminUser = await Admin.findOne({ firebaseUid: decoded.uid, isActive: true });
    
    // If not found by firebaseUid, try by email
    if (!adminUser && decoded.email) {
      adminUser = await Admin.findOne({ email: decoded.email.toLowerCase(), isActive: true });
      
      // If found by email but firebaseUid doesn't match, update it
      if (adminUser && adminUser.firebaseUid !== decoded.uid) {
        adminUser.firebaseUid = decoded.uid;
        await adminUser.save();
        console.log(`Updated admin firebaseUid for ${decoded.email}`);
      }
    }

    if (!adminUser) {
      console.log('Admin check failed:', {
        firebaseUid: decoded.uid,
        email: decoded.email,
        message: 'No active admin found with this Firebase UID or email'
      });
      return next(new ErrorResponse('Not authorized. Admin access required.', 403));
    }

    req.admin = adminUser;
    return next();
  } catch (err) {
    console.error('Admin protect error:', err);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};
