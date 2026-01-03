const express = require('express');
const router = express.Router();
// Use shop-specific controller for all attendance functions
const { 
  getTodaysAttendance, 
  checkIn, 
  checkOut, 
  getMonthlyAttendance,
  correctMissingPunch,
  recordRFIDAttendance,
  recognizeFaceForAttendance,
  enrollFace,
  getFaceRecognitionStatus
} = require('../../controllers/shop/shopAttendanceController');
const { shopAttendanceAuth } = require('../../middleware/auth'); // Updated to use shopAttendanceAuth
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

router.get('/', shopAttendanceAuth, getTodaysAttendance);
router.post('/checkin', shopAttendanceAuth, checkIn);
router.post('/checkout', shopAttendanceAuth, checkOut);
router.get('/monthly/:year/:month', shopAttendanceAuth, getMonthlyAttendance);

// RFID attendance route for shop (shop-specific)
router.post('/rfid-attendance', shopAttendanceAuth, recordRFIDAttendance);

// Manual correction for missing punches
router.post('/correct-missing-punch', shopAttendanceAuth, correctMissingPunch);

// Face recognition routes for shop (shop-specific)
router.post('/enroll-face', shopAttendanceAuth, upload.array('faces', 5), enrollFace);
router.post('/recognize-face', shopAttendanceAuth, recognizeFaceForAttendance);
router.get('/face-status', shopAttendanceAuth, getFaceRecognitionStatus);

module.exports = router;