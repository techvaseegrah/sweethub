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
    sweetName: {
        type: String,
        required: true,
        unique: true, // Assuming sweet names are unique for manufacturing processes
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
        enum: ['kg', 'grams', 'liters', 'pieces', 'dozen'], // Example units
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expireDate: {
        type: Date,
    },
    usedByDate: {
        type: Date,
    },
});

module.exports = mongoose.model('Manufacturing', manufacturingSchema);
