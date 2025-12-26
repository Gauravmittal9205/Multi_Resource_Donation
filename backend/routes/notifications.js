const express = require('express');

const { firebaseProtect } = require('../middleware/firebaseAuth');
const { listMyNotifications, markNotificationRead, markAllRead } = require('../controllers/notifications');

const router = express.Router();

router.use(firebaseProtect);

router.route('/').get(listMyNotifications);
router.route('/read-all').put(markAllRead);
router.route('/:id/read').put(markNotificationRead);

module.exports = router;
