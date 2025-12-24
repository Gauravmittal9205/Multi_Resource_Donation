const admin = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');

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
