const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments, updateDepartment, deleteDepartment } = require('../../controllers/admin/departmentController');
const { adminAuth } = require('../../middleware/auth'); 

router.post('/', adminAuth, createDepartment);
router.get('/', adminAuth, getDepartments);
router.put('/:id', adminAuth, updateDepartment);
router.delete('/:id', adminAuth, deleteDepartment);

module.exports = router;