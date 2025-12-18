const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
  },
  // Working duration in minutes
  workingDuration: {
    type: Number,
    default: 0,
  },
  // Permission time for late arrival in minutes
  lateArrival: {
    type: Number,
    default: 0,
  },
  // Permission time for early leaving in minutes
  earlyLeaving: {
    type: Number,
    default: 0,
  },
  // Total permission time (late arrival + early leaving)
  totalPermissionTime: {
    type: Number,
    default: 0,
  },
  // Overtime in minutes
  overtime: {
    type: Number,
    default: 0,
  },
  // Flag to indicate if this is a manual correction for a missing punch
  isManualCorrection: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
attendanceSchema.index({ worker: 1, checkIn: -1 });
attendanceSchema.index({ worker: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);