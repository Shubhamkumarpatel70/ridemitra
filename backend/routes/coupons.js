const express = require('express');
const { body, validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/coupons/validate
// @desc    Validate a coupon code
// @access  Public
router.post('/validate', [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('amount').isNumeric().withMessage('Amount is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ message: 'Invalid or expired coupon code' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit exceeded' });
    }

    if (amount < coupon.minAmount) {
      return res.status(400).json({ 
        message: `Minimum amount of ₹${coupon.minAmount} required for this coupon` 
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      valid: true,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat((amount - discountAmount).toFixed(2))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/coupons
// @desc    Get all coupons (Admin)
// @access  Private (Admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/coupons
// @desc    Create a new coupon (Admin)
// @access  Private (Admin)
router.post('/', [auth, isAdmin], [
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

    const coupon = new Coupon(req.body);
    coupon.code = coupon.code.toUpperCase();
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

module.exports = router;

