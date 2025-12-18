// backend/models/returnProductModel.js

const mongoose = require('mongoose');

const returnProductSchema = new mongoose.Schema({
    returnId: {
        type: String,
        required: true,
        unique: true
    },
    dateOfReturn: {
        type: Date,
        default: Date.now,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    batchNumber: {
        type: String
    },
    quantityReturned: {
        type: Number,
        required: true
    },
    reasonForReturn: {
        type: String,
        enum: ['Damaged', 'Expired', 'Overproduction', 'Customer Return'],
        required: true
    },
    source: {
        type: String,
        enum: ['Shop', 'Customer', 'Factory'],
        required: true
    },
    remarks: {
        type: String
    },
    approvedBy: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    shopId: {
        type: String
    } // Add shopId to distinguish shop returns
});

const ReturnProduct = mongoose.model('ReturnProduct', returnProductSchema);

module.exports = ReturnProduct;