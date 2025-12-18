 const Worker = require('../../models/workerModel');
const User = require('../../models/User');
const Department = require('../../models/departmentModel');
const bcrypt = require('bcrypt');
const Role = require('../../models/Role');
const mongoose = require('mongoose');
const Setting = require('../../models/settingModel');
const Incentive = require('../../models/incentiveModel');

// Function to generate a random RFID in the format AB0000 (2 letters + 4 digits)
const generateRandomRFID = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let rfid;
    let isUnique = false;

    // Keep generating until we find a unique RFID
    while (!isUnique) {
        let rfidLetters = '';
        let rfidDigits = '';
        for (let i = 0; i < 2; i++) {
            rfidLetters += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 4; i++) {
            rfidDigits += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        rfid = rfidLetters + rfidDigits;
        const existingWorker = await Worker.findOne({ rfid });
        if (!existingWorker) {
            isUnique = true;
        }
    }
    return rfid;
};

exports.addWorker = async (req, res) => {
    let { name, username, email, department, salary, createRFID, rfid, batchId } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const workerExists = await Worker.findOne({ username }).session(session);
        if (workerExists) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'A worker with this username already exists.' });
        }
        
        const workerRole = await Role.findOne({ name: 'worker' }).session(session);
        if (!workerRole) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ message: 'Worker role not found.' });
        }
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Generate RFID if requested
        let generatedRfid = null;
        if (createRFID) {
            // Handle whitespace in provided RFID
            if (rfid) {
                rfid = rfid.trim(); // Trim leading/trailing whitespace
            }
            generatedRfid = rfid || await generateRandomRFID();
        }
        
        // Prepare worker data
        const workerData = {
            name,
            username,
            email,
            department,
            salary,
            rfid: generatedRfid,
            batchId, // Store the batchId directly
            // Note: Do NOT associate with shop for admin-created workers
        };
        
        // If batchId is provided, fetch batch settings and apply them
        if (batchId) {
            // Fetch batch settings
            const batchSettings = await Setting.find({ key: { $regex: `^batch_${batchId}_` } });
            
            // Process batch settings
            batchSettings.forEach(setting => {
                const settingType = setting.key.replace(`batch_${batchId}_`, '');
                let value = setting.value;
                
                // Parse JSON values
                if (typeof setting.value === 'string' && setting.value.startsWith('{')) {
                    try {
                        value = JSON.parse(setting.value);
                    } catch (e) {
                        // If parsing fails, keep the original value
                    }
                }
                
                // Apply settings based on type
                switch (settingType) {
                    case 'workingHours':
                        workerData.workingHours = value;
                        break;
                    case 'lunchBreak':
                        workerData.lunchBreak = value;
                        break;
                    case 'breakTime':
                        workerData.breakTime = value;
                        break;
                }
            });
        }
        
        const newUser = new User({
            name,
            username,
            ...(email && { email }),
            password: hashedPassword,
            role: workerRole._id,
            isVerified: true
        });
        await newUser.save({ session });
        
        const newWorker = new Worker({
            ...workerData,
            user: newUser._id
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
            rfid: generatedRfid,
            workerId: newWorker._id
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error adding worker:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getWorkers = async (req, res) => {
    try {
        const { shopId, showAdmin } = req.query;
        let filter = {};
        
        // For admin panel, only show workers without shop association
        filter = { shop: { $exists: false } };
        
        const workers = await Worker.find(filter)
            .populate('department', 'name')
            .populate('user', 'username email') // Also populate username for employee ID
            .select('+faceImages +faceEncodings');
            
        // Add current month incentives to each worker
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        const workersWithIncentives = await Promise.all(workers.map(async (worker) => {
            const incentives = await Incentive.find({
                worker: worker._id,
                month: currentMonth,
                year: currentYear
            });
            
            const totalIncentives = incentives.reduce((sum, incentive) => sum + incentive.amount, 0);
            
            return {
                ...worker.toObject(),
                currentMonthIncentives: totalIncentives
            };
        }));
        
        res.status(200).json(workersWithIncentives);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteWorker = async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Ensure we're only deleting admin workers (no shop association)
        const worker = await Worker.findOne({ _id: id, shop: { $exists: false } }).session(session);

        if (!worker) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Worker not found.' });
        }

        await Department.findByIdAndUpdate(
            worker.department,
            { $pull: { workers: worker._id } },
            { session }
        );

        if (worker.user) {
            await User.findByIdAndDelete(worker.user, { session });
        }

        await Worker.findOneAndDelete({ _id: id, shop: { $exists: false } }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Worker deleted successfully.' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Salary report function
exports.getWorkerSalaryReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the worker
        const worker = await Worker.findById(id)
            .populate('department', 'name')
            .populate('user', 'username email');
            
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
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

exports.updateWorker = async (req, res) => {
    const { id } = req.params;
    let updateData = { ...req.body };

    try {
        // Ensure we're only updating admin workers (no shop association)
        const filter = { _id: id, shop: { $exists: false } };
        
        // If batchId is provided in the update, fetch batch settings and apply them
        if (updateData.batchId) {
            // Fetch batch settings
            const batchSettings = await Setting.find({ key: { $regex: `^batch_${updateData.batchId}_` } });
            
            // Process batch settings
            batchSettings.forEach(setting => {
                const settingType = setting.key.replace(`batch_${updateData.batchId}_`, '');
                let value = setting.value;
                
                // Parse JSON values
                if (typeof setting.value === 'string' && setting.value.startsWith('{')) {
                    try {
                        value = JSON.parse(setting.value);
                    } catch (e) {
                        // If parsing fails, keep the original value
                    }
                }
                
                // Apply settings based on type
                switch (settingType) {
                    case 'workingHours':
                        updateData.workingHours = value;
                        break;
                    case 'lunchBreak':
                        updateData.lunchBreak = value;
                        break;
                    case 'breakTime':
                        updateData.breakTime = value;
                        break;
                }
            });
        }
        
        // Remove batchId from updateData as it's now a field in the Worker model
        // No need to delete it anymore since we're storing it directly
        
        const updatedWorker = await Worker.findOneAndUpdate(filter, updateData, { new: true });

        if (!updatedWorker) {
            return res.status(404).json({ message: 'Worker not found or not authorized to update.' });
        }

        res.status(200).json({ message: 'Worker updated successfully!', worker: updatedWorker });
    } catch (error) {
        console.error('Error updating worker:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getWorkerByRFID = async (req, res) => {
    try {
        let { rfid } = req.params;
        
        // Handle whitespace in RFID parameter
        if (rfid) {
            rfid = rfid.trim(); // Trim leading/trailing whitespace
        }
        
        // Only find admin workers (no shop association)
        const worker = await Worker.findOne({ rfid, shop: { $exists: false } })
            .populate('department', 'name')
            .populate('user', 'email')
            .select('+faceImages');
        
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found with this RFID.' });
        }
        
        res.status(200).json(worker);
    } catch (error) {
        console.error('Error fetching worker by RFID:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.generateRFIDForWorker = async (req, res) => {
    try {
        const { id } = req.params;
        // Only find admin workers (no shop association)
        const worker = await Worker.findOne({ _id: id, shop: { $exists: false } });
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }
        
        if (worker.rfid) {
            return res.status(400).json({ message: 'Worker already has an RFID assigned.' });
        }
        
        const rfid = await generateRandomRFID();
        worker.rfid = rfid;
        await worker.save();
        
        res.status(200).json({ 
            message: 'RFID generated successfully!', 
            rfid 
        });
    } catch (error) {
        console.error('Error generating RFID:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};