const mongoose = require('mongoose');

const outgoingPackingMaterialSchema = new mongoose.Schema({
    materialName: {
        type: String,
        required: true
    },
    quantityUsed: {
        type: Number,
        required: true,
        min: 0
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    usedDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('OutgoingPackingMaterial', outgoingPackingMaterialSchema);