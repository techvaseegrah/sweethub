const mongoose = require('mongoose');

const productHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ['Added', 'Updated', 'Stock In', 'Stock Out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    required: false
  },
  netPrice: {
    type: Number,
    required: false
  },
  sellingPrice: {
    type: Number,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying by productId and timestamp
productHistorySchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('ProductHistory', productHistorySchema);