const express = require('express');
const router = express.Router();
const {
  getImpactData,
  updateMetrics,
  addSuccessStory,
  addNGOPartner,
  getMetricsSummary,
  getSuccessStories,
  getNGOPartners,
  getEnvironmentalImpact
} = require('../controllers/impactController');

// GET /api/impact - Get all impact data
router.get('/', getImpactData);

// GET /api/impact/metrics - Get metrics summary
router.get('/metrics', getMetricsSummary);

// GET /api/impact/stories - Get success stories
router.get('/stories', getSuccessStories);

// GET /api/impact/ngos - Get NGO partners
router.get('/ngos', getNGOPartners);

// GET /api/impact/environmental - Get environmental impact
router.get('/environmental', getEnvironmentalImpact);

// POST /api/impact/metrics - Update metrics (protected route)
router.post('/metrics', updateMetrics);

// POST /api/impact/stories - Add success story (protected route)
router.post('/stories', addSuccessStory);

// POST /api/impact/ngos - Add NGO partner (protected route)
router.post('/ngos', addNGOPartner);

module.exports = router;
