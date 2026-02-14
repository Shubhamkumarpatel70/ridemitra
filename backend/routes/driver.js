const express = require('express');
const { body, validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const OTP = require('../models/OTP');
const Transaction = require('../models/Transaction');
const WithdrawRequest = require('../models/WithdrawRequest');
const { auth, isDriver } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/driver/profile
// @desc    Get driver profile
// @access  Private (Driver)
router.get('/profile', auth, isDriver, async (req, res) => {
  try {
    let driver = await Driver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone uniqueId')
      .select('userId licenseNumber vehicleType vehicleNumber vehicleModel vehicleImage profileImage aadharNumber aadharImage panNumber panImage verificationStatus rejectionReason isAvailable isVerified currentLocation rating totalRides earnings declinedRides vkycStatus vkycScheduledAt vkycCompletedAt vkycCaptureImages accountDetails uniqueId createdAt');

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Generate unique ID if it doesn't exist
    if (!driver.uniqueId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      let uniqueId = `RM${timestamp.toUpperCase()}${random.toUpperCase()}`;
      
      // Ensure uniqueness
      while (await Driver.findOne({ uniqueId })) {
        const newTimestamp = Date.now().toString(36);
        const newRandom = Math.random().toString(36).substring(2, 8);
        uniqueId = `RM${newTimestamp.toUpperCase()}${newRandom.toUpperCase()}`;
      }
      
      driver.uniqueId = uniqueId;
      await driver.save();
    }

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/profile-by-id/:id
// @desc    Get driver profile by driver ID (for user dashboard to show driver details)
// @access  Private (User/Driver/Admin)
router.get('/profile-by-id/:id', auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'name email phone uniqueId')
      .select('userId licenseNumber vehicleType vehicleNumber vehicleModel vehicleImage profileImage aadharNumber aadharImage panNumber panImage verificationStatus rejectionReason isAvailable isVerified currentLocation rating totalRides earnings declinedRides vkycStatus vkycScheduledAt vkycCompletedAt vkycCaptureImages accountDetails uniqueId createdAt');

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/stats/:id
// @desc    Get driver statistics (total rides, completed, earnings, rating) by driver ID
// @access  Private (User/Driver/Admin)
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const completedRides = await Ride.find({
      driverId: driver._id,
      status: 'completed'
    });

    const totalRides = completedRides.length;
    const totalEarnings = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const averageRating = driver.rating; // Use the pre-calculated rating from driver model

    res.json({
      totalRides,
      completedRides: totalRides, // Assuming all total rides are completed for this stat
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      rating: averageRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/availability
// @desc    Toggle driver availability
// @access  Private (Driver)
router.put('/availability', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Check if driver has an active ride
    const activeRide = await Ride.findOne({
      driverId: driver._id,
      status: { $in: ['accepted', 'in-progress'] }
    });

    if (activeRide) {
      return res.status(400).json({ message: 'Cannot change availability while on an active ride.' });
    }

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    res.json({ isAvailable: driver.isAvailable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/location
// @desc    Update driver's current location
// @access  Private (Driver)
router.put('/location', auth, isDriver, [
  body('latitude').isNumeric().withMessage('Latitude is required'),
  body('longitude').isNumeric().withMessage('Longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    driver.currentLocation = {
      latitude: req.body.latitude,
      longitude: req.body.longitude
    };
    await driver.save();

    res.json({ message: 'Location updated successfully', location: driver.currentLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/rides/pending
// @desc    Get pending rides for driver
// @access  Private (Driver)
router.get('/rides/pending', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Check if driver is verified and has vehicle details
    if (!driver.isVerified) {
      return res.status(403).json({ message: 'Driver account not verified. Please wait for admin approval.' });
    }

    if (!driver.vehicleType || !driver.vehicleNumber) {
      return res.status(400).json({ message: 'Please add your vehicle details first' });
    }

    // Check if driver has any active ride
    const activeRide = await Ride.findOne({
      driverId: driver._id,
      status: { $in: ['accepted', 'in-progress'] }
    });

    // Only show pending rides if driver doesn't have an active ride
    if (activeRide) {
      console.log(`Driver ${driver._id} has active ride - returning empty rides`);
      return res.json([]);
    }

    // Find all pending rides matching driver's vehicle type
    // Exclude rides that this driver has already declined
    const declinedRideIds = driver.declinedRides || [];
    
    const query = {
      status: 'pending',
      vehicleType: driver.vehicleType,
      _id: { $nin: declinedRideIds } // Exclude declined rides
    };
    
    // Only show rides without a driver assigned
    query.$or = [
      { driverId: null },
      { driverId: { $exists: false } }
    ];

    console.log(`Searching for pending rides with query:`, JSON.stringify(query, null, 2));
    
    const pendingRides = await Ride.find(query)
      .populate('userId', 'name phone')
      .select('pickupLocation dropoffLocation distance fare vehicleType bookingTime userId paymentMethod originalFare discountAmount couponCode rideId rideType')
      .sort({ bookingTime: -1 })
      .limit(50); // Limit to prevent too many results

    console.log(`Found ${pendingRides.length} pending rides for driver ${driver._id} with vehicle type ${driver.vehicleType}`);
    if (pendingRides.length > 0) {
      console.log('Sample ride IDs:', pendingRides.map(r => r._id));
    }

    res.json(pendingRides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/rides/:id/accept
// @desc    Accept a ride
// @access  Private (Driver)
router.put('/rides/:id/accept', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Check if driver is verified and has vehicle details
    if (!driver.isVerified) {
      return res.status(403).json({ message: 'Driver account not verified. Please wait for admin approval.' });
    }

    if (!driver.vehicleType || !driver.vehicleNumber) {
      return res.status(400).json({ message: 'Please add your vehicle details first' });
    }

    if (!driver.isAvailable) {
      return res.status(400).json({ message: 'Driver is not available' });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is not available' });
    }

    if (ride.vehicleType !== driver.vehicleType) {
      return res.status(400).json({ message: 'Vehicle type mismatch' });
    }

    ride.driverId = driver._id;
    ride.status = 'accepted';
    await ride.save();

    // Generate OTP
    const OTPModel = require('../models/OTP');
    const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
    const otpCode = generateOTP();

    let otp = await OTPModel.findOne({ rideId: ride._id });
    if (otp) {
      otp.code = otpCode;
      otp.verified = false;
      otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    } else {
      otp = new OTPModel({
        rideId: ride._id,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
    }
    await otp.save();

    driver.isAvailable = false;
    await driver.save();

    await ride.populate('userId', 'name phone avatar');
    await ride.populate({
      path: 'driverId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    });

    res.json({ ...ride.toObject(), otp: otpCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/rides/:id/reach-destination
// @desc    Driver reached pickup destination
// @access  Private (Driver)
router.put('/rides/:id/reach-destination', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId.toString() !== driver._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride must be accepted first' });
    }

    // OTP should already be generated when ride was accepted
    const OTPModel = require('../models/OTP');
    const otp = await OTPModel.findOne({ rideId: ride._id });
    if (!otp) {
      return res.status(400).json({ message: 'OTP not found. Please accept the ride again.' });
    }

    res.json({ 
      message: 'Reached destination. Please verify OTP to start ride.',
      otpRequired: true,
      otp: otp.code // Return OTP for auto-fill
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/rides/:id/decline
// @desc    Decline a ride
// @access  Private (Driver)
router.put('/rides/:id/decline', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is not available' });
    }

    // Add ride to driver's declined rides list so it won't show again
    if (!driver.declinedRides) {
      driver.declinedRides = [];
    }
    if (!driver.declinedRides.includes(ride._id)) {
      driver.declinedRides.push(ride._id);
      await driver.save();
    }

    // Ride remains pending, driver just declines
    // The system will show it to next available driver
    res.json({ message: 'Ride declined. Will be shown to next available driver.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/rides/:id/complete
// @desc    Complete a ride
// @access  Private (Driver)
router.put('/rides/:id/complete', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId.toString() !== driver._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ride.status !== 'in-progress' && ride.status !== 'accepted') {
      return res.status(400).json({ message: `Ride must be in progress or accepted. Current status: ${ride.status}` });
    }
    
    // If ride is still 'accepted', update to 'in-progress' first
    if (ride.status === 'accepted') {
      ride.status = 'in-progress';
      ride.startTime = new Date();
    }

    ride.status = 'completed';
    ride.endTime = new Date();
    
    // Handle payment based on payment method
    if (ride.paymentMethod === 'wallet' || ride.paymentMethod === 'prepaid') {
      // For wallet/prepaid payments, already deducted at booking, just mark as completed
      ride.paymentStatus = 'completed';
    } else if (ride.paymentMethod === 'online' || ride.paymentMethod === 'card') {
      // For online/card payments, mark as completed automatically
      ride.paymentStatus = 'completed';
    } else {
      // For cash, payment status remains pending until collected
      ride.paymentStatus = 'pending';
    }
    await ride.save();

    // Update driver stats
    driver.totalRides += 1;
    driver.isAvailable = true;

    // Only add earnings and create transaction for non-cash payments or if payment is already completed
    // For cash payments, earnings will be added when payment is collected
    if (ride.paymentMethod !== 'cash' || ride.paymentStatus === 'completed') {
      const oldEarnings = driver.earnings || 0;
      driver.earnings = oldEarnings + ride.fare;

      // Create transaction record for driver earnings
      const transaction = new Transaction({
        userId: driver.userId,
        driverId: driver._id,
        rideId: ride._id,
        type: 'credit',
        amount: ride.fare,
        description: `Ride completed - ${ride.rideId || ride._id}`,
        balanceAfter: driver.earnings
      });
      await transaction.save();
    }

    // Calculate average rating
    const completedRides = await Ride.find({
      driverId: driver._id,
      status: 'completed',
      rating: { $ne: null }
    });
    if (completedRides.length > 0) {
      const totalRating = completedRides.reduce((sum, r) => sum + r.rating, 0);
      driver.rating = parseFloat((totalRating / completedRides.length).toFixed(2));
    }

    await driver.save();

    await ride.populate('userId', 'name phone');

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/rides/:id/collect-payment
// @desc    Mark payment as collected (for cash payments)
// @access  Private (Driver)
router.put('/rides/:id/collect-payment', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId.toString() !== driver._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Ride must be completed first' });
    }

    if (ride.paymentMethod !== 'cash') {
      return res.status(400).json({ message: 'Payment method is not cash' });
    }

    if (ride.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already collected' });
    }

    ride.paymentStatus = 'completed';
    await ride.save();

    // Cash payments are collected directly by driver, not added to wallet/earnings
    // Just mark payment as collected for record-keeping

    res.json({ message: 'Payment collected successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/earnings
// @desc    Get driver earnings
// @access  Private (Driver)
router.get('/earnings', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const rides = await Ride.find({
      driverId: driver._id,
      status: 'completed'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = rides
      .filter(r => r.endTime && new Date(r.endTime) >= today)
      .reduce((sum, r) => sum + r.fare, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = rides
      .filter(r => r.endTime && new Date(r.endTime) >= thisMonth)
      .reduce((sum, r) => sum + r.fare, 0);

    res.json({
      totalEarnings: driver.earnings,
      todayEarnings,
      monthlyEarnings,
      totalRides: driver.totalRides,
      rating: driver.rating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/vkyc/schedule
// @desc    Schedule a VKYC call
// @access  Private (Driver)
router.post('/vkyc/schedule', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const { scheduledAt } = req.body;
    if (!scheduledAt) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    driver.vkycStatus = 'scheduled';
    driver.vkycScheduledAt = new Date(scheduledAt);
    await driver.save();

    res.json({ message: 'VKYC call scheduled successfully', driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/vkyc/join
// @desc    Join VKYC call
// @access  Private (Driver)
router.post('/vkyc/join', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    if (driver.vkycStatus !== 'scheduled') {
      return res.status(400).json({ message: 'No scheduled VKYC call found' });
    }

    driver.vkycStatus = 'in-progress';
    await driver.save();

    // Generate a call ID (in production, use WebRTC signaling server)
    const callId = `vkyc-${driver._id}-${Date.now()}`;

    res.json({ message: 'Joined VKYC call', callId, driverId: driver._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/transactions
// @desc    Get driver transaction history
// @access  Private (Driver)
router.get('/transactions', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const transactions = await Transaction.find({ 
      $or: [
        { userId: req.user.id, driverId: driver._id },
        { driverId: driver._id }
      ]
    })
      .populate('rideId', 'rideId fare pickupLocation dropoffLocation')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/driver/account-details
// @desc    Update driver account details
// @access  Private (Driver)
router.put('/account-details', auth, isDriver, [
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('confirmAccountNumber').custom((value, { req }) => {
    if (value !== req.body.accountNumber) {
      throw new Error('Account numbers do not match');
    }
    return true;
  }),
  body('ifscCode').notEmpty().withMessage('IFSC code is required'),
  body('accountHolderName').notEmpty().withMessage('Account holder name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Check if account details already exist and have been edited
    if (driver.accountDetails && driver.accountDetails.isEdited) {
      return res.status(400).json({ message: 'Account details can only be edited once. Please contact admin for changes.' });
    }

    driver.accountDetails = {
      accountNumber: req.body.accountNumber,
      accountHolderName: req.body.accountHolderName,
      ifscCode: req.body.ifscCode.toUpperCase(),
      isVerified: false,
      isEdited: true
    };
    await driver.save();

    res.json({ message: 'Account details updated successfully', accountDetails: driver.accountDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/account-details
// @desc    Get driver account details
// @access  Private (Driver)
router.get('/account-details', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    res.json({ accountDetails: driver.accountDetails || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/driver/withdraw-request
// @desc    Create withdrawal request
// @access  Private (Driver)
router.post('/withdraw-request', auth, isDriver, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    if (!driver.accountDetails || !driver.accountDetails.accountNumber) {
      return res.status(400).json({ message: 'Please add account details first' });
    }

    const amount = parseFloat(req.body.amount);
    if (driver.earnings < amount) {
      return res.status(400).json({ message: 'Insufficient earnings' });
    }

    // Check for pending withdrawal requests
    const pendingRequest = await WithdrawRequest.findOne({
      driverId: driver._id,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });
    }

    const withdrawal = new WithdrawRequest({
      driverId: driver._id,
      amount: amount,
      accountNumber: driver.accountDetails.accountNumber,
      accountHolderName: driver.accountDetails.accountHolderName,
      ifscCode: driver.accountDetails.ifscCode
    });

    await withdrawal.save();

    res.json({ message: 'Withdrawal request submitted successfully', withdrawal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/driver/withdraw-requests
// @desc    Get driver withdrawal requests
// @access  Private (Driver)
router.get('/withdraw-requests', auth, isDriver, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const withdrawals = await WithdrawRequest.find({ driverId: driver._id })
      .select('amount accountNumber accountHolderName ifscCode status transactionId utrNumber adminRemark requestedAt processedAt')
      .sort({ requestedAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

