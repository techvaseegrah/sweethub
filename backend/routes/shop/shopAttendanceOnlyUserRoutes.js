const express = require('express');
const router = express.Router();
const { 
    createAttendanceOnlyUser, 
    getAllAttendanceOnlyUsers, 
    updateAttendanceOnlyUser, 
    deleteAttendanceOnlyUser 
} = require('../../controllers/shop/shopAttendanceOnlyUserController');
const { shopAuth } = require('../../middleware/auth'); // Only shop admin can manage attendance-only users

// Apply shopAuth middleware to all routes in this router
router.use(shopAuth);

// Routes for attendance-only user management
router.route('/')
    .post(createAttendanceOnlyUser)
    .get(getAllAttendanceOnlyUsers);

router.route('/:id')
    .put(updateAttendanceOnlyUser)
    .delete(deleteAttendanceOnlyUser);

module.exports = router;