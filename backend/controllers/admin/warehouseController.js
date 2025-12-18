const StoreRoomItem = require('../../models/storeRoomItemModel');
const PackingMaterial = require('../../models/packingMaterialModel');
const Manufacturing = require('../../models/manufacturingModel');
const OutgoingMaterial = require('../../models/outgoingMaterialModel');
const OutgoingPackingMaterial = require('../../models/outgoingPackingMaterialModel');
const ReturnProduct = require('../../models/returnProductModel');
const VendorHistory = require('../../models/vendorHistoryModel');

// Raw Materials / Store Room
const addRawMaterial = async (req, res) => {
    try {
        const { name, quantity, unit, price, vendor } = req.body;
        // Find item case-insensitively and trim whitespace
        let item = await StoreRoomItem.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });

        // Save vendor history regardless of whether item exists or not
        if (vendor) {
            const vendorHistory = new VendorHistory({
                materialName: name,
                quantityReceived: Number(quantity),
                unit: unit,
                vendorName: vendor
            });
            await vendorHistory.save();
        }

        if (item) {
            // If item exists, add to quantity and update price
            item.quantity += Number(quantity);
            if (price) item.price = price; // Update price if provided
            if (unit) item.unit = unit; // Update unit if provided
            // Only update vendor if provided (keep existing vendor if not provided)
            if (vendor) item.vendor = vendor; 
        } else {
            // Otherwise, create a new item
            item = new StoreRoomItem({ name, quantity, unit, price, vendor });
        }
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


