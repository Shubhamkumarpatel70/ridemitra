const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  utrNumber: {
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

// Generate transaction ID before saving
withdrawalRequestSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    // Generate transaction ID: WDR + timestamp + random
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.transactionId = `WDR${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

