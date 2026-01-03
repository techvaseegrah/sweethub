const express = require('express');
const router = express.Router();
const { 
  enrollFace, 
  recognizeFaceForAttendance, 
  recordRFIDAttendance, 
  getFaceRecognitionStatus,
  getTodaysAttendance,
  checkIn,
  checkOut,
  getMonthlyAttendance,
  correctMissingPunch
} = require('../../controllers/admin/attendanceController');
const { adminAttendanceAuth } = require('../../middleware/auth'); // Updated to use adminAttendanceAuth
const multer = require('multer');

// Configure multer for face enrollment
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Face recognition routes
router.post('/enroll-face', adminAttendanceAuth, upload.array('faces', 5), enrollFace);
router.post('/recognize-face', adminAttendanceAuth, recognizeFaceForAttendance);
router.get('/face-status', adminAttendanceAuth, getFaceRecognitionStatus);

// Attendance routes
router.get('/', adminAttendanceAuth, getTodaysAttendance);
router.post('/checkin', adminAttendanceAuth, checkIn);
router.post('/checkout', adminAttendanceAuth, checkOut);
router.get('/monthly/:year/:month', adminAttendanceAuth, getMonthlyAttendance);

// RFID attendance route
router.post('/rfid-attendance', adminAttendanceAuth, recordRFIDAttendance);

// Manual correction for missing punches
router.post('/correct-missing-punch', adminAttendanceAuth, correctMissingPunch);

module.exports = router;