const Bill = require('../../models/billModel');
const VendorHistory = require('../../models/vendorHistoryModel');
const mongoose = require('mongoose');

exports.getGSTReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let filter = { isDeleted: false };
        if (startDate && endDate) {
            filter.billDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 1. Sales GST (Collected from customers)
        const salesGSTStats = await Bill.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalTaxableSales: { $sum: '$baseAmount' },
                    totalCGST: { $sum: { $divide: ['$gstAmount', 2] } }, // Assuming CGST = SGST = 50% of GST
                    totalSGST: { $sum: { $divide: ['$gstAmount', 2] } },
                    totalGSTCollected: { $sum: '$gstAmount' }
                }
            }
        ]);

        const salesStats = salesGSTStats.length > 0 ? salesGSTStats[0] : { totalTaxableSales: 0, totalCGST: 0, totalSGST: 0, totalGSTCollected: 0 };

        // 2. Purchase GST (Paid on raw/packing materials) - ITC
        const purchaseFilter = {};
        if (startDate && endDate) {
            purchaseFilter.receivedDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const purchaseGSTStats = await VendorHistory.aggregate([
            { $match: purchaseFilter },
            {
                $group: {
                    _id: null,
                    totalTaxablePurchases: { $sum: { $multiply: ['$quantityReceived', '$pricePerUnit'] } },
                    totalPurchaseGST: { $sum: '$gstAmount' }
                }
            }
        ]);

        const purchaseStats = purchaseGSTStats.length > 0 ? purchaseGSTStats[0] : { totalTaxablePurchases: 0, totalPurchaseGST: 0 };

        // 3. Breakdown by category or material type (Optional but good)
        const categoryBreakdown = await Bill.aggregate([
            { $match: filter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productName',
                    taxableAmount: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    gstAmount: { $sum: { $multiply: [{ $multiply: ['$items.quantity', '$items.price'] }, { $divide: ['$gstPercentage', 100] }] } }
                }
            },
            { $sort: { taxableAmount: -1 } }
        ]);

        // Net GST Payable = GST Collected - GST Paid (ITC)
        const netGSTPayable = salesStats.totalGSTCollected - purchaseStats.totalPurchaseGST;

        res.json({
            salesStats,
            purchaseStats,
            netGSTPayable,
            breakdown: categoryBreakdown.map(item => ({
                name: item._id,
                taxableAmount: item.taxableAmount,
                gstAmount: item.gstAmount
            }))
        });
    } catch (error) {
        console.error('GST Report Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
