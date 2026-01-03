const express = require('express');
const router = express.Router();
const { 
    createAttendanceOnlyUser, 
    getAllAttendanceOnlyUsers, 
    updateAttendanceOnlyUser, 
    deleteAttendanceOnlyUser 
} = require('../../controllers/admin/attendanceOnlyUserController');
const { adminAuth } = require('../../middleware/auth'); // Only admin can manage attendance-only users

// Apply adminAuth middleware to all routes in this router
router.use(adminAuth);

// Routes for attendance-only user management
router.route('/')
    .post(createAttendanceOnlyUser)
    .get(getAllAttendanceOnlyUsers);

router.route('/:id')
    .put(updateAttendanceOnlyUser)
    .delete(deleteAttendanceOnlyUser);

module.exports = router;