const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['user', 'driver', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'user'
    });

    await user.save();

    // If driver, create driver profile (without vehicle details - added after admin approval)
    if (user.role === 'driver') {
      const driver = new Driver({
        userId: user._id,
        isVerified: false
      });
      await driver.save();
    }

    const token = generateToken(user._id);

    // Refresh user to get the generated uniqueId
    const savedUser = await User.findById(user._id).select('name email phone role uniqueId');

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        uniqueId: savedUser.uniqueId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        uniqueId: user.uniqueId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('name email phone role avatar wallet uniqueId createdAt');
    
    // Generate unique ID if it doesn't exist
    if (!user.uniqueId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      let uniqueId = `RM${timestamp.toUpperCase()}${random.toUpperCase()}`;
      
      // Ensure uniqueness
      while (await User.findOne({ uniqueId })) {
        const newTimestamp = Date.now().toString(36);
        const newRandom = Math.random().toString(36).substring(2, 8);
        uniqueId = `RM${newTimestamp.toUpperCase()}${newRandom.toUpperCase()}`;
      }
      
      user.uniqueId = uniqueId;
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile (alias for /me)
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('name email phone role avatar wallet uniqueId createdAt');
    
    // Generate unique ID if it doesn't exist
    if (!user.uniqueId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      let uniqueId = `RM${timestamp.toUpperCase()}${random.toUpperCase()}`;
      
      // Ensure uniqueness
      while (await User.findOne({ uniqueId })) {
        const newTimestamp = Date.now().toString(36);
        const newRandom = Math.random().toString(36).substring(2, 8);
        uniqueId = `RM${newTimestamp.toUpperCase()}${newRandom.toUpperCase()}`;
      }
      
      user.uniqueId = uniqueId;
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/transactions
// @desc    Get user transaction history
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('rideId', 'rideId fare pickupLocation dropoffLocation')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

