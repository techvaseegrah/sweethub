const mongoose = require('mongoose');

const beforePackingSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: false
    },
    batchId: {
        type: String,
        required: false
    },
    // Legacy support
    sweetName: {
        type: String,
        required: false
    },
    quantity: { // This will represent the REMAINING quantity
        type: Number,
        required: true,
        min: 0
    },
    totalQuantity: { // This will represent the INITIAL quantity
        type: Number,
        required: false,
        min: 0
    },
    completedQuantity: { // This will represent the TOTAL completed quantity so far
        type: Number,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Partial', 'Completed'],
        default: 'Pending'
    },
    completedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('BeforePacking', beforePackingSchema);