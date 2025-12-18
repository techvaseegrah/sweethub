const express = require('express');
const router = express.Router();
const { 
  addWorker, 
  getWorkers,
  deleteWorker, 
  updateWorker,
  generateRFIDForWorker,
  getWorkerSalaryReport
} = require('../../controllers/admin/workerController'); // Corrected path
const { adminAuth } = require('../../middleware/auth'); 

router.post('/', adminAuth, addWorker);
router.get('/', adminAuth, getWorkers);
router.delete('/:id', adminAuth, deleteWorker);
router.put('/:id', adminAuth, updateWorker);
router.get('/:id/salary-report', adminAuth, getWorkerSalaryReport);

// New route for generating RFID for existing worker
router.post('/:id/generate-rfid', adminAuth, generateRFIDForWorker);

module.exports = router;