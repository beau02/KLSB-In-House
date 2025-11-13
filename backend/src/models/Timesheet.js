const mongoose = require('mongoose');

const timesheetEntrySchema = new mongoose.Schema({
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
    enum: ['draft', 'submitted', 'approved', 'rejected'],
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
  totalHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total hours before saving
timesheetSchema.pre('save', function(next) {
  this.totalHours = this.entries.reduce((sum, entry) => sum + entry.hours, 0);
  next();
});

// Compound index for unique timesheet per user/project/month/year
timesheetSchema.index({ userId: 1, projectId: 1, month: 1, year: 1 }, { unique: true });
timesheetSchema.index({ status: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);
