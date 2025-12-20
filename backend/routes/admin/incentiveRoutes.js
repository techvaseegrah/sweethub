const express = require('express');
const router = express.Router();
const { 
    addIncentive,
    getIncentivesByWorker,
    getIncentivesByWorkerAndMonth,
    deleteIncentive
} = require('../../controllers/admin/incentiveController');
const { adminAuth } = require('../../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Incentive Routes
router.post('/', addIncentive);
router.get('/worker/:workerId', getIncentivesByWorker);
router.get('/worker/:workerId/month', getIncentivesByWorkerAndMonth);
router.delete('/:id', deleteIncentive);

module.exports = router;