const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Incentive', incentiveSchema);