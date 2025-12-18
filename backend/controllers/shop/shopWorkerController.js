const Worker = require('../../models/workerModel');
const User = require('../../models/User');
const Role = require('../../models/Role');
const Shop = require('../../models/shopModel');
const Department = require('../../models/departmentModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Utility function to generate a unique RFID
const generateUniqueRFID = async () => {
    let rfid;
    let isUnique = false;
    while (!isUnique) {
        // Generate a random 8-digit number as a string
        rfid = Math.floor(10000000 + Math.random() * 90000000).toString();
        const existingWorker = await Worker.findOne({ rfid });
        if (!existingWorker) {
            isUnique = true;
        }
    }
    return rfid;
};

// @desc    Add a new worker for the logged-in shop
// @route   POST /api/shop/workers
// @access  Private (Shop)
exports.addWorker = async (req, res) => {
    let { name, username, email, department, workingHours, lunchBreak, salary, rfid } = req.body;
    const shopId = req.shopId; // Get shop ID from the authenticated token
    const tempPassword = Math.random().toString(36).slice(-8);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate required fields
        if (!name || !username || !department || !workingHours || !salary) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Please fill all required fields' });
        }
        
        // Validate workingHours structure
        if (!workingHours.from || !workingHours.to) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Working hours must include both from and to times' });
        }
        
        // Validate lunchBreak structure if provided
        if (lunchBreak && (!lunchBreak.from || !lunchBreak.to)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Lunch break must include both from and to times' });
        }
        
        // Validate department is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(department)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid department ID' });
        }

        const userExists = await User.findOne({ username }).session(session);
        if (userExists) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Check if department exists
        const departmentExists = await Department.findById(department).session(session);
        if (!departmentExists) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Department not found' });
        }
        
        const workerRole = await Role.findOne({ name: 'worker' }).session(session);
        if (!workerRole) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ message: 'Worker role not found' });
        }
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const newUser = new User({
            name,
            username,
            ...(email && { email }), // Only add email if it exists
            password: hashedPassword,
            role: workerRole._id,
            isVerified: true
        });
        await newUser.save({ session });
        
        // Use provided RFID or generate a new one
        const workerRfid = rfid || await generateUniqueRFID();
        
        const newWorker = new Worker({
            name,
            username,
            ...(email && { email }), // Only add email if it exists
            department,
            workingHours,
            ...(lunchBreak && { lunchBreak }), // Only add lunchBreak if it exists
            salary,
            shop: shopId, // Associate worker with the shop
            rfid: workerRfid
        });
        
        await newWorker.save({ session });
        
        await Department.findByIdAndUpdate(
            department,
            { $push: { workers: newWorker._id } },
            { session, new: true }
        );

        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json({ 
            message: 'Worker added successfully!', 
            tempPassword,
            rfid: workerRfid,
            workerId: newWorker._id
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error adding worker:", error);
        // Provide more specific error messages
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error: ' + error.message });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Get all workers for the logged-in shop
// @route   GET /api/shop/workers
// @access  Private (Shop)
exports.getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({ shop: req.shopId })
            .populate('user', 'username')
            .populate('department', 'name')
            .populate('shop', 'name')
            .select('+faceImages +faceEncodings'); // Include faceImages and faceEncodings for face enrollment
            
        res.status(200).json(workers);
    } catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a worker
// @route   DELETE /api/shop/workers/:id
// @access  Private (Shop)
exports.deleteWorker = async (req, res) => {
    const { id } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const worker = await Worker.findOne({ _id: id, shop: req.shopId }).session(session);
        if (!worker) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Worker not found in this shop' });
        }
        
        await User.findByIdAndDelete(worker.user).session(session);
        await Worker.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        session.endSession();
        
        res.status(200).json({ message: 'Worker deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting worker:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a worker
// @route   PUT /api/shop/workers/:id
// @access  Private (Shop)
exports.updateWorker = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const filter = { _id: id, shop: req.shopId };
        const updatedWorker = await Worker.findOneAndUpdate(filter, updateData, { new: true });

        if (!updatedWorker) {
            return res.status(404).json({ message: 'Worker not found in this shop' });
        }

        // Also update the name in the associated User model if name was updated
        if (updateData.name) {
            await User.findByIdAndUpdate(updatedWorker.user, { name: updateData.name });
        }

        res.status(200).json({ message: 'Worker updated successfully!', worker: updatedWorker });
    } catch (error) {
        console.error("Error updating worker:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Generate a new RFID for an existing worker
// @route   POST /api/shop/workers/:id/generate-rfid
// @access  Private (Shop)
exports.generateRFIDForWorker = async (req, res) => {
    try {
        const worker = await Worker.findOne({ _id: req.params.id, shop: req.shopId });

        if (!worker) {
            return res.status(404).json({ message: 'Worker not found in this shop' });
        }

        const newRfid = await generateUniqueRFID();
        worker.rfid = newRfid;
        await worker.save();

        res.status(200).json({ message: 'New RFID generated successfully', rfid: newRfid });
    } catch (error) {
        console.error("Error generating RFID:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get salary report for a worker
// @route   GET /api/shop/workers/:id/salary-report
// @access  Private (Shop)
exports.getWorkerSalaryReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the worker belonging to this shop
        const worker = await Worker.findOne({ _id: id, shop: req.shopId })
            .populate('department', 'name')
            .populate('user', 'username email');
            
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found in this shop.' });
        }
        
        // For now, we'll generate mock salary data
        // In a real implementation, this would fetch from a salary/attendance database
        const currentDate = new Date();
        const reports = [];
        
        // Generate reports for the last 6 months
        for (let i = 5; i >= 0; i--) {
            const reportDate = new Date(currentDate);
            reportDate.setMonth(reportDate.getMonth() - i);
            
            // Mock data - in a real app, this would come from actual records
            const basicSalary = worker.salary || 0;
            const attendanceDays = Math.floor(Math.random() * 25) + 5; // 5-30 days
            const deductions = Math.floor(Math.random() * 500); // 0-500 rupees
            const netSalary = basicSalary - deductions;
            
            reports.push({
                date: reportDate,
                month: reportDate.toLocaleString('default', { month: 'long' }),
                year: reportDate.getFullYear(),
                basicSalary: basicSalary,
                attendanceDays: attendanceDays,
                deductions: deductions,
                netSalary: netSalary
            });
        }
        
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching salary report:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};