const express = require('express');

// const { firebaseProtect } = require('../middleware/firebaseAuth');
const { listMyNotifications, markNotificationRead, markAllRead } = require('../controllers/notifications');


const { firebaseProtect } = require('../middleware/firebaseAuth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notifications');

const router = express.Router();

// All routes require Firebase authentication
router.use(firebaseProtect);

router.route('/').get(getMyNotifications);
router.route('/read-all').put(markAllAsRead);
router.route('/:id/read').put(markAsRead);

module.exports = router;

