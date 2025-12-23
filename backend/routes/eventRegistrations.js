const express = require('express');
const {
  registerForEvent,
  getEventRegistrations,
  getEventRegistrationsByEvent,
  getRegistration,
  deleteRegistration
} = require('../controllers/eventRegistrations');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const EventRegistration = require('../models/EventRegistration');

const router = express.Router();

// Public routes
router.post('/', registerForEvent);

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', 
  advancedResults(EventRegistration),
  getEventRegistrations
);

router.get('/event/:eventId', getEventRegistrationsByEvent);
router.get('/:id', getRegistration);
router.delete('/:id', deleteRegistration);

module.exports = router;
