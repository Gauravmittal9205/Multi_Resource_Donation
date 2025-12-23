const express = require('express');

const { getFaqs, createFaq, updateFaq, deleteFaq } = require('../controllers/faqs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getFaqs);

router.use(protect);
router.use(authorize('admin'));

router.post('/', createFaq);
router.put('/:id', updateFaq);
router.delete('/:id', deleteFaq);

module.exports = router;
