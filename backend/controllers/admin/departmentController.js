const Department = require('../../models/departmentModel');

// For functions that CREATE data (e.g., createDepartment)
exports.createDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        const newDepartment = new Department({ 
            name,
            // If the request is from a shop admin, associate it with their shop
            ...(req.shopId && { shop: req.shopId }) 
        });
        await newDepartment.save();
        res.status(201).json(newDepartment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const { shopId, showAdmin } = req.query;

        let filter = {};
        if (req.shopId) { // This is for a shop user
            filter = { shop: req.shopId };
        } else if (shopId) { // This is for the main admin with a selected shop
            filter = { shop: shopId };
        } else if (showAdmin) { // This is for the main admin showing their own departments
            filter = { shop: { $exists: false } };
        }
        
        const departments = await Department.find(filter).populate('workers');
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteDepartment = async (req, res) => {
    const { id } = req.params;
    try {
        const filter = req.shopId ? { _id: id, shop: req.shopId } : { _id: id };
        const deletedDepartment = await Department.findOneAndDelete(filter);

        if (!deletedDepartment) {
            return res.status(404).json({ message: 'Department not found or not authorized' });
        }
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        // Apply shop filter for shop users
        const filter = req.shopId ? { _id: id, shop: req.shopId } : { _id: id };
        const updatedDepartment = await Department.findOneAndUpdate(filter, { name }, { new: true });
        if (!updatedDepartment) {
            return res.status(404).json({ message: 'Department not found or not authorized' });
        }
        res.json(updatedDepartment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};