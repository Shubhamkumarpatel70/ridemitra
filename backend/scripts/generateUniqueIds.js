const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Driver = require('../models/Driver');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ridemitra', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `RM${timestamp.toUpperCase()}${random.toUpperCase()}`;
};

const generateUniqueIdsForUsers = async () => {
  try {
    const users = await User.find({ uniqueId: { $exists: false } });
    console.log(`Found ${users.length} users without unique IDs`);
    
    for (const user of users) {
      let uniqueId = generateUniqueId();
      // Ensure uniqueness
      while (await User.findOne({ uniqueId })) {
        uniqueId = generateUniqueId();
      }
      user.uniqueId = uniqueId;
      await user.save();
      console.log(`Generated unique ID ${uniqueId} for user ${user.email}`);
    }
    
    console.log('All users now have unique IDs');
  } catch (error) {
    console.error('Error generating unique IDs for users:', error);
  }
};

const generateUniqueIdsForDrivers = async () => {
  try {
    const drivers = await Driver.find({ uniqueId: { $exists: false } });
    console.log(`Found ${drivers.length} drivers without unique IDs`);
    
    for (const driver of drivers) {
      let uniqueId = generateUniqueId();
      // Ensure uniqueness
      while (await Driver.findOne({ uniqueId })) {
        uniqueId = generateUniqueId();
      }
      driver.uniqueId = uniqueId;
      await driver.save();
      console.log(`Generated unique ID ${uniqueId} for driver ${driver._id}`);
    }
    
    console.log('All drivers now have unique IDs');
  } catch (error) {
    console.error('Error generating unique IDs for drivers:', error);
  }
};

const run = async () => {
  try {
    console.log('Starting unique ID generation for existing records...');
    await generateUniqueIdsForUsers();
    await generateUniqueIdsForDrivers();
    console.log('Unique ID generation completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();

