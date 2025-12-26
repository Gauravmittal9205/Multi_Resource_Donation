const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for logged in NGO
// @route   GET /api/v1/notifications
// @access  Private (Firebase)
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;

  const notifications = await Notification.find({ ngoFirebaseUid })
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
  const ngoFirebaseUid = req.firebaseUid;

  const notification = await Notification.findOne({
    _id: id,
    ngoFirebaseUid
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private (Firebase)
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;

  await Notification.updateMany(
    { ngoFirebaseUid, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

