const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: false,  // Generated in pre-save hook or controller
    unique: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Invoiced'],
    default: 'Pending',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
}, {
  timestamps: true,
});

// Generate order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {  // Generate if not already set
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}`;
    
    const lastOrder = await this.constructor.findOne({ orderId: new RegExp(`^${prefix}`) })
                                     .sort({ createdAt: -1 });
    
    let nextSequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderId.split('-')[2]);
      nextSequence = lastSequence + 1;
    }
    
    const sequenceString = nextSequence.toString().padStart(3, '0');
    this.orderId = `${prefix}-${sequenceString}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);