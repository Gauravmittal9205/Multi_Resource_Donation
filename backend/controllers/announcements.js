const Announcement = require('../models/Announcement');
const asyncHandler = require('../middleware/async');

// @desc    Get all announcements
// @route   GET /api/v1/announcements
// @access  Private (Admin)
exports.getAllAnnouncements = asyncHandler(async (req, res) => {
  const { type, isRead } = req.query;
  
  const query = {};
  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const announcements = await Announcement.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: announcements.length,
    data: announcements
  });
});

// @desc    Mark announcement as read
// @route   PUT /api/v1/announcements/:id/read
// @access  Private (Admin)
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!announcement) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Mark all announcements as read
// @route   PUT /api/v1/announcements/read-all
// @access  Private (Admin)
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Announcement.updateMany(
    { isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All announcements marked as read'
  });
});

