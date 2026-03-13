const AfterPacking = require('../../models/afterPackingModel');
const BeforePacking = require('../../models/beforePackingModel');
const DailySchedule = require('../../models/dailyScheduleModel');
const OutgoingMaterial = require('../../models/outgoingMaterialModel');
const mongoose = require('mongoose');

// @desc    Get production report data
// @route   GET /api/admin/reports/production
// @access  Private/Admin
const getProductionReport = async (req, res) => {
    try {
        const { startDate, endDate, filter } = req.query;
        let query = {};
        let outgoingQuery = {};

        // Date filtering
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.date = { $gte: start, $lte: end };
            outgoingQuery.usedDate = { $gte: start, $lte: end };
        } else if (filter) {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (filter === 'today') {
                query.date = { $gte: startOfDay };
                outgoingQuery.usedDate = { $gte: startOfDay };
            } else if (filter === 'yesterday') {
                const yesterday = new Date(startOfDay);
                yesterday.setDate(yesterday.getDate() - 1);
                query.date = { $gte: yesterday, $lt: startOfDay };
                outgoingQuery.usedDate = { $gte: yesterday, $lt: startOfDay };
            } else if (filter === 'this-week') {
                const weekStart = new Date(startOfDay);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                query.date = { $gte: weekStart };
                outgoingQuery.usedDate = { $gte: weekStart };
            } else if (filter === 'this-month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                query.date = { $gte: monthStart };
                outgoingQuery.usedDate = { $gte: monthStart };
            }
        }

        // Aggregate Production items
        const productionItems = await AfterPacking.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$productName",
                    totalQuantity: { $sum: "$quantity" },
                    unit: { $first: "$unit" },
                    batchCount: { $count: {} }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        // Aggregate Material consumption
        const materialConsumption = await OutgoingMaterial.aggregate([
            { $match: outgoingQuery },
            {
                $group: {
                    _id: "$materialName",
                    totalUsed: { $sum: "$quantityUsed" },
                    unit: { $first: "$unit" },
                    totalCost: { $sum: { $multiply: ["$quantityUsed", "$pricePerUnit"] } }
                }
            },
            { $sort: { totalUsed: -1 } }
        ]);

        // Get some high level stats
        const totalBatches = await AfterPacking.countDocuments(query);
        const completedSchedules = await AfterPacking.countDocuments({ ...query, status: 'Completed' });

        const totalOutput = productionItems.reduce((acc, item) => acc + item.totalQuantity, 0);
        const totalMaterialCost = materialConsumption.reduce((acc, item) => acc + item.totalCost, 0);

        res.json({
            productionItems: productionItems.map(item => ({
                productName: item._id,
                totalQuantity: item.totalQuantity,
                unit: item.unit,
                batchCount: item.batchCount
            })),
            materialConsumption: materialConsumption.map(item => ({
                materialName: item._id,
                totalUsed: item.totalUsed,
                unit: item.unit,
                totalCost: item.totalCost
            })),
            stats: {
                totalBatches,
                completedSchedules,
                totalOutput: totalOutput.toFixed(2),
                activeProducts: productionItems.length,
                totalMaterialCost: totalMaterialCost.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching production report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getProductionReport
};
