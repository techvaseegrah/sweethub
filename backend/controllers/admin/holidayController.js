const Holiday = require('../../models/holidayModel');

exports.createHoliday = async (req, res) => {
    try {
        const { name, date, description, isPaid } = req.body;
        
        // Validate input
        if (!name || !date) {
            return res.status(400).json({ message: 'Name and date are required' });
        }
        
        // Check if holiday already exists for this date
        const existingHoliday = await Holiday.findOne({ date: new Date(date) });
        if (existingHoliday) {
            return res.status(400).json({ message: 'A holiday already exists for this date' });
        }
        
        // Create holiday
        const holiday = new Holiday({
            name,
            date: new Date(date),
            description,
            isPaid: isPaid !== undefined ? isPaid : true
        });
        
        await holiday.save();
        
        res.status(201).json({ 
            message: 'Holiday created successfully', 
            holiday 
        });
    } catch (error) {
        console.error('Error creating holiday:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getHolidays = async (req, res) => {
    try {
        const { year } = req.query;
        let query = {};
        
        // Filter by year if provided
        if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            query.date = { $gte: startOfYear, $lte: endOfYear };
        }
        
        const holidays = await Holiday.find(query).sort({ date: 1 });
        
        res.status(200).json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getHolidayById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const holiday = await Holiday.findById(id);
        
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        
        res.status(200).json(holiday);
    } catch (error) {
        console.error('Error fetching holiday:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, description, isPaid } = req.body;
        
        // Build update object
        const updateData = {};
        if (name) updateData.name = name;
        if (date) updateData.date = new Date(date);
        if (description !== undefined) updateData.description = description;
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        updateData.updatedAt = Date.now();
        
        const holiday = await Holiday.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        
        res.status(200).json({ 
            message: 'Holiday updated successfully', 
            holiday 
        });
    } catch (error) {
        console.error('Error updating holiday:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        
        const holiday = await Holiday.findByIdAndDelete(id);
        
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        
        res.status(200).json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Check if a specific date is a holiday
exports.isHoliday = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        
        const holiday = await Holiday.findOne({ date: new Date(date) });
        
        res.status(200).json({ 
            isHoliday: !!holiday,
            holiday: holiday || null
        });
    } catch (error) {
        console.error('Error checking holiday:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};