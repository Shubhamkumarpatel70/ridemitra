const express = require('express');
const { body, validationResult } = require('express-validator');
const OTP = require('../models/OTP');
const Ride = require('../models/Ride');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @route   POST /api/otp/generate
// @desc    Generate OTP for a ride
// @access  Private
router.post('/generate', [auth], [
  body('rideId').notEmpty().withMessage('Ride ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if OTP already exists
    let otp = await OTP.findOne({ rideId });
    if (otp && !otp.verified) {
      return res.json({ code: otp.code, rideId: otp.rideId });
    }

    // Generate new OTP
    const code = generateOTP();
    otp = new OTP({
      rideId,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await otp.save();

    res.json({ code, rideId: otp.rideId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/otp/:rideId
// @desc    Get OTP for a ride
// @access  Private
router.get('/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check access
    if (req.user.role === 'user' && ride.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only return OTP if ride is accepted and has driver
    if (ride.status !== 'accepted' || !ride.driverId) {
      return res.status(404).json({ message: 'OTP not available yet' });
    }

    const otp = await OTP.findOne({ rideId: req.params.rideId });
    
    if (!otp) {
      return res.status(404).json({ message: 'OTP not found' });
    }

    res.json({ code: otp.code, verified: otp.verified });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Private
router.post('/verify', [auth], [
  body('rideId').notEmpty().withMessage('Ride ID is required'),
  body('code').notEmpty().withMessage('OTP code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, code } = req.body;

    const otp = await OTP.findOne({ rideId });
    if (!otp) {
      return res.status(404).json({ message: 'OTP not found' });
    }

    if (otp.verified) {
      return res.status(400).json({ message: 'OTP already verified' });
    }

    if (new Date() > otp.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (otp.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otp.verified = true;
    await otp.save();

    const ride = await Ride.findById(rideId);
    if (ride) {
      ride.status = 'in-progress';
      ride.startTime = new Date();
      await ride.save();
    }

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

