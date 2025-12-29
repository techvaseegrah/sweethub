const express = require('express');
const router = express.Router();
const {
    addRawMaterial,
    getStoreRoomItems,
    updateStoreRoomItem,
    deleteStoreRoomItem,
    addPackingMaterial,
    getPackingMaterials,
    updatePackingMaterial,
    deletePackingMaterial, 
    getPackingMaterialAlerts,
    addManufacturingProcess,
    getManufacturingProcessByName,
    updateOutgoingMaterial,
    getMaterialStockAlerts,
    getAllManufacturingProcesses, 
    updateManufacturingProcess,
    bulkUpdateOutgoingMaterials,    
    deleteManufacturingProcess,
    getOutgoingMaterials,       
    createOutgoingMaterial, 
    getOutgoingPackingMaterials,
    createOutgoingPackingMaterial,
    addReturnProduct,
    getReturnProducts,
    getVendorHistory,
    getAllVendorHistory,
    // getPackingMaterialVendorHistory, // Remove this line
    getDailySchedules,        // Add the new function
    createDailySchedule,      // Add the new function
    getDailyScheduleById,     // Add this function to exports
    updateDailyScheduleStatus // Add the new function
} = require('../../controllers/admin/warehouseController');
const { adminAuth } = require('../../middleware/auth');

router.use(adminAuth);

router.get('/packing-materials/outgoing', getOutgoingPackingMaterials);
router.post('/packing-materials/outgoing', createOutgoingPackingMaterial);

// Store Room
router.get('/store-room', getStoreRoomItems);
router.post('/raw-materials', addRawMaterial);
router.put('/store-room/:id', updateStoreRoomItem);
router.delete('/store-room/:id', deleteStoreRoomItem);
router.get('/vendor-history/:materialName', getVendorHistory);
router.get('/vendor-history', getAllVendorHistory);

// Raw Materials
router.post('/raw-materials', addRawMaterial);
router.get('/outgoing-materials', getOutgoingMaterials);
router.post('/outgoing-materials', createOutgoingMaterial);

// Packing Materials
router.post('/packing-materials', addPackingMaterial);
router.get('/packing-materials', getPackingMaterials);
router.put('/packing-materials/:id', updatePackingMaterial);
router.delete('/packing-materials/:id', deletePackingMaterial);
router.get('/packing-materials/alerts', getPackingMaterialAlerts);
router.get('/packing-materials/vendor-history/:materialName', getVendorHistory); // Use getVendorHistory instead

// Manufacturing
router.post('/manufacturing', addManufacturingProcess);
router.get('/manufacturing', getAllManufacturingProcesses);
router.get('/manufacturing/:sweetName', getManufacturingProcessByName);
router.put('/manufacturing/:id', updateManufacturingProcess);
router.delete('/manufacturing/:id', deleteManufacturingProcess);
router.put('/outgoing-materials/bulk-update', bulkUpdateOutgoingMaterials);

router.put('/outgoing-materials/:id', updateOutgoingMaterial);

// Daily Schedules
router.get('/daily-schedules', getDailySchedules);
router.post('/daily-schedules', createDailySchedule);
router.get('/daily-schedules/:id', getDailyScheduleById);
router.put('/daily-schedules/:id/status', updateDailyScheduleStatus);

// Material Stock Alerts
router.get('/material-stock-alerts', getMaterialStockAlerts);

router.post('/returns', addReturnProduct);
router.get('/returns', getReturnProducts);

module.exports = router;