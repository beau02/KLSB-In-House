const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectCode: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
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
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project manager is required']
  },
  budget: {
    type: Number,
    default: 0
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster searches
projectSchema.index({ projectCode: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
