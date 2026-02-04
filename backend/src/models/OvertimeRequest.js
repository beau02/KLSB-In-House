const mongoose = require('mongoose');

// Schema for daily hours within a week
const dailyHoursSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  actualHours: {
    type: Number,
    min: 0,
    default: null
  }
}, { _id: false });

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
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  dailyHours: {
    type: [dailyHoursSchema],
    required: true,
    validate: {
      validator: function(hours) {
        return hours && hours.length > 0 && hours.length <= 7;
      },
      message: 'Weekly request must have between 1 and 7 days'
    }
  },
  totalRequestedHours: {
    type: Number,
    default: 0
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
  },
  
  // Backward compatibility fields (deprecated)
  date: {
    type: Date
  },
  requestedHours: {
    type: Number,
    min: 0,
    max: 24
  },
  actualHours: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Calculate total requested hours before saving
overtimeRequestSchema.pre('save', function(next) {
  if (this.dailyHours && this.dailyHours.length > 0) {
    this.totalRequestedHours = this.dailyHours.reduce((sum, day) => sum + (day.hours || 0), 0);
  }
  next();
});

// Index for faster queries
overtimeRequestSchema.index({ userId: 1, weekStartDate: 1, weekEndDate: 1 });
overtimeRequestSchema.index({ userId: 1, date: 1 }); // Keep for backward compatibility
overtimeRequestSchema.index({ status: 1 });

module.exports = mongoose.model('OvertimeRequest', overtimeRequestSchema);
