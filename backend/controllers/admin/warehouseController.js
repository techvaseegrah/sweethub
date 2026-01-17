const mongoose = require('mongoose');
const StoreRoomItem = require('../../models/storeRoomItemModel');
const PackingMaterial = require('../../models/packingMaterialModel');
const Manufacturing = require('../../models/manufacturingModel');
const OutgoingMaterial = require('../../models/outgoingMaterialModel');
const OutgoingPackingMaterial = require('../../models/outgoingPackingMaterialModel');
const ReturnProduct = require('../../models/returnProductModel');
const VendorHistory = require('../../models/vendorHistoryModel');
const DailySchedule = require('../../models/dailyScheduleModel');
const Product = require('../../models/productModel');

// Raw Materials / Store Room
const addRawMaterial = async (req, res) => {
    try {
        const { name, quantity, unit, price, vendor, expiryDate, usedByDate } = req.body;
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
            // Update expiry and used by dates if provided
            if (expiryDate) item.expiryDate = new Date(expiryDate);
            if (usedByDate) item.usedByDate = new Date(usedByDate);
        } else {
            // Otherwise, create a new item
            item = new StoreRoomItem({ name, quantity, unit, price, vendor, expiryDate: expiryDate ? new Date(expiryDate) : undefined, usedByDate: usedByDate ? new Date(usedByDate) : undefined });
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
        // Handle date conversion if expiryDate or usedByDate are sent as strings
        const updateData = { ...req.body };
        if (updateData.expiryDate) {
            updateData.expiryDate = new Date(updateData.expiryDate);
        }
        if (updateData.usedByDate) {
            updateData.usedByDate = new Date(updateData.usedByDate);
        }
        
        const updatedItem = await StoreRoomItem.findByIdAndUpdate(id, updateData, { new: true });
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

        // Check if the product exists in the products collection
        let product = await Product.findOne({ 
            name: { $regex: new RegExp(`^${sweetName.trim()}$`, 'i') } 
        });

        // If product doesn't exist, create it with minimal information
        if (!product) {
            product = new Product({
                name: sweetName,
                category: null, // No category initially
                sku: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique SKU
                stockLevel: 0, // Manufacturing doesn't add to stock initially
                prices: [{
                    unit: unit,
                    netPrice: price,
                    sellingPrice: price * 1.2 // Assuming 20% profit margin
                }],
                admin: req.user._id // Assuming req.user exists from auth middleware
            });
            await product.save();
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

// Update manufacturing process
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

        // Check if the product exists in the products collection
        let product = await Product.findOne({ 
            name: { $regex: new RegExp(`^${sweetName.trim()}$`, 'i') } 
        });

        // If product doesn't exist, create it with minimal information
        if (!product) {
            product = new Product({
                name: sweetName,
                category: null, // No category initially
                sku: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique SKU
                stockLevel: 0, // Manufacturing doesn't add to stock initially
                prices: [{
                    unit: unit,
                    netPrice: price,
                    sellingPrice: price * 1.2 // Assuming 20% profit margin
                }],
                admin: req.user._id // Assuming req.user exists from auth middleware
            });
            await product.save();
        } else {
            // If product exists, update its price information if needed
            let priceObj = product.prices.find(p => p.unit.toLowerCase() === unit.toLowerCase());
            if (!priceObj) {
                // Add new price entry if unit doesn't exist
                product.prices.push({
                    unit: unit,
                    netPrice: price,
                    sellingPrice: price * 1.2
                });
            } else {
                // Update existing price if different
                if (priceObj.netPrice !== price) {
                    priceObj.netPrice = price;
                    priceObj.sellingPrice = price * 1.2;
                }
            }
            await product.save();
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
        // Populate outgoing materials with related schedule information
        const outgoingMaterials = await OutgoingMaterial.find()
            .sort({ usedDate: -1 });
        
        // Get all unique schedule IDs from outgoing materials
        const scheduleIds = [...new Set(outgoingMaterials.map(item => item.scheduleId))];
        
        // Filter valid ObjectIds to avoid errors
        const validScheduleIds = scheduleIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        
        // Get related daily schedules
        const dailySchedules = await DailySchedule.find({ _id: { $in: validScheduleIds } });
        
        // Create a map of scheduleId to schedule details
        const scheduleMap = {};
        dailySchedules.forEach(schedule => {
            scheduleMap[schedule._id] = schedule;
        });
        
        // Enhance outgoing materials with additional information
        const enhancedOutgoingMaterials = outgoingMaterials.map(item => {
            const schedule = scheduleMap[item.scheduleId];
            
            // Calculate total cost
            const totalCost = item.quantityUsed * item.pricePerUnit;
            
            // Create readable schedule reference
            let readableScheduleRef = item.scheduleId;
            if (mongoose.Types.ObjectId.isValid(item.scheduleId)) {
                readableScheduleRef = `SCH-${item.scheduleId.substring(0, 8).toUpperCase()}`;
            } else if (item.scheduleId.startsWith('SCHEDULE_')) {
                // Convert old format to readable format
                readableScheduleRef = `SCH-${item.scheduleId.substring(9, 17)}`;
            }
            
            return {
                ...item.toObject(),
                manufacturedProductName: schedule ? schedule.sweetName : item.scheduleReference,
                dateUsed: item.usedDate,
                manufacturingProcessReference: readableScheduleRef,
                dailyScheduleReference: readableScheduleRef,
                status: schedule ? schedule.status : 'Unknown',
                totalCost: totalCost,
                unit: item.unit
            };
        });
        
        res.json(enhancedOutgoingMaterials);
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
        
        // Check if outgoing materials for this schedule already exist to prevent duplicates
        const existingOutgoingMaterials = await OutgoingMaterial.find({ scheduleId });
        if (existingOutgoingMaterials.length > 0) {
            return res.status(400).json({ message: 'Outgoing materials already exist for this schedule. Cannot process duplicate entries.' });
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
                    // If any ingredient fails, revert all previous deductions
                    for (const revertedItem of deductedItems) {
                        const itemToRevert = await StoreRoomItem.findOne({ name: { $regex: new RegExp(`^${revertedItem.name.trim()}$`, 'i') } });
                        if (itemToRevert) {
                            itemToRevert.quantity += revertedItem.deductedQuantity;
                            await itemToRevert.save();
                        }
                    }
                    
                    // Delete all created outgoing records
                    for (const record of outgoingRecords) {
                        await OutgoingMaterial.findByIdAndDelete(record._id);
                    }
                    
                    return res.status(400).json({ 
                        message: `Insufficient stock for ${ingredient.materialName}. Available: ${storeItem.quantity}, Required: ${ingredient.quantityUsed}` 
                    });
                }
            } else {
                // If any ingredient fails, revert all previous deductions
                for (const revertedItem of deductedItems) {
                    const itemToRevert = await StoreRoomItem.findOne({ name: { $regex: new RegExp(`^${revertedItem.name.trim()}$`, 'i') } });
                    if (itemToRevert) {
                        itemToRevert.quantity += revertedItem.deductedQuantity;
                        await itemToRevert.save();
                    }
                }
                
                // Delete all created outgoing records
                for (const record of outgoingRecords) {
                    await OutgoingMaterial.findByIdAndDelete(record._id);
                }
                
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

// Get daily schedules with status
const getDailySchedules = async (req, res) => {
    try {
        const schedules = await DailySchedule.find().sort({ date: -1, createdAt: -1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Create daily schedule
const createDailySchedule = async (req, res) => {
    try {
        const { sweetName, quantity, ingredients, price, unit, date, description } = req.body;
        
        if (!sweetName || !quantity || !ingredients || !price || !unit || !date) {
            return res.status(400).json({ message: 'All fields are required: sweetName, quantity, ingredients, price, unit, date' });
        }
        
        // Validate ingredients array
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients must be a non-empty array' });
        }
        
        const schedule = new DailySchedule({
            sweetName,
            quantity: Number(quantity),
            ingredients,
            price: Number(price),
            unit,
            date: new Date(date),
            description: description || ''
        });
        
        await schedule.save();
        res.status(201).json(schedule);
    } catch (error) {
        console.error('Error creating daily schedule:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update daily schedule status
const getDailyScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await DailySchedule.findById(id);
        
        if (!schedule) {
            return res.status(404).json({ message: 'Daily schedule not found' });
        }
        
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateDailyScheduleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['Pending', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Status must be either "Pending" or "Completed"' });
        }
        
        // Find the schedule
        const schedule = await DailySchedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        
        // Prevent changing status from Completed back to Pending
        if (schedule.status === 'Completed' && status === 'Pending') {
            return res.status(400).json({ message: 'Cannot change status from Completed back to Pending' });
        }
        
        // If changing to Completed, update product stock
        if (status === 'Completed' && schedule.status !== 'Completed') {
            // Find the product by name (case-insensitive)
            const product = await Product.findOne({ 
                name: { $regex: new RegExp(`^${schedule.sweetName.trim()}$`, 'i') } 
            });
            
            if (product) {
                // Find if there's already a price entry with the same unit
                let priceObj = product.prices.find(p => p.unit.toLowerCase() === schedule.unit.toLowerCase());
                
                if (!priceObj) {
                    // If unit doesn't exist, create a new price entry
                    priceObj = {
                        unit: schedule.unit,
                        netPrice: schedule.price,
                        sellingPrice: schedule.price * 1.2 // Assuming 20% profit margin
                    };
                    product.prices.push(priceObj);
                } else {
                    // If unit exists, update the price if it's different
                    if (priceObj.netPrice !== schedule.price) {
                        priceObj.netPrice = schedule.price;
                        priceObj.sellingPrice = schedule.price * 1.2;
                    }
                }
                
                // Update the stock level by adding the scheduled quantity
                product.stockLevel = (product.stockLevel || 0) + Number(schedule.quantity);
                
                await product.save();
            } else {
                // If product doesn't exist in the products collection, create a new one
                // First, try to find a category for the product (optional - you might want to handle this differently)
                const newProduct = new Product({
                    name: schedule.sweetName,
                    category: null, // You might want to set a default category or get it from somewhere else
                    sku: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique SKU
                    stockLevel: Number(schedule.quantity),
                    prices: [{
                        unit: schedule.unit,
                        netPrice: schedule.price,
                        sellingPrice: schedule.price * 1.2 // Assuming 20% profit margin
                    }],
                    admin: req.user._id // Assuming req.user exists from auth middleware
                });
                
                await newProduct.save();
            }
        }
        
        // Update the schedule status
        const updatedSchedule = await DailySchedule.findByIdAndUpdate(
            id,
            { 
                status,
                completedAt: status === 'Completed' ? new Date() : null
            },
            { new: true }
        );
        
        res.json({
            message: `Schedule status updated to ${status}`,
            schedule: updatedSchedule
        });
    } catch (error) {
        console.error('Error updating schedule status:', error);
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
    getDailySchedules,        // Add this function to exports
    createDailySchedule,      // Add this function to exports
    getDailyScheduleById,     // Add this function to exports
    updateDailyScheduleStatus // Add this function to exports
};
