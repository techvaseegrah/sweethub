const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantityUsed: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    }
}, { _id: false });

const mixedSweetProductionSchema = new mongoose.Schema({
    mixedProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    quantityProduced: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        default: 'kg'
    },
    sellingPrice: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: String
    },
    usedByDate: {
        type: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    components: [componentSchema],
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MixedSweetProduction', mixedSweetProductionSchema);
