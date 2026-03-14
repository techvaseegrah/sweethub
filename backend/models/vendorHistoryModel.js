const mongoose = require('mongoose');

const vendorHistorySchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  quantityReceived: { type: Number, required: true },
  unit: { type: String, required: true },
  vendorName: { type: String, required: true },
  pricePerUnit: { type: Number, default: 0 },
  gstPercentage: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  materialType: { type: String, enum: ['Raw Material', 'Packing Material'], default: 'Raw Material' },
  receivedDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('VendorHistory', vendorHistorySchema);