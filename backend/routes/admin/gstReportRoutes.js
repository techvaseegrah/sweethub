const express = require('express');
const router = express.Router();
const { getGSTReport } = require('../../controllers/admin/gstReportController');
const { adminAuth } = require('../../middleware/auth');

router.get('/', adminAuth, getGSTReport);

module.exports = router;
