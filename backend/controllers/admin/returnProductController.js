// backend/controllers/admin/returnProductController.js

const ReturnProduct = require('../../models/returnProductModel');
const StoreRoomItem = require('../../models/storeRoomItemModel'); // Assuming this model exists based on your structure
const OutgoingMaterial = require('../../models/outgoingMaterialModel'); // Assuming this model exists

// Helper function to generate a unique Return ID
const generateReturnId = async () => {
    const count = await ReturnProduct.countDocuments();
    return `RTN-${(count + 1).toString().padStart(5, '0')}`;
};

// Create a new return product entry
const createReturn = async (req, res) => {
    try {
        const returnId = await generateReturnId();
        const { productName, batchNumber, quantityReturned, reasonForReturn, source, remarks } = req.body;

        const newReturn = new ReturnProduct({
            returnId,
            productName,
            batchNumber,
            quantityReturned,
            reasonForReturn,
            source,
            remarks
        });

        await newReturn.save();
        res.status(201).json({ message: 'Return product registered successfully', return: newReturn });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register return product', error: error.message });
    }
};

// Get all return product entries (for admin - can see all)
const getReturns = async (req, res) => {
    try {
        const returns = await ReturnProduct.find({});
        res.status(200).json(returns);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch return products', error: error.message });
    }
};

// Get return product entries for a specific shop (for admin to view specific shop data)
const getShopSpecificReturns = async (req, res) => {
    try {
        const { shopId } = req.params;
        const returns = await ReturnProduct.find({ shopId });
        res.status(200).json(returns);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch return products', error: error.message });
    }
};

// Update a return (e.g., for approval) and update stock
const updateReturnAndStock = async (req, res) => {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    try {
        const returnEntry = await ReturnProduct.findById(id);
        if (!returnEntry) {
            return res.status(404).json({ message: 'Return entry not found' });
        }

        if (status === 'Approved') {
            // Update store room stock
            await StoreRoomItem.findOneAndUpdate(
                { name: returnEntry.productName },
                { $inc: { stock: returnEntry.quantityReturned } },
                { new: true, upsert: true }
            );

            // Update outgoing materials (assuming the product was previously 'outgoing')
            await OutgoingMaterial.findOneAndUpdate(
                { productName: returnEntry.productName },
                { $inc: { quantity: -returnEntry.quantityReturned } },
                { new: true }
            );

            returnEntry.status = 'Approved';
            returnEntry.approvedBy = approvedBy || 'Admin'; // Capture who approved it
        } else if (status === 'Rejected') {
            returnEntry.status = 'Rejected';
            returnEntry.approvedBy = approvedBy || 'Admin';
        }

        await returnEntry.save();
        res.status(200).json({ message: 'Return status updated successfully', return: returnEntry });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update return status and stock', error: error.message });
    }
};

module.exports = {
    createReturn,
    getReturns,
    getShopSpecificReturns,
    updateReturnAndStock
};