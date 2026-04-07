const mongoose = require('mongoose');

const productCopyHistorySchema = new mongoose.Schema({
  sourceShop: {
    type: String, // 'Admin' or Shop Name
    required: true
  },
  destinationShop: {
    type: String, // 'Admin' or Shop Name
    required: true
  },
  copiedCount: {
    type: Number,
    required: true
  },
  updatedCount: {
    type: Number,
    required: true
  },
  totalProducts: {
    type: Number,
    required: true
  },
  includeQty: {
    type: Boolean,
    default: false
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductCopyHistory', productCopyHistorySchema);
