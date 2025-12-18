const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices } = require('../../controllers/admin/invoiceController');
const { adminAuth } = require('../../middleware/auth');

// --- Invoice Routes for Admin ---

// @route   POST api/admin/invoices
// @desc    Create a new invoice to send products to a shop
// @access  Private (Admin only)
router.post('/', adminAuth, createInvoice);

// @route   GET api/admin/invoices
// @desc    Get all invoices created by the logged-in admin
// @access  Private (Admin only)
router.get('/', adminAuth, getInvoices);

module.exports = router;