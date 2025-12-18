const mongoose = require('mongoose');

const vendorHistorySchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  quantityReceived: { type: Number, required: true },
  unit: { type: String, required: true },
  vendorName: { type: String, required: true },
  receivedDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('VendorHistory', vendorHistorySchema);