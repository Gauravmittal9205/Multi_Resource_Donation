const express = require('express');

const { createContact } = require('../controllers/contacts');

const router = express.Router();

router.post('/', createContact);

module.exports = router;
