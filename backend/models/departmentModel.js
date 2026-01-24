const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
      },
    workers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
    }]
}, {
    timestamps: true
});

// Create compound index for unique department names within each shop
departmentSchema.index({ name: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);