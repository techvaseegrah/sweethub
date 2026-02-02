const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true,
});

// Compound index to ensure unique category names within each shop
categorySchema.index({ name: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