const addReturnProduct = async (req, res) => {
    try {
        const { productName, quantityReturned, reasonForReturn, source, batchNumber, remarks } = req.body;
        
        // Generate a unique return ID
        const count = await ReturnProduct.countDocuments();
        const returnId = `RTN-${(count + 1).toString().padStart(5, '0')}`;
        
        const newReturn = new ReturnProduct({
            returnId,
            productName,
            batchNumber: batchNumber || '',
            quantityReturned: Number(quantityReturned),
            reasonForReturn,
            source,
            remarks: remarks || '',
            dateOfReturn: new Date(),
            isApproved: false,
            status: 'Pending'
        });
        
        await newReturn.save();
        res.status(201).json({ message: 'Return product registered successfully', return: newReturn });
    } catch (error) {
        console.error('Error adding return product:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getReturnProducts = async (req, res) => {
    try {
        const returns = await ReturnProduct.find().sort({ dateOfReturn: -1 });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const approveReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedBy } = req.body;
        
        const returnProduct = await ReturnProduct.findById(id);
        if (!returnProduct) {
            return res.status(404).json({ message: 'Return not found' });
        }
        
        // Update store room stock
        const storeItem = await StoreRoomItem.findOne({ 
            name: { $regex: new RegExp(`^${returnProduct.productName.trim()}$`, 'i') } 
        });
        
        if (storeItem) {
            storeItem.quantity += returnProduct.quantityReturned;
            await storeItem.save();
        }
        
        // Approve the return
        returnProduct.isApproved = true;
        returnProduct.approvedBy = approvedBy;
        await returnProduct.save();
        
        res.json({ message: 'Return approved and stock updated successfully', return: returnProduct });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getOutgoingPackingMaterials = async (req, res) => {
    try {
        const outgoingMaterials = await OutgoingPackingMaterial.find().sort({ usedDate: -1 });
        res.json(outgoingMaterials);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const createOutgoingPackingMaterial = async (req, res) => {
    try {
        const { materialName, quantityUsed, notes } = req.body;
        
        // Find the packing material
        const packingMaterial = await PackingMaterial.findOne({ 
            name: { $regex: new RegExp(`^${materialName.trim()}$`, 'i') } 
        });
        
        if (!packingMaterial) {
            return res.status(404).json({ message: 'Packing material not found' });
        }
        
        if (packingMaterial.quantity < quantityUsed) {
            return res.status(400).json({ 
                message: `Insufficient stock. Available: ${packingMaterial.quantity}, Required: ${quantityUsed}` 
            });
        }
        
        // Deduct from packing materials
        packingMaterial.quantity -= quantityUsed;
        await packingMaterial.save();
        
        // Create outgoing record
        const outgoingRecord = new OutgoingPackingMaterial({
            materialName,
            quantityUsed,
            pricePerUnit: packingMaterial.price,
            usedDate: new Date(),
            notes
        });
        
        await outgoingRecord.save();
        res.status(201).json({ 
            message: 'Outgoing packing material recorded successfully',
            outgoingRecord 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getStoreRoomItems = async (req, res) => {
    try {
        const items = await StoreRoomItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateStoreRoomItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = await StoreRoomItem.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const deleteStoreRoomItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await StoreRoomItem.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Packing Materials
const addPackingMaterial = async (req, res) => {
    try {
        const { name, quantity, price, stockAlertThreshold, vendor } = req.body;
        
        // Find item case-insensitively and trim whitespace
        let item = await PackingMaterial.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });

        // Save vendor history regardless of whether item exists or not
        if (vendor) {
            const vendorHistory = new VendorHistory({
                materialName: name,
                quantityReceived: Number(quantity),
                unit: 'unit', // Default unit for packing materials
                vendorName: vendor
            });
            await vendorHistory.save();
        }

        if (item) {
            // If item exists, add to quantity and update price if provided
            item.quantity += Number(quantity);
            if (price) item.price = price; // Update price if provided
            // Only update vendor if provided (keep existing vendor if not provided)
            if (vendor) item.vendor = vendor;
            await item.save();
            res.json(item);
        } else {
            // Otherwise, create a new item
            const newMaterial = new PackingMaterial({ name, quantity, price, stockAlertThreshold, vendor });
            await newMaterial.save();
            res.status(201).json(newMaterial);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPackingMaterials = async (req, res) => {
    try {
        const materials = await PackingMaterial.find();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePackingMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMaterial = await PackingMaterial.findByIdAndUpdate(id, req.body, { new: true });
        
        // If vendor is updated, save to vendor history
        if (req.body.vendor) {
            const material = await PackingMaterial.findById(id);
            if (material) {
                const vendorHistory = new VendorHistory({
                    materialName: material.name,
                    quantityReceived: material.quantity,
                    unit: 'unit', // Default unit for packing materials
                    vendorName: req.body.vendor
                });
                await vendorHistory.save();
            }
        }
        
        res.json(updatedMaterial);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePackingMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMaterial = await PackingMaterial.findByIdAndDelete(id);
        if (!deletedMaterial) {
            return res.status(404).json({ message: 'Packing material not found' });
        }
        res.json({ message: 'Packing material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


const getPackingMaterialAlerts = async (req, res) => {
    try {
        const alerts = await PackingMaterial.find({ $expr: { $lte: ['$quantity', '$stockAlertThreshold'] } });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get vendor history for a specific material
const getVendorHistory = async (req, res) => {
    try {
        const { materialName } = req.params;
        const vendorHistory = await VendorHistory.find({ 
            materialName: { $regex: new RegExp(`^${materialName.trim()}$`, 'i') } 
        }).sort({ receivedDate: -1 });
        res.json(vendorHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get all vendor history
const getAllVendorHistory = async (req, res) => {
    try {
        const vendorHistory = await VendorHistory.find().sort({ receivedDate: -1 });
        res.json(vendorHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Manufacturing
const addManufacturingProcess = async (req, res) => {
    try {
        // Now expecting ingredients to be an array of objects
        const { sweetName, ingredients, quantity, price, unit } = req.body; 

        // Validate required fields for manufacturing, including checking if ingredients is a non-empty array
        if (!sweetName || !quantity || !price || !unit || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: 'Please provide sweet name, quantity, price, unit, and at least one ingredient with its details.' });
        }

        // Validate each ingredient object
        for (const ingredient of ingredients) {
            if (!ingredient.name || !ingredient.quantity || !ingredient.unit || !ingredient.price) {
                return res.status(400).json({ message: 'Each ingredient must have a name, quantity, unit, and price.' });
            }
        }


        let process = await Manufacturing.findOne({ sweetName: { $regex: new RegExp(`^${sweetName.trim()}$`, 'i') } });

        if (process) {
            // If it exists, update all fields, including the ingredients array
            process.ingredients = ingredients;
            process.quantity = quantity;
            process.price = price;
            process.unit = unit;
        } else {
            // If it doesn't exist, create a new one with all fields
            process = new Manufacturing({ sweetName, ingredients, quantity, price, unit });
        }
        
        await process.save();
        res.status(201).json(process);
    } catch (error) {
        console.error('Error adding manufacturing process:', error); 
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getAllManufacturingProcesses = async (req, res) => {
    try {
        const processes = await Manufacturing.find({}); // This will now fetch structured ingredients
        res.json(processes);
    } catch (error) {
        console.error('Error fetching manufacturing processes:', error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

const getManufacturingProcessByName = async (req, res) => {
    try {
        const { sweetName } = req.params;
        const process = await Manufacturing.findOne({ sweetName }); 
        if (!process) {
            return res.status(404).json({ message: 'Process not found' });
        }
        res.json(process);
    } catch (error) {
        console.error('Error getting manufacturing process by name:', error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateManufacturingProcess = async (req, res) => {
    try {
        const { id } = req.params;
        // Now expecting ingredients to be an array of objects
        const { sweetName, ingredients, quantity, price, unit } = req.body; 

        // Validate required fields for manufacturing update
        if (!sweetName || !quantity || !price || !unit || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: 'Please provide sweet name, quantity, price, unit, and at least one ingredient with its details for update.' });
        }

        // Validate each ingredient object
        for (const ingredient of ingredients) {
            if (!ingredient.name || !ingredient.quantity || !ingredient.unit || !ingredient.price) {
                return res.status(400).json({ message: 'Each ingredient must have a name, quantity, unit, and price for update.' });
            }
        }

        const updatedProcess = await Manufacturing.findByIdAndUpdate(
            id, 
            { sweetName, ingredients, quantity, price, unit }, // Include all fields in update
            { new: true, runValidators: true }
        );
        if (!updatedProcess) {
            return res.status(404).json({ message: 'Process not found' });
        }
        res.json(updatedProcess);
    } catch (error) {
        console.error('Error updating manufacturing process:', error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteManufacturingProcess = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProcess = await Manufacturing.findByIdAndDelete(id);
        if (!deletedProcess) {
            return res.status(404).json({ message: 'Process not found' });
        }
        res.json({ message: 'Process deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// Outgoing Materials (no changes)
const updateOutgoingMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, stockAlertThreshold } = req.body;
        const updatedItem = await StoreRoomItem.findByIdAndUpdate(
            id,
            { $inc: { quantity: -quantity }, stockAlertThreshold },
            { new: true }
        );
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const bulkUpdateOutgoingMaterials = async (req, res) => {
    try {
        const { items } = req.body; 

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid items array provided.' });
        }

        const updatedItems = [];
        
        for (const item of items) {
            const updatedItem = await StoreRoomItem.findByIdAndUpdate(
                item.id,
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );
            
            if (updatedItem) {
                updatedItems.push(updatedItem);
            }
        }

        res.json({ 
            message: 'Stock updated successfully for all items.',
            updatedItems: updatedItems
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ message: 'Server Error during bulk update.', error: error.message });
    }
};

// Material Stock Alerts (no changes)
const getMaterialStockAlerts = async (req, res) => {
    try {
        const alerts = await StoreRoomItem.find({ $expr: { $lte: ['$quantity', '$stockAlertThreshold'] } });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getOutgoingMaterials = async (req, res) => {
    try {
        const outgoingMaterials = await OutgoingMaterial.find().sort({ usedDate: -1 });
        res.json(outgoingMaterials);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const createOutgoingMaterial = async (req, res) => {
    try {
        const { scheduleId, date, sweetName, ingredients } = req.body;
        
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: 'Invalid ingredients data provided.' });
        }
        
        const outgoingRecords = [];
        const deductedItems = [];
        
        for (const ingredient of ingredients) {
            // Find the store room item by name (case-insensitive)
            const storeItem = await StoreRoomItem.findOne({ 
                name: { $regex: new RegExp(`^${ingredient.materialName.trim()}$`, 'i') } 
            });
            
            if (storeItem) {
                if (storeItem.quantity >= ingredient.quantityUsed) {
                    // Store original quantity for tracking
                    const originalQuantity = storeItem.quantity;
                    
                    // Deduct from store room
                    storeItem.quantity -= ingredient.quantityUsed;
                    await storeItem.save();
                    
                    // Track deducted item details
                    deductedItems.push({
                        name: storeItem.name,
                        originalQuantity: originalQuantity,
                        deductedQuantity: ingredient.quantityUsed,
                        remainingQuantity: storeItem.quantity,
                        unit: storeItem.unit
                    });
                    
                    // Create outgoing material record
                    const outgoingRecord = new OutgoingMaterial({
                        scheduleId,
                        materialName: ingredient.materialName,
                        quantityUsed: ingredient.quantityUsed,
                        unit: ingredient.unit,
                        pricePerUnit: ingredient.pricePerUnit,
                        usedDate: new Date(date),
                        scheduleReference: sweetName
                    });
                    
                    await outgoingRecord.save();
                    outgoingRecords.push(outgoingRecord);
                } else {
                    return res.status(400).json({ 
                        message: `Insufficient stock for ${ingredient.materialName}. Available: ${storeItem.quantity}, Required: ${ingredient.quantityUsed}` 
                    });
                }
            } else {
                return res.status(404).json({ 
                    message: `Material ${ingredient.materialName} not found in store room.` 
                });
            }
        }
        
        res.status(201).json({ 
            message: 'Daily schedule processed successfully! Ingredients deducted from store room.',
            outgoingRecords: outgoingRecords,
            deductedItems: deductedItems
        });
    } catch (error) {
        console.error('Error creating outgoing materials:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
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
    getAllManufacturingProcesses,
    getManufacturingProcessByName,
    updateManufacturingProcess,
    deleteManufacturingProcess,
    updateOutgoingMaterial,
    bulkUpdateOutgoingMaterials,
    getMaterialStockAlerts,
    getOutgoingMaterials,       
    createOutgoingMaterial,
    getOutgoingPackingMaterials,
    createOutgoingPackingMaterial,
    addReturnProduct,        
    getReturnProducts,
    getVendorHistory,
    getAllVendorHistory,
};
