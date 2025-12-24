const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getNgoProfile, 
  getNgoProfileById,
  createOrUpdateNgoProfile, 
  uploadDocument 
} = require('../controllers/ngoProfile');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

router.route('/me')
  .get(getNgoProfile);

router.route('/:id')
  .get(getNgoProfileById);

router.route('/')
  .post(createOrUpdateNgoProfile);

router.route('/documents')
  .put(uploadDocument);

module.exports = router;
