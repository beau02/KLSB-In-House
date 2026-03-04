const mongoose = require('mongoose');

const leaveTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceType: {
    type: String,
    enum: ['overtime_approval', 'manual_adjustment', 'leave_usage'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  hours: {
    type: Number,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  balanceHoursAfter: {
    type: Number,
    required: true,
    min: 0
  },
  balanceDaysAfter: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

leaveTransactionSchema.index({ userId: 1, createdAt: -1 });
leaveTransactionSchema.index({ sourceType: 1, sourceId: 1 });

module.exports = mongoose.model('LeaveTransaction', leaveTransactionSchema);
