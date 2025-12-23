const mongoose = require('mongoose');

const impactSchema = new mongoose.Schema({
  metrics: {
    donations: {
      type: Number,
      default: 0,
      description: 'Total number of items donated'
    },
    beneficiaries: {
      type: Number,
      default: 0,
      description: 'Total number of people helped'
    },
    wasteReduced: {
      type: Number,
      default: 0,
      description: 'Total waste reduced in kilograms'
    },
    ngos: {
      type: Number,
      default: 0,
      description: 'Total number of NGO partners'
    }
  },
  environmentalImpact: [{
    metric: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  successStories: [{
    name: {
      type: String,
      required: true
    },
    story: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    impact: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ngoPartners: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    projects: {
      type: Number,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp before saving
impactSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create impact data
impactSchema.statics.getImpactData = async function() {
  let impactData = await this.findOne();
  if (!impactData) {
    impactData = await this.create({
      metrics: {
        donations: 15420,
        beneficiaries: 8930,
        wasteReduced: 28450,
        ngos: 156
      },
      environmentalImpact: [
        {
          metric: "CO₂ Emissions Reduced",
          value: "12.5 tons",
          icon: "globe",
          description: "Through waste reduction and recycling"
        },
        {
          metric: "Water Saved",
          value: "45,000 liters",
          icon: "recycle",
          description: "By reusing donated items"
        },
        {
          metric: "Landfill Space Saved",
          value: "8.2 tons",
          icon: "trending-up",
          description: "Items diverted from landfills"
        }
      ],
      successStories: [
        {
          name: "Rani Sharma",
          story: "Received educational supplies for her 3 children during COVID-19 lockdown",
          location: "Mumbai, Maharashtra",
          impact: "Education continued despite school closures"
        },
        {
          name: "Village Primary School",
          story: "Got 200+ books and learning materials from urban donors",
          location: "Rural Karnataka",
          impact: "Library established for 500+ students"
        },
        {
          name: "Elderly Home",
          story: "Received warm clothing and medical supplies for 50 residents",
          location: "Delhi NCR",
          impact: "Improved healthcare and comfort for seniors"
        }
      ],
      ngoPartners: [
        { name: "Smile Foundation", category: "Education", projects: 45 },
        { name: "HelpAge India", category: "Elderly Care", projects: 32 },
        { name: "Green Earth Initiative", category: "Environment", projects: 28 },
        { name: "Child Rights Network", category: "Child Welfare", projects: 51 }
      ]
    });
  }
  return impactData;
};

// Static method to update metrics
impactSchema.statics.updateMetrics = async function(updates) {
  return this.findOneAndUpdate(
    {},
    { 
      $inc: updates,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

// Static method to add success story
impactSchema.statics.addSuccessStory = async function(story) {
  return this.findOneAndUpdate(
    {},
    { 
      $push: { successStories: story },
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

// Static method to add NGO partner
impactSchema.statics.addNGOPartner = async function(partner) {
  return this.findOneAndUpdate(
    {},
    { 
      $push: { ngoPartners: partner },
      $inc: { 'metrics.ngos': 1 },
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Impact', impactSchema);
