const mongoose = require('mongoose');

const afterPackingSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: false
    },
    // Legacy support
    sweetName: {
        type: String,
        required: false
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    totalQuantity: {
        type: Number,
        required: false
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
        enum: ['Pending', 'Completed', 'Partial'],
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

module.exports = mongoose.model('AfterPacking', afterPackingSchema);