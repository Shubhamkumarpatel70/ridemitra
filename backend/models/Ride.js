const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'car'],
    required: true
  },
  distance: {
    type: Number,
    default: 0
  },
  fare: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'prepaid', 'wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: ''
  },
  couponCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  originalFare: {
    type: Number,
    default: 0
  },
  rideId: {
    type: String,
    unique: true,
    sparse: true
  },
  rideType: {
    type: String,
    enum: ['personal', 'sharing'],
    default: 'personal'
  }
});

// Generate ride ID before saving
rideSchema.pre('save', async function(next) {
  if (!this.rideId) {
    // Generate unique ride ID: RM + timestamp + random 4 digits
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.rideId = `RM${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Ride', rideSchema);

