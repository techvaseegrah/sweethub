const express = require('express');
const router = express.Router();
const {
    createRawMaterialOnlyUser,
    getAllRawMaterialOnlyUsers,
    updateRawMaterialOnlyUser,
    deleteRawMaterialOnlyUser
} = require('../../controllers/admin/rawMaterialOnlyUserController');
const { adminAuth } = require('../../middleware/auth'); // Only admin can manage raw materials-only users

// Apply adminAuth middleware to all routes in this router
router.use(adminAuth);

// Routes for raw materials-only user management
router.route('/')
    .post(createRawMaterialOnlyUser)
    .get(getAllRawMaterialOnlyUsers);

router.route('/:id')
    .put(updateRawMaterialOnlyUser)
    .delete(deleteRawMaterialOnlyUser);

module.exports = router;