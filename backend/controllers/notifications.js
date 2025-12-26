const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.listMyNotifications = asyncHandler(async (req, res) => {
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

  const items = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(take)
    .lean();

  res.status(200).json({ success: true, count: items.length, data: items });
});

exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const recipientFirebaseUid = req.firebaseUid;
  const { id } = req.params;

  const n = await Notification.findById(id);
  if (!n) return next(new ErrorResponse('Notification not found', 404));
  if (n.recipientFirebaseUid !== recipientFirebaseUid) return next(new ErrorResponse('Not authorized', 403));

  if (!n.read) {
    n.read = true;
    n.readAt = new Date();
    await n.save();
  }

  res.status(200).json({ success: true, data: n });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const recipientFirebaseUid = req.firebaseUid;

  await Notification.updateMany(
    { recipientFirebaseUid, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.status(200).json({ success: true, data: {} });
});

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

