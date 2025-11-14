const mongoose = require('mongoose');

const timesheetEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  normalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  otHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  hoursCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const timesheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  disciplineCode: {
    type: String,
    trim: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  entries: [timesheetEntrySchema],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'resubmitted'],
    default: 'draft'
  },
  submittedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  comments: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  resubmissionCount: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalNormalHours: {
    type: Number,
    default: 0
  },
  totalOTHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total hours before saving
timesheetSchema.pre('save', function(next) {
  this.totalNormalHours = this.entries.reduce((sum, entry) => sum + (entry.normalHours || 0), 0);
  this.totalOTHours = this.entries.reduce((sum, entry) => sum + (entry.otHours || 0), 0);
  this.totalHours = this.totalNormalHours + this.totalOTHours;
  next();
});

// Compound index for unique timesheet per user/project/month/year
timesheetSchema.index({ userId: 1, projectId: 1, month: 1, year: 1 }, { unique: true });
timesheetSchema.index({ status: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);
