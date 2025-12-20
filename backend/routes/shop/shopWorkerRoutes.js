const express = require('express');
const router = express.Router();
const { 
  addWorker, 
  getWorkers, 
  getWorkerById,
  deleteWorker, 
  updateWorker,
  generateRFIDForWorker,
  getWorkerSalaryReport
} = require('../../controllers/shop/shopWorkerController');
const { shopAuth } = require('../../middleware/auth');

router.post('/', shopAuth, addWorker);
router.get('/', shopAuth, getWorkers);
router.get('/:id', shopAuth, getWorkerById);
router.delete('/:id', shopAuth, deleteWorker);
router.put('/:id', shopAuth, updateWorker);
router.get('/:id/salary-report', shopAuth, getWorkerSalaryReport);

// New route for generating RFID for existing worker
router.post('/:id/generate-rfid', shopAuth, generateRFIDForWorker);

module.exports = router;