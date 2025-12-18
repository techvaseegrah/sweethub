const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Allows storing different types of values
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index on key for faster lookups
settingSchema.index({ key: 1 });

module.exports = mongoose.model('Setting', settingSchema);