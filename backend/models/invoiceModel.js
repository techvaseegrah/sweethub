const mongoose = require('mongoose');

// --- MODIFIED: Added shopConfirmed field to track shop-side confirmation ---
const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be at least 0.001.'],
  },
  // --- NEW: Field for shop to enter the actual quantity received ---
  receivedQuantity: {
    type: Number,
    default: null,
  },
  unitPrice: { // Price per unit at the time of invoice creation
    type: Number,
    required: true,
  },
  totalPrice: { // quantity * unitPrice
    type: Number,
    required: true,
  },
  // Storing original product details for historical reference
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  unit: { type: String, required: true }, // Unit type (piece, kg, gram, etc.)
  // --- NEW: Field for shop to confirm receipt of each item ---
  shopConfirmed: {
    type: Boolean,
    default: false, // Defaults to not confirmed
  },
}, { _id: false });

// Defines the main structure for the invoice
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  // --- MODIFIED: Updated status enum for new workflow ---
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Confirmed'], // 'Pending' for admin submission, 'Partial' for partially confirmed, 'Confirmed' for fully confirmed
    default: 'Pending',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  // --- RENAMED: Changed to confirmedDate for clarity ---
  confirmedDate: {
    type: Date,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Invoice', invoiceSchema);