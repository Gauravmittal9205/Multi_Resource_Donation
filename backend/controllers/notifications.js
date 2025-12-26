const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for logged in donor
// @route   GET /api/v1/notifications
// @access  Private (Firebase)
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const recipientFirebaseUid = req.firebaseUid;
  const { category, includeRead, limit } = req.query;

  const query = { recipientFirebaseUid };
  if (category && String(category).trim() !== 'all') {
    query.category = String(category).trim();
  }
  if (String(includeRead || '').toLowerCase() !== 'true') {
    query.read = false;
  }

  const take = Math.min(Math.max(Number(limit || 50), 1), 200);

  const notifications = await Notification.find(query)
    .populate('donationId', 'resourceType status')
    .sort({ createdAt: -1 })
    .limit(take)
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipientFirebaseUid,
    read: false
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private (Firebase)
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recipientFirebaseUid = req.firebaseUid;

  const notification = await Notification.findOne({
    _id: id,
    recipientFirebaseUid
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }

  if (!notification.read) {
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private (Firebase)
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const recipientFirebaseUid = req.firebaseUid;

  await Notification.updateMany(
    { recipientFirebaseUid, read: false },
    { read: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

