const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectCode: {
    type: String,
    required: [true, 'Project code is required'],
    // allow duplicate project codes when titles differ
    unique: false,
    uppercase: true,
    trim: true
  },
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active'
  },
  company: {
    type: String,
    trim: true
  },
  contractor: {
    type: String,
    trim: true
  },
  platforms: {
    type: [{
      type: String,
      trim: true
    }],
    default: []
  },
  areas: {
    type: [{
      type: String,
      trim: true
    }],
    default: []
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster searches (projectCode already has unique:true, no need for separate index)
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
