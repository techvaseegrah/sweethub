// Script to add expiryDate and usedByDate fields to existing products that don't have them
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweethub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, required: true },
  stockLevel: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 10 },
  prices: [{
    unit: { type: String, required: true },
    netPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true }
  }],
  
  // Expiry and Used By Dates
  expiryDate: { type: Date },
  usedByDate: { type: Date },
  
  // Both admin and shop fields are optional
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false,
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

async function addExpiryDatesToExistingProducts() {
  try {
    console.log('Starting to update existing products with expiryDate and usedByDate fields...');
    
    // Find all products that don't have expiryDate or usedByDate fields
    const products = await Product.find({
      $or: [
        { expiryDate: { $exists: false } },
        { usedByDate: { $exists: false } }
      ]
    });
    
    console.log(`Found ${products.length} products without expiryDate or usedByDate fields`);
    
    if (products.length === 0) {
      console.log('No products need updating. All products already have expiryDate and usedByDate fields.');
      return;
    }
    
    // Update each product to add the missing fields with null values
    for (const product of products) {
      let updated = false;
      
      if (product.expiryDate === undefined) {
        product.expiryDate = null;
        updated = true;
      }
      
      if (product.usedByDate === undefined) {
        product.usedByDate = null;
        updated = true;
      }
      
      if (updated) {
        await product.save();
        console.log(`Updated product: ${product.name} (${product._id})`);
      }
    }
    
    console.log('Successfully updated all products with expiryDate and usedByDate fields');
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addExpiryDatesToExistingProducts();