const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments, updateDepartment, deleteDepartment } = require('../../controllers/admin/departmentController');
const { shopAuth } = require('../../middleware/auth');

router.post('/', shopAuth, createDepartment);
router.get('/', shopAuth, getDepartments);
router.put('/:id', shopAuth, updateDepartment);
router.delete('/:id', shopAuth, deleteDepartment);

module.exports = router;