const express = require('express');

const { firebaseProtect } = require('../middleware/firebaseAuth');
const { getMyNgoProfile, upsertMyNgoProfile } = require('../controllers/ngoProfile');

const router = express.Router();

router.use(firebaseProtect);

router.route('/me').get(getMyNgoProfile).put(upsertMyNgoProfile);

module.exports = router;
