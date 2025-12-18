const mongoose = require('mongoose');

const packingMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  stockAlertThreshold: { type: Number, default: 0 },
  vendor: { type: String } // Add vendor field
}, { timestamps: true });

module.exports = mongoose.model('PackingMaterial', packingMaterialSchema);