const mongoose = require('mongoose');
const Shop = require('../models/shopModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Test shop code generation
    const testLocations = ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh'];
    
    for (const location of testLocations) {
      // Simulate the shop code generation logic
      const locationCode = location ? location.substring(0, 2).toUpperCase() : 'XX';
      
      // Find the highest existing sequence number for this location
      const regex = new RegExp(`^${locationCode}\\d{2}$`);
      const existingShops = await Shop.find({ shopCode: regex });
      
      let maxSequence = 0;
      existingShops.forEach(shop => {
        const sequence = parseInt(shop.shopCode.substring(2));
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      });
      
      // Increment sequence and pad with zeros
      const nextSequence = (maxSequence + 1).toString().padStart(2, '0');
      const shopCode = `${locationCode}${nextSequence}`;
      
      console.log(`Location: ${location} -> Shop Code: ${shopCode}`);
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});