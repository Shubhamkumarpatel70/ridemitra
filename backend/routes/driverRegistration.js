const express = require('express');
const { body, validationResult } = require('express-validator');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadDriverDocs } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @route   POST /api/driver/register-details
// @desc    Submit driver registration details with documents
// @access  Private (Driver)
router.post('/register-details', [auth, uploadDriverDocs], [
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('vehicleType').isIn(['bike', 'auto', 'car']).withMessage('Invalid vehicle type'),
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('aadharNumber').notEmpty().withMessage('Aadhar number is required'),
  body('panNumber').notEmpty().withMessage('PAN number is required')
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

    const {
      licenseNumber,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      aadharNumber,
      panNumber
    } = req.body

    // Validate Aadhar number (12 digits)
    const aadharDigits = aadharNumber.replace(/\D/g, '')
    if (aadharDigits.length !== 12) {
      return res.status(400).json({ message: 'Aadhar number must be exactly 12 digits' })
    }

    // Handle file uploads
    const files = req.files;
    const profileImage = files.profileImage ? `/uploads/${files.profileImage[0].filename}` : null;
    const vehicleImage = files.vehicleImage ? `/uploads/${files.vehicleImage[0].filename}` : null;
    const aadharImage = files.aadharImage ? `/uploads/${files.aadharImage[0].filename}` : null;
    const panImage = files.panImage ? `/uploads/${files.panImage[0].filename}` : null;

    // Update driver profile
    driver.licenseNumber = licenseNumber;
    driver.vehicleType = vehicleType;
    driver.vehicleNumber = vehicleNumber;
    driver.vehicleModel = vehicleModel;
    driver.aadharNumber = aadharDigits; // Store without spaces
    driver.panNumber = panNumber;
    driver.profileImage = profileImage;
    driver.vehicleImage = vehicleImage;
    driver.aadharImage = aadharImage;
    driver.panImage = panImage;
    driver.verificationStatus = 'pending';
    driver.isVerified = false;

    await driver.save();
    await driver.populate('userId', 'name email phone');

    res.json({
      message: 'Driver details submitted successfully. Waiting for admin approval.',
      driver
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vehicle number already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

