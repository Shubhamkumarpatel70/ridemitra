const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountHolderName: {
    type: String,
    required: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  adminRemark: {
    type: String,
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);

