const express = require('express');
const { adminAuth } = require('../../middleware/auth');

// Corrected path to the controller file to include the 'admin' subfolder
const { createDailySchedule, getDailySchedules } = require('../../controllers/admin/dailyScheduleController'); 

const router = express.Router();

// Protect all admin daily schedule routes using adminAuth middleware
router.use(adminAuth);

router.route('/')
    .post(createDailySchedule)
    .get(getDailySchedules);

module.exports = router;