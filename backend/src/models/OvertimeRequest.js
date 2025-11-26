const mongoose = require('mongoose');

const overtimeRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  requestedHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  actualHours: {
    type: Number,
    min: 0,
    default: null
  },
  reason: {
    type: String,
    required: true
  },
  workDescription: {
    type: String
  },
  disciplineCode: {
    type: String
  },
  area: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
overtimeRequestSchema.index({ userId: 1, date: 1 });
overtimeRequestSchema.index({ status: 1 });

module.exports = mongoose.model('OvertimeRequest', overtimeRequestSchema);
