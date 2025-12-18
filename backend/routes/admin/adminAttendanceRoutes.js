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
const { adminAuth } = require('../../middleware/auth');
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
router.post('/enroll-face', adminAuth, upload.array('faces', 5), enrollFace);
router.post('/recognize-face', adminAuth, recognizeFaceForAttendance);
router.get('/face-status', adminAuth, getFaceRecognitionStatus);

// Attendance routes
router.get('/', adminAuth, getTodaysAttendance);
router.post('/checkin', adminAuth, checkIn);
router.post('/checkout', adminAuth, checkOut);
router.get('/monthly/:year/:month', adminAuth, getMonthlyAttendance);

// RFID attendance route
router.post('/rfid-attendance', adminAuth, recordRFIDAttendance);

// Manual correction for missing punches
router.post('/correct-missing-punch', adminAuth, correctMissingPunch);

module.exports = router;