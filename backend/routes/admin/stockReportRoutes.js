const express = require('express');
const router = express.Router();
const { getStockReport } = require('../../controllers/admin/stockReportController');
const { adminAuth } = require('../../middleware/auth');

router.get('/', adminAuth, getStockReport);

module.exports = router;
