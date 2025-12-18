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
const { shopAuth } = require('../../middleware/auth');
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

router.get('/', shopAuth, getTodaysAttendance);
router.post('/checkin', shopAuth, checkIn);
router.post('/checkout', shopAuth, checkOut);
router.get('/monthly/:year/:month', shopAuth, getMonthlyAttendance);

// RFID attendance route for shop (shop-specific)
router.post('/rfid-attendance', shopAuth, recordRFIDAttendance);

// Manual correction for missing punches
router.post('/correct-missing-punch', shopAuth, correctMissingPunch);

// Face recognition routes for shop (shop-specific)
router.post('/enroll-face', shopAuth, upload.array('faces', 5), enrollFace);
router.post('/recognize-face', shopAuth, recognizeFaceForAttendance);
router.get('/face-status', shopAuth, getFaceRecognitionStatus);

module.exports = router;