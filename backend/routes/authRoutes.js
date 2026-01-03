const express = require('express');
const router = express.Router();
const { registerUser, loginUser, attendanceOnlyLogin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/attendance-only-login', attendanceOnlyLogin);

module.exports = router;