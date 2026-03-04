const mongoose = require('mongoose');

const overtimeSettlementSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OvertimeRequest',
    required: true,
    unique: true
  },
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
  compensationType: {
    type: String,
    enum: ['ot_payment', 'replacement_leave'],
    required: true
  },
  approvedHours: {
    type: Number,
    required: true,
    min: 0
  },
  leaveCreditHours: {
    type: Number,
    default: 0,
    min: 0
  },
  leaveCreditDays: {
    type: Number,
    default: 0,
    min: 0
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settledAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

overtimeSettlementSchema.index({ userId: 1, compensationType: 1, settledAt: -1 });

module.exports = mongoose.model('OvertimeSettlement', overtimeSettlementSchema);
