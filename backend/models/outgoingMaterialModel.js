const mongoose = require('mongoose');

const outgoingMaterialSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true
    },
    materialName: {
        type: String,
        required: true
    },
    quantityUsed: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
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
    scheduleReference: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('OutgoingMaterial', outgoingMaterialSchema);