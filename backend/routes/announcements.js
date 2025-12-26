const express = require('express');
const { adminProtect } = require('../middleware/firebaseAuth');
const {
  getAllAnnouncements,
  markAsRead,
  markAllAsRead
} = require('../controllers/announcements');

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

router.route('/').get(getAllAnnouncements);
router.route('/read-all').put(markAllAsRead);
router.route('/:id/read').put(markAsRead);

module.exports = router;

