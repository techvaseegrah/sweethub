const express = require('express');
const router = express.Router();
const { createCategory, getCategories, deleteCategory } = require('../../controllers/admin/categoryController');
const { adminAuth } = require('../../middleware/auth');

router.post('/', adminAuth, createCategory);
router.get('/', adminAuth, getCategories);
router.delete('/:id', adminAuth, deleteCategory);

module.exports = router;