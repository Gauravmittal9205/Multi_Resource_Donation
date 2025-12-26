const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const { 
  createContact, 
  getAllHelpMessages, 
  updateHelpMessageStatus 
} = require('../controllers/contacts');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllHelpMessages);
router.route('/admin/:id').put(adminProtect, updateHelpMessageStatus);

// Public route for creating contact/help messages
router.post('/', createContact);

module.exports = router;
