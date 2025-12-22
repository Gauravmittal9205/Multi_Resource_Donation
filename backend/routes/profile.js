const express = require('express');
const router = express.Router();
const { upsertProfile, getProfileByUid } = require('../controllers/profile');

// Public/simple routes (can be secured later)
router.post('/upsert', upsertProfile);
router.get('/:firebaseUid', getProfileByUid);

module.exports = router;
