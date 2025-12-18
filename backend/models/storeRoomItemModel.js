const mongoose = require('mongoose');

const storeRoomItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  vendor: { type: String },
  stockAlertThreshold: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('StoreRoomItem', storeRoomItemSchema);