const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: { 
    type: String,
    required: false, 
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  salary: {
    type: String,
    required: true,
  },
  // RFID field - two letters followed by four digits (e.g., AB0000)
  rfid: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
  },
  workingHours: {
    from: String,
    to: String,
  },
  lunchBreak: {
    from: String,
    to: String,
  },
  // New shift and break details - Correct structure
  shift: {
    type: {
      type: String,
      enum: ['morning', 'night'],
      required: false
    },
    startTime: String,
    endTime: String
  },
  breakTime: {
    startTime: String,
    endTime: String
  },
  // Add batchId field to store the batch association
  batchId: {
    type: String,
    required: false,
  },
  // Stores the mathematical values (face encodings)
  faceEncodings: {
    type: [[Number]], // Array of arrays of numbers
    default: [],
  },
  // Stores the face images as binary data for display purposes
  faceImages: {
    type: [{
      data: Buffer,     // Binary image data
      contentType: String,  // MIME type of the image
      originalName: String  // Original filename
    }],
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  // Track last attendance time for cooldown period
  lastAttendanceTime: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Worker', workerSchema);