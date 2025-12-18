const Worker = require('../../models/workerModel'); // Updated name
const Attendance = require('../../models/attendanceModel'); // Updated name
const mongoose = require('mongoose');

exports.calculateSalary = async (req, res) => {
    try {
        const { workerId } = req.params;
        const worker = await Worker.findById(workerId).populate('user').exec();

        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }

        const baseSalary = worker.salary;
        const monthlyWorkHours = 160;
        const hourlyRate = baseSalary / monthlyWorkHours;

        const attendanceRecords = await Attendance.find({ worker: workerId });

        let totalWorkingHours = 0;
        let totalOvertimeHours = 0;
        let totalLateArrivals = 0;

        attendanceRecords.forEach(record => {
            if (record.checkIn && record.checkOut) {
                const checkInTime = new Date(record.checkIn).getTime();
                const checkOutTime = new Date(record.checkOut).getTime();
                const workedDuration = (checkOutTime - checkInTime) / (1000 * 60 * 60);

                totalWorkingHours += workedDuration;

                const scheduledStart = new Date(record.checkIn);
                scheduledStart.setHours(parseInt(worker.workingHours.from.split(':')[0], 10), parseInt(worker.workingHours.from.split(':')[1], 10), 0, 0);

                const scheduledEnd = new Date(record.checkIn);
                scheduledEnd.setHours(parseInt(worker.workingHours.to.split(':')[0], 10), parseInt(worker.workingHours.to.split(':')[1], 10), 0, 0);

                if (checkInTime > scheduledStart.getTime() + (10 * 60 * 1000)) {
                    totalLateArrivals++;
                }

                if (checkOutTime > scheduledEnd.getTime()) {
                    totalOvertimeHours += (checkOutTime - scheduledEnd.getTime()) / (1000 * 60 * 60);
                }
            }
        });

        const overtimePay = totalOvertimeHours * hourlyRate * 1.5;
        const finalSalary = baseSalary + overtimePay;

        res.status(200).json({
            message: `Salary details for ${worker.name}`,
            baseSalary: baseSalary,
            totalWorkingHours: totalWorkingHours.toFixed(2),
            totalOvertimeHours: totalOvertimeHours.toFixed(2),
            totalLateArrivals: totalLateArrivals,
            overtimePay: overtimePay.toFixed(2),
            finalSalary: finalSalary.toFixed(2)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateSalary = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { newSalary } = req.body;

        const updatedWorker = await Worker.findByIdAndUpdate(workerId, { salary: newSalary }, { new: true });
        if (!updatedWorker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }

        res.status(200).json({ message: 'Salary updated successfully.', worker: updatedWorker });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.requestLeave = async (req, res) => {
    try {
        res.status(200).json({ message: 'Leave request submitted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.approveLeave = async (req, res) => {
    try {
        res.status(200).json({ message: 'Leave request approved.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.rejectLeave = async (req, res) => {
    try {
        res.status(200).json({ message: 'Leave request rejected.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};