const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false }); // Do not create _id for subdocuments if not explicitly needed

const manufacturingSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    ingredients: {
        type: [ingredientSchema], // Changed to an array of ingredient objects
        required: true,
    },
    quantity: { // This quantity is for the *output* sweet product, not raw ingredient total
        type: Number,
        required: true,
        min: 0,
    },
    price: { // This price is for the *output* sweet product
        type: Number,
        required: true,
        min: 0,
    },
    unit: { // This unit is for the *output* sweet product
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
    },
    usedByDate: {
        type: Date,
    },
    createdByWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: false,  // Making it optional as requested
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
}, { autoIndex: false }); // Explicitly disable auto-indexing to prevent the re-creation of ghost indexes

module.exports = mongoose.model('Manufacturing', manufacturingSchema);