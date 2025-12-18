const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
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

module.exports = mongoose.model('Department', departmentSchema);