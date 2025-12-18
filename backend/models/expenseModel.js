const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
    // Removed enum to allow custom categories
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['Cash', 'UPI', 'Bank Transfer']
  },
  vendor: {
    type: String,
    default: ''
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  // For admin expenses
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For shop expenses
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure either admin or shop is provided, but not both
expenseSchema.pre('save', function(next) {
  if (this.admin && this.shop) {
    return next(new Error('Expense cannot belong to both admin and shop'));
  }
  if (!this.admin && !this.shop) {
    return next(new Error('Expense must belong to either admin or shop'));
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);