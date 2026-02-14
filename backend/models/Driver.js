const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    default: null
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'car'],
    default: null
  },
  vehicleNumber: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  vehicleModel: {
    type: String,
    default: null
  },
  vehicleImage: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  aadharNumber: {
    type: String,
    default: null
  },
  aadharImage: {
    type: String,
    default: null
  },
  panNumber: {
    type: String,
    default: null
  },
  panImage: {
    type: String,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRides: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  declinedRides: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  }],
  vkycStatus: {
    type: String,
    enum: ['not-scheduled', 'scheduled', 'in-progress', 'completed', 'failed'],
    default: 'not-scheduled'
  },
  vkycScheduledAt: {
    type: Date,
    default: null
  },
  vkycCompletedAt: {
    type: Date,
    default: null
  },
  vkycCaptureImages: [{
    type: String,
    default: []
  }],
  accountDetails: {
    accountNumber: {
      type: String,
      default: null
    },
    accountHolderName: {
      type: String,
      default: null
    },
    ifscCode: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique ID before saving
driverSchema.pre('save', async function(next) {
  // Generate unique ID if not already set
  if (!this.uniqueId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.uniqueId = `RM${timestamp.toUpperCase()}${random.toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Driver', driverSchema);

