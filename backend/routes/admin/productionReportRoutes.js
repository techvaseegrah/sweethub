const express = require('express');
const router = express.Router();
const { getProductionReport } = require('../../controllers/admin/productionReportController');
const { adminAuth } = require('../../middleware/auth');

router.get('/', adminAuth, getProductionReport);

module.exports = router;
