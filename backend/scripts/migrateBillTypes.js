const mongoose = require('mongoose');
require('dotenv').config();

// Import the Bill model
const Bill = require('../models/billModel');

async function migrateBillTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweethub');
    console.log('Connected to MongoDB');

    // Update all existing bills to have billType as ORDINARY (since they were all regular bills before)
    const result = await Bill.updateMany(
      { billType: { $exists: false } }, // Only update bills that don't have billType set
      { $set: { billType: 'ORDINARY' } }
    );

    console.log(`Updated ${result.modifiedCount} bills with billType 'ORDINARY'`);

    // Also update any bills that might have null/undefined billType
    const result2 = await Bill.updateMany(
      { billType: null },
      { $set: { billType: 'ORDINARY' } }
    );

    console.log(`Updated ${result2.modifiedCount} bills with null billType to 'ORDINARY'`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateBillTypes();