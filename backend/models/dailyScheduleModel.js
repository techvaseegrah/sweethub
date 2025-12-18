const mongoose = require('mongoose');

const dailyScheduleSchema = new mongoose.Schema({
    sweetName: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    // Changed ingredients to an array of objects to match manufacturingModel
    ingredients: [ 
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 0 },
            unit: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
        }
    ],
    price: { // This is the price of the *output sweet product*
        type: Number,
        required: true,
        min: 0,
    },
    unit: { // This is the unit of the *output sweet product*
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('DailySchedule', dailyScheduleSchema);
