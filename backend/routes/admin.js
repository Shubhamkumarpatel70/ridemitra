const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const Transaction = require('../models/Transaction');
const WithdrawRequest = require('../models/WithdrawRequest');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'vkyc');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for VKYC captures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const documentType = req.body.documentType || 'Capture';
    const sanitizedType = documentType.replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `vkyc-${sanitizedType}-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname || '.png')}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require admin authentication
router.use(auth, isAdmin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .select('name email phone role wallet uniqueId createdAt')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers
// @access  Private (Admin)
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('userId', 'name email phone uniqueId')
      .select('userId licenseNumber vehicleType vehicleNumber vehicleModel vehicleImage profileImage aadharNumber aadharImage panNumber panImage verificationStatus rejectionReason isAvailable isVerified currentLocation rating totalRides earnings declinedRides vkycStatus vkycScheduledAt vkycCompletedAt vkycCaptureImages accountDetails uniqueId createdAt')
      .sort({ createdAt: -1 });

    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/approve
// @desc    Approve a driver
// @access  Private (Admin)
router.put('/drivers/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.verificationStatus = 'approved';
    driver.isVerified = true;
    driver.rejectionReason = null;
    await driver.save();
    await driver.populate('userId', 'name email phone');

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/reject
// @desc    Reject a driver
// @access  Private (Admin)
router.put('/drivers/:id/reject', [auth, isAdmin], [
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.verificationStatus = 'rejected';
    driver.isVerified = false;
    driver.rejectionReason = req.body.rejectionReason;
    await driver.save();
    await driver.populate('userId', 'name email phone');

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete associated driver profile if exists
    if (user.role === 'driver') {
      await Driver.findOneAndDelete({ userId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/update-details
// @desc    Update driver Aadhar and PAN numbers
// @access  Private (Admin)
router.put('/drivers/:id/update-details', [
  body('aadharNumber').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be 12 digits'),
  body('panNumber').optional().isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const { aadharNumber, panNumber } = req.body;

    if (aadharNumber !== undefined) {
      const aadharDigits = aadharNumber.replace(/\D/g, '');
      if (aadharDigits.length !== 12) {
        return res.status(400).json({ message: 'Aadhar number must be exactly 12 digits' });
      }
      driver.aadharNumber = aadharDigits;
    }

    if (panNumber !== undefined) {
      driver.panNumber = panNumber.toUpperCase();
    }

    await driver.save();
    await driver.populate('userId', 'name email phone');

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/account-details
// @desc    Update driver account details (Admin only)
// @access  Private (Admin)
router.put('/drivers/:id/account-details', auth, isAdmin, [
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('ifscCode').notEmpty().withMessage('IFSC code is required'),
  body('accountHolderName').notEmpty().withMessage('Account holder name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.accountDetails = {
      accountNumber: req.body.accountNumber,
      accountHolderName: req.body.accountHolderName,
      ifscCode: req.body.ifscCode.toUpperCase(),
      isVerified: driver.accountDetails?.isVerified || false,
      isEdited: true
    };
    await driver.save();

    res.json({ message: 'Account details updated successfully', accountDetails: driver.accountDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/drivers/:id
// @desc    Delete a driver (clears all driver data so they need to re-register)
// @access  Private (Admin)
router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Clear all driver data instead of deleting, so they need to re-register
    driver.licenseNumber = null;
    driver.vehicleType = null;
    driver.vehicleNumber = null;
    driver.vehicleModel = null;
    driver.vehicleImage = null;
    driver.profileImage = null;
    driver.aadharNumber = null;
    driver.aadharImage = null;
    driver.panNumber = null;
    driver.panImage = null;
    driver.verificationStatus = 'pending';
    driver.isVerified = false;
    driver.isAvailable = false;
    driver.rejectionReason = null;
    driver.earnings = 0;
    driver.totalRides = 0;
    driver.rating = 0;

    await driver.save();

    res.json({ message: 'Driver deleted successfully. They will need to register again.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/rides
// @desc    Get all rides
// @access  Private (Admin)
router.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('userId', 'name email phone')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ bookingTime: -1 });

    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDrivers = await Driver.countDocuments();
    const verifiedDrivers = await Driver.countDocuments({ isVerified: true });
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const pendingRides = await Ride.countDocuments({ status: 'pending' });

    const rides = await Ride.find({ status: 'completed' });
    const totalRevenue = rides.reduce((sum, ride) => sum + ride.fare, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRides = await Ride.countDocuments({
      bookingTime: { $gte: today }
    });

    res.json({
      totalUsers,
      totalDrivers,
      verifiedDrivers,
      totalRides,
      completedRides,
      pendingRides,
      totalRevenue,
      todayRides
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/rides/search/:rideId
// @desc    Search ride by ride ID
// @access  Private (Admin)
router.get('/rides/search/:rideId', async (req, res) => {
  try {
    const ride = await Ride.findOne({ rideId: req.params.rideId })
      .populate('userId', 'name email phone')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/coupons
// @desc    Get all coupons
// @access  Private (Admin)
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/coupons
// @desc    Create a new coupon
// @access  Private (Admin)
router.post('/coupons', [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isNumeric().withMessage('Discount value is required'),
  body('validUntil').isISO8601().withMessage('Valid until date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const couponData = {
      ...req.body,
      code: req.body.code.toUpperCase()
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/coupons/:id
// @desc    Delete a coupon
// @access  Private (Admin)
router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/drivers/:id/vkyc/start
// @desc    Start VKYC call with driver
// @access  Private (Admin)
router.post('/drivers/:id/vkyc/start', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (driver.vkycStatus !== 'scheduled' && driver.vkycStatus !== 'in-progress') {
      return res.status(400).json({ message: 'Driver has not scheduled a VKYC call' });
    }

    driver.vkycStatus = 'in-progress';
    await driver.save();

    const callId = `vkyc-${driver._id}-${Date.now()}`;
    res.json({ message: 'VKYC call started', callId, driverId: driver._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/drivers/:id/vkyc/capture
// @desc    Upload captured VKYC image
// @access  Private (Admin)
router.post('/drivers/:id/vkyc/capture', upload.single('image'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Use relative path for storage in database
    const imagePath = '/uploads/vkyc/' + req.file.filename;
    
    // Initialize array if it doesn't exist
    if (!driver.vkycCaptureImages) {
      driver.vkycCaptureImages = [];
    }
    
    // Add image path to array
    driver.vkycCaptureImages.push(imagePath);
    await driver.save();

    res.json({ message: 'Image captured and saved', imagePath });
  } catch (error) {
    console.error('Error capturing VKYC image:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/vkyc/complete
// @desc    Complete VKYC call
// @access  Private (Admin)
router.put('/drivers/:id/vkyc/complete', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.vkycStatus = 'completed';
    driver.vkycCompletedAt = new Date();
    await driver.save();

    res.json({ message: 'VKYC completed successfully', driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/drivers/:id/vkyc/status
// @desc    Set VKYC completed (checkbox) - checked = completed, unchecked = pending
// @access  Private (Admin)
router.put('/drivers/:id/vkyc/status', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const { completed } = req.body;
    if (completed === true) {
      driver.vkycStatus = 'completed';
      driver.vkycCompletedAt = new Date();
    } else {
      driver.vkycStatus = 'not-scheduled';
      driver.vkycCompletedAt = null;
    }
    await driver.save();

    res.json({
      message: completed ? 'VKYC marked as completed' : 'VKYC marked as pending',
      driver
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/wallet
// @desc    Add amount to user wallet
// @access  Private (Admin)
router.post('/users/:id/wallet', async (req, res) => {
  try {
    const { amount, remark } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const amountToAdd = parseFloat(amount);
    const oldBalance = user.wallet || 0;
    user.wallet = oldBalance + amountToAdd;
    await user.save();

    // Create transaction record
    const description = remark 
      ? `Ride Mitra added to wallet - ${remark}`
      : 'Ride Mitra added to wallet';
    
    const transaction = new Transaction({
      userId: user._id,
      type: 'credit',
      amount: amountToAdd,
      description: description,
      balanceAfter: user.wallet
    });
    await transaction.save();

    res.json({ message: 'Amount added to wallet successfully', wallet: user.wallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/drivers/:id/wallet
// @desc    Add amount to driver earnings/wallet
// @access  Private (Admin)
router.post('/drivers/:id/wallet', async (req, res) => {
  try {
    const { amount, remark } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const amountToAdd = parseFloat(amount);
    const oldEarnings = driver.earnings || 0;
    driver.earnings = oldEarnings + amountToAdd;
    await driver.save();

    // Create transaction record for driver
    const description = remark 
      ? `Ride Mitra added to wallet - ${remark}`
      : 'Ride Mitra added to wallet';
    
    const transaction = new Transaction({
      userId: driver.userId,
      driverId: driver._id,
      type: 'credit',
      amount: amountToAdd,
      description: description,
      balanceAfter: driver.earnings
    });
    await transaction.save();

    res.json({ message: 'Amount added to driver earnings successfully', earnings: driver.earnings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/withdrawals
// @desc    Get all withdrawal requests
// @access  Private (Admin)
router.get('/withdrawals', auth, isAdmin, async (req, res) => {
  try {
    const withdrawals = await WithdrawRequest.find()
      .populate({
        path: 'driverId',
        select: 'uniqueId',
        populate: {
          path: 'userId',
          select: 'name email phone uniqueId'
        }
      })
      .sort({ requestedAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions (users, drivers, admin)
// @access  Private (Admin)
router.get('/transactions', auth, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email phone uniqueId')
      .populate({
        path: 'driverId',
        select: 'uniqueId',
        populate: {
          path: 'userId',
          select: 'name email phone uniqueId'
        }
      })
      .populate('rideId', 'rideId fare pickupLocation dropoffLocation paymentMethod')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/withdrawals/:id/approve
// @desc    Approve withdrawal request
// @access  Private (Admin)
router.put('/withdrawals/:id/approve', auth, isAdmin, [
  body('utrNumber').notEmpty().withMessage('UTR number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { utrNumber, adminRemark } = req.body;
    const withdrawal = await WithdrawRequest.findById(req.params.id)
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'name email phone uniqueId'
        }
      });
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal request already processed' });
    }

    const driver = withdrawal.driverId;
    if (driver.earnings < withdrawal.amount) {
      return res.status(400).json({ message: 'Insufficient earnings' });
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Deduct from driver earnings
    const oldEarnings = driver.earnings;
    driver.earnings -= withdrawal.amount;
    await driver.save();

    // Update withdrawal status
    withdrawal.status = 'completed';
    withdrawal.transactionId = transactionId;
    withdrawal.utrNumber = utrNumber;
    withdrawal.processedAt = new Date();
    if (adminRemark) {
      withdrawal.adminRemark = adminRemark;
    }
    await withdrawal.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: driver.userId._id,
      driverId: driver._id,
      type: 'debit',
      amount: withdrawal.amount,
      description: `Withdrawal to account - ${transactionId}`,
      balanceAfter: driver.earnings
    });
    await transaction.save();

    res.json({ message: 'Withdrawal approved successfully', withdrawal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/withdrawals/:id/reject
// @desc    Reject withdrawal request
// @access  Private (Admin)
router.put('/withdrawals/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const { adminRemark } = req.body;
    const withdrawal = await WithdrawRequest.findById(req.params.id);
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal request already processed' });
    }

    withdrawal.status = 'rejected';
    withdrawal.processedAt = new Date();
    if (adminRemark) {
      withdrawal.adminRemark = adminRemark;
    }
    await withdrawal.save();

    res.json({ message: 'Withdrawal rejected', withdrawal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

