const Impact = require('../models/Impact');

// Get all impact data
const getImpactData = async (req, res) => {
  try {
    const impactData = await Impact.getImpactData();
    res.status(200).json({
      success: true,
      data: impactData
    });
  } catch (error) {
    console.error('Error fetching impact data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching impact data',
      error: error.message
    });
  }
};

// Update metrics (for when donations are made)
const updateMetrics = async (req, res) => {
  try {
    const { donations, beneficiaries, wasteReduced } = req.body;
    
    const updates = {};
    if (donations) updates['metrics.donations'] = donations;
    if (beneficiaries) updates['metrics.beneficiaries'] = beneficiaries;
    if (wasteReduced) updates['metrics.wasteReduced'] = wasteReduced;

    const impactData = await Impact.updateMetrics(updates);
    
    res.status(200).json({
      success: true,
      message: 'Metrics updated successfully',
      data: impactData
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating metrics',
      error: error.message
    });
  }
};

// Add a new success story
const addSuccessStory = async (req, res) => {
  try {
    const { name, story, location, impact } = req.body;
    
    if (!name || !story || !location || !impact) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required for success story'
      });
    }

    const newStory = { name, story, location, impact };
    const impactData = await Impact.addSuccessStory(newStory);
    
    res.status(201).json({
      success: true,
      message: 'Success story added successfully',
      data: impactData
    });
  } catch (error) {
    console.error('Error adding success story:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding success story',
      error: error.message
    });
  }
};

// Add a new NGO partner
const addNGOPartner = async (req, res) => {
  try {
    const { name, category, projects } = req.body;
    
    if (!name || !category || !projects) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required for NGO partner'
      });
    }

    const newPartner = { name, category, projects };
    const impactData = await Impact.addNGOPartner(newPartner);
    
    res.status(201).json({
      success: true,
      message: 'NGO partner added successfully',
      data: impactData
    });
  } catch (error) {
    console.error('Error adding NGO partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding NGO partner',
      error: error.message
    });
  }
};

// Get metrics summary (for dashboard widgets)
const getMetricsSummary = async (req, res) => {
  try {
    const impactData = await Impact.getImpactData();
    
    const summary = {
      donations: impactData.metrics.donations,
      beneficiaries: impactData.metrics.beneficiaries,
      wasteReduced: impactData.metrics.wasteReduced,
      ngos: impactData.metrics.ngos,
      lastUpdated: impactData.lastUpdated
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics summary',
      error: error.message
    });
  }
};

// Get all success stories
const getSuccessStories = async (req, res) => {
  try {
    const impactData = await Impact.getImpactData();
    
    res.status(200).json({
      success: true,
      data: impactData.successStories
    });
  } catch (error) {
    console.error('Error fetching success stories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching success stories',
      error: error.message
    });
  }
};

// Get all NGO partners
const getNGOPartners = async (req, res) => {
  try {
    const impactData = await Impact.getImpactData();
    
    res.status(200).json({
      success: true,
      data: impactData.ngoPartners
    });
  } catch (error) {
    console.error('Error fetching NGO partners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NGO partners',
      error: error.message
    });
  }
};

// Get environmental impact data
const getEnvironmentalImpact = async (req, res) => {
  try {
    const impactData = await Impact.getImpactData();
    
    res.status(200).json({
      success: true,
      data: impactData.environmentalImpact
    });
  } catch (error) {
    console.error('Error fetching environmental impact:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching environmental impact',
      error: error.message
    });
  }
};

module.exports = {
  getImpactData,
  updateMetrics,
  addSuccessStory,
  addNGOPartner,
  getMetricsSummary,
  getSuccessStories,
  getNGOPartners,
  getEnvironmentalImpact
};
