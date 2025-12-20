const Incentive = require('../../models/incentiveModel');
const Worker = require('../../models/workerModel');

exports.addIncentive = async (req, res) => {
    try {
        const { workerId, amount, month, year, description } = req.body;
        
        // Validate input
        if (!workerId || !amount || !month || !year) {
            return res.status(400).json({ message: 'Worker ID, amount, month, and year are required' });
        }
        
        // Check if worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Create incentive
        const incentive = new Incentive({
            worker: workerId,
            amount: parseFloat(amount),
            month: parseInt(month),
            year: parseInt(year),
            description
        });
        
        await incentive.save();
        
        res.status(201).json({ 
            message: 'Incentive added successfully', 
            incentive 
        });
    } catch (error) {
        console.error('Error adding incentive:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getIncentivesByWorker = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { month, year } = req.query;
        
        // Check if worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Build query
        let query = { worker: workerId };
        
        if (month) {
            query.month = parseInt(month);
        }
        
        if (year) {
            query.year = parseInt(year);
        }
        
        // Fetch incentives
        const incentives = await Incentive.find(query).sort({ createdAt: -1 });
        
        res.status(200).json(incentives);
    } catch (error) {
        console.error('Error fetching incentives:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getIncentivesByWorkerAndMonth = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { month, year } = req.query;
        
        // Check if worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Validate month and year
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }
        
        // Fetch incentives for specific month and year
        const incentives = await Incentive.find({
            worker: workerId,
            month: parseInt(month),
            year: parseInt(year)
        });
        
        // Calculate total incentives
        const totalIncentives = incentives.reduce((sum, incentive) => sum + incentive.amount, 0);
        
        res.status(200).json({ 
            incentives,
            totalIncentives,
            month: parseInt(month),
            year: parseInt(year)
        });
    } catch (error) {
        console.error('Error fetching incentives:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteIncentive = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete incentive
        const incentive = await Incentive.findByIdAndDelete(id);
        
        if (!incentive) {
            return res.status(404).json({ message: 'Incentive not found' });
        }
        
        res.status(200).json({ message: 'Incentive deleted successfully' });
    } catch (error) {
        console.error('Error deleting incentive:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};