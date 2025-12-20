const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Allows storing different types of values
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  // Add shop field to support shop-specific settings
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false // Not required for admin settings
  },
  // Add type field to distinguish between admin and shop settings
  type: {
    type: String,
    enum: ['admin', 'shop'],
    default: 'admin'
  }
}, {
  timestamps: true
});

// Create a compound index for efficient lookups
settingSchema.index({ key: 1, shop: 1, type: 1 });

module.exports = mongoose.model('Setting', settingSchema);