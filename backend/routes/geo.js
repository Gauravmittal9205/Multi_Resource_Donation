const express = require('express');
const router = express.Router();
const { nominatimSearch } = require('../controllers/geo');

router.get('/nominatim', nominatimSearch);

module.exports = router;
