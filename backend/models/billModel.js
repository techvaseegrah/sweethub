const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: {
    type: String,
    unique: true,
    sparse: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false, // Change this from true to false
  },
  customerMobileNumber: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: false,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    unit: String,
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  baseAmount: {
    type: Number,
    required: false,
  },
  gstPercentage: {
    type: Number,
    required: false,
  },
  gstAmount: {
    type: Number,
    required: false,
  },
  // Discount fields
  discountType: {
    type: String,
    enum: ['percentage', 'cash', 'none'],
    default: 'none'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  billDate: {
    type: Date,
    default: Date.now,
  },
  // New fields for FROM and TO information (admin side only)
  fromInfo: {
    name: String,
    address: String,
    gstin: String,
    state: String,
    stateCode: String,
    phone: String,
    email: String
  },
  toInfo: {
    name: String,
    address: String,
    gstin: String,
    state: String,
    stateCode: String,
    phone: String
  },
  // Shop details for PDF generation
  shopName: String,
  shopAddress: String,
  shopGstNumber: String,
  shopFssaiNumber: String,
  shopPhone: String,
  
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletionReason: String,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

// Add index for soft deletes
billSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Bill', billSchema);