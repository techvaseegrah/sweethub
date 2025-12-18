const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  netPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, required: true },
  stockLevel: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 10 },
  prices: [priceSchema],
  
  // --- MODIFIED: Both admin and shop fields are now optional ---
  // A product will be owned by either an admin OR a shop.
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Set to false
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false, // Set to false
  },
}, {
  timestamps: true,
});

// --- MODIFIED: Ensure SKU is unique per owner (either admin or shop) ---
// This prevents duplicate SKUs within the same inventory.
productSchema.index({ sku: 1, admin: 1 }, { unique: true, partialFilterExpression: { admin: { $exists: true } } });
productSchema.index({ sku: 1, shop: 1 }, { unique: true, partialFilterExpression: { shop: { $exists: true } } });


module.exports = mongoose.model('Product', productSchema);