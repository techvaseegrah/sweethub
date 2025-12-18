const express = require('express');
const router = express.Router();
const { calculateSalary, updateSalary, requestLeave, approveLeave, rejectLeave } = require('../../controllers/admin/salaryController');
const { adminAuth } = require('../../middleware/auth');

router.get('/calculate/:workerId', adminAuth, calculateSalary);
router.put('/update/:workerId', adminAuth, updateSalary);
router.post('/leave/request', requestLeave); // This route might be accessible to workers
router.put('/leave/approve/:leaveId', adminAuth, approveLeave);
router.put('/leave/reject/:leaveId', adminAuth, rejectLeave);

module.exports = router;