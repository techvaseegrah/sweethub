const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
  },
  shopPhoneNumber: { // Add this new field
    type: String,
  },
  shopCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Shop', shopSchema);