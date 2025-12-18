const express = require('express');
const router = express.Router();
const { 
    createHoliday,
    getHolidays,
    getHolidayById,
    updateHoliday,
    deleteHoliday,
    isHoliday
} = require('../../controllers/admin/holidayController');
const { adminAuth } = require('../../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Holiday Routes
router.post('/', createHoliday);
router.get('/', getHolidays);
router.get('/:id', getHolidayById);
router.put('/:id', updateHoliday);
router.delete('/:id', deleteHoliday);
router.get('/check/date', isHoliday);

module.exports = router;