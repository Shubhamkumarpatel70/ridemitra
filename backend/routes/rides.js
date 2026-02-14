const express = require('express');
const { body, validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Coupon = require('../models/Coupon');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth, isUser } = require('../middleware/auth');

const router = express.Router();

// Calculate fare based on distance and vehicle type
const calculateFare = (distance, vehicleType) => {
  const baseFare = {
    bike: 20,
    auto: 30,
    car: 50
  };
  const perKm = {
    bike: 5,
    auto: 8,
    car: 12
  };
  return baseFare[vehicleType] + (distance * perKm[vehicleType]);
};

// @route   POST /api/rides
// @desc    Book a new ride
// @access  Private (User)
router.post('/', [auth, isUser], [
  body('pickupLocation.address').notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.latitude').isNumeric().withMessage('Pickup latitude is required'),
  body('pickupLocation.longitude').isNumeric().withMessage('Pickup longitude is required'),
  body('dropoffLocation.address').notEmpty().withMessage('Dropoff address is required'),
  body('dropoffLocation.latitude').isNumeric().withMessage('Dropoff latitude is required'),
  body('dropoffLocation.longitude').isNumeric().withMessage('Dropoff longitude is required'),
  body('vehicleType').isIn(['bike', 'auto', 'car']).withMessage('Invalid vehicle type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has an active ride
    const activeRide = await Ride.findOne({
      userId: req.user.id,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });

    if (activeRide) {
      return res.status(400).json({ 
        message: 'You already have an active ride. Please complete or cancel your current ride before booking a new one.' 
      });
    }

    const { pickupLocation, dropoffLocation, vehicleType, paymentMethod, couponCode, rideType } = req.body;

    // Calculate distance (simplified - in real app, use Google Maps API)
    const lat1 = pickupLocation.latitude;
    const lon1 = pickupLocation.longitude;
    const lat2 = dropoffLocation.latitude;
    const lon2 = dropoffLocation.longitude;
    const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // Rough km calculation

    let originalFare = calculateFare(distance, vehicleType);
    let discountAmount = 0;
    let finalFare = originalFare;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({ message: 'Coupon usage limit exceeded' });
        }

        if (originalFare < coupon.minAmount) {
          return res.status(400).json({ message: `Minimum amount of ₹${coupon.minAmount} required for this coupon` });
        }

        if (coupon.discountType === 'percentage') {
          discountAmount = (originalFare * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        finalFare = Math.max(0, originalFare - discountAmount);
        coupon.usedCount += 1;
        await coupon.save();
      } else {
        return res.status(400).json({ message: 'Invalid or expired coupon code' });
      }
    }

    const ride = new Ride({
      userId: req.user.id,
      pickupLocation,
      dropoffLocation,
      vehicleType,
      distance: parseFloat(distance.toFixed(2)),
      fare: parseFloat(finalFare.toFixed(2)),
      originalFare: parseFloat(originalFare.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      paymentMethod: paymentMethod || 'cash',
      rideType: rideType || 'personal'
    });

    await ride.save();

    // Handle wallet payment at booking time
    if (paymentMethod === 'wallet' || paymentMethod === 'prepaid') {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.wallet < finalFare) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      // Deduct from wallet immediately
      const oldBalance = user.wallet;
      user.wallet -= finalFare;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        rideId: ride._id,
        type: 'debit',
        amount: finalFare,
        description: `Ride booking - ${ride.rideId || ride._id}`,
        balanceAfter: user.wallet
      });
      await transaction.save();
    }

    await ride.populate('userId', 'name email phone');

    res.status(201).json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rides
// @desc    Get user's ride history
// @access  Private (User)
router.get('/', auth, async (req, res) => {
  try {
    let rides;
    if (req.user.role === 'user') {
      rides = await Ride.find({ userId: req.user.id })
        .populate({
          path: 'driverId',
          populate: {
            path: 'userId',
            select: 'name email phone avatar'
          }
        })
        .populate('userId', 'name phone')
        .sort({ bookingTime: -1 });
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user.id });
      if (driver) {
        rides = await Ride.find({ driverId: driver._id })
          .populate('userId', 'name phone')
          .populate({
            path: 'driverId',
            populate: {
              path: 'userId',
              select: 'name email phone'
            }
          })
          .sort({ bookingTime: -1 });
      } else {
        rides = [];
      }
    } else {
      rides = await Ride.find()
        .populate('userId', 'name email phone')
        .populate('driverId')
        .sort({ bookingTime: -1 });
    }

    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rides/:id
// @desc    Get single ride details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'name email phone avatar'
        }
      });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Ensure driver profile image is included
    if (ride.driverId && ride.driverId._id) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(ride.driverId._id);
      if (driver && driver.profileImage) {
        ride.driverId.profileImage = driver.profileImage;
      }
    }

    // Check if user has access to this ride
    if (req.user.role === 'user' && ride.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rides/:id/cancel
// @desc    Cancel a ride
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this ride' });
    }

    ride.status = 'cancelled';
    
    // If driver was assigned, make them available again
    if (ride.driverId) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        driver.isAvailable = true;
        await driver.save();
      }
    }
    
    await ride.save();

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rides/:id/rate
// @desc    Rate a completed ride
// @access  Private (User)
router.put('/:id/rate', [auth, isUser], [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    ride.rating = req.body.rating;
    ride.review = req.body.review || '';
    await ride.save();

    // Update driver rating
    if (ride.driverId) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        const completedRides = await Ride.find({
          driverId: driver._id,
          status: 'completed',
          rating: { $ne: null }
        });
        if (completedRides.length > 0) {
          const totalRating = completedRides.reduce((sum, r) => sum + r.rating, 0);
          driver.rating = parseFloat((totalRating / completedRides.length).toFixed(2));
          await driver.save();
        }
      }
    }

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

