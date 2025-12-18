const DailySchedule = require('../../models/dailyScheduleModel'); // This path is correct if dailyScheduleModel.js is in backend/models
const Manufacturing = require('../../models/manufacturingModel'); 

// @desc    Create a new daily schedule
// @route   POST /api/admin/daily-schedule
// @access  Private/Admin
const createDailySchedule = async (req, res) => {
    const { sweetName, quantity, ingredients, price, unit, date } = req.body;

    // Basic validation
    // ingredients should now be an array, not a single string
    if (!sweetName || !quantity || !date || !price || !unit || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: 'All fields are required, and ingredients must be a non-empty array.' });
    }

    try {
        const newDailySchedule = new DailySchedule({
            sweetName,
            quantity,
            // ingredients will now be directly passed as an array of objects
            ingredients, 
            price,
            unit,
            date,
        });

        await newDailySchedule.save();
        res.status(201).json({ message: 'Daily schedule created successfully!', dailySchedule: newDailySchedule });
    } catch (error) {
        console.error('Error creating daily schedule:', error);
        res.status(500).json({ message: 'Server error while creating daily schedule.' });
    }
};

// @desc    Get all daily schedules
// @route   GET /api/admin/daily-schedule
// @access  Private/Admin
const getDailySchedules = async (req, res) => {
    try {
        const dailySchedules = await DailySchedule.find({}).sort({ date: -1, sweetName: 1 });
        res.status(200).json(dailySchedules);
    } catch (error) {
        console.error('Error fetching daily schedules:', error);
        res.status(500).json({ message: 'Server error while fetching daily schedules.' });
    }
};

module.exports = {
    createDailySchedule,
    getDailySchedules,
};