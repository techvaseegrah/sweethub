// backend/controllers/admin/taskController.js
const { TaskTopic } = require('../../models/taskTopicModel');
const AssignedTask = require('../../models/assignedTaskModel');
const Worker = require('../../models/workerModel');
const Department = require('../../models/departmentModel');

// Helper function for exponential backoff
const exponentialBackoff = async (func, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await func();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
};

// @desc    Create a new task topic
// @route   POST /api/admin/tasks/topics
// @access  Admin
const createTaskTopic = async (req, res) => {
    try {
        const { name, points, department } = req.body;

        const taskTopic = await exponentialBackoff(() => TaskTopic.create({
            name,
            points,
            department: department || null // Allow department to be optional
        }));

        res.status(201).json({ success: true, data: taskTopic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all task topics
// @route   GET /api/admin/tasks/topics
// @access  Admin
const getAllTaskTopics = async (req, res) => {
    try {
        const taskTopics = await exponentialBackoff(() => TaskTopic.find().populate('department', 'name').sort({ createdAt: -1 }));
        res.status(200).json({ success: true, data: taskTopics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a task topic
// @route   PUT /api/admin/tasks/topics/:id
// @access  Admin
const updateTaskTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, points, department } = req.body;

        const taskTopic = await exponentialBackoff(() => TaskTopic.findByIdAndUpdate(
            id,
            { name, points, department: department || null },
            { new: true, runValidators: true }
        ));

        if (!taskTopic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        res.status(200).json({ success: true, data: taskTopic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a task topic
// @route   DELETE /api/admin/tasks/topics/:id
// @access  Admin
const deleteTaskTopic = async (req, res) => {
    try {
        const { id } = req.params;

        const taskTopic = await exponentialBackoff(() => TaskTopic.findByIdAndDelete(id));

        if (!taskTopic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        // Also delete all associated sub-topics and assigned tasks
        await exponentialBackoff(() => AssignedTask.deleteMany({ topic: id }));

        res.status(200).json({ success: true, message: 'Task topic and associated tasks deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a sub-topic to a task topic
// @route   POST /api/admin/tasks/topics/:id/subtopics
// @access  Admin
const addSubTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, points } = req.body;

        const taskTopic = await exponentialBackoff(() => TaskTopic.findById(id));

        if (!taskTopic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        taskTopic.subTopics.push({ name, points, topic: id });
        await exponentialBackoff(() => taskTopic.save());

        res.status(201).json({ success: true, data: taskTopic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a sub-topic
// @route   PUT /api/admin/tasks/topics/:topicId/subtopics/:subTopicId
// @access  Admin
const updateSubTopic = async (req, res) => {
    try {
        const { topicId, subTopicId } = req.params;
        const { name, points } = req.body;

        const taskTopic = await exponentialBackoff(() => TaskTopic.findById(topicId));

        if (!taskTopic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        const subTopic = taskTopic.subTopics.id(subTopicId);
        if (!subTopic) {
            return res.status(404).json({ success: false, message: 'Sub-topic not found' });
        }

        subTopic.name = name;
        subTopic.points = points;
        await exponentialBackoff(() => taskTopic.save());

        res.status(200).json({ success: true, data: taskTopic });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Delete a sub-topic
// @route   DELETE /api/admin/tasks/topics/:topicId/subtopics/:subTopicId
// @access  Admin
const deleteSubTopic = async (req, res) => {
    try {
        const { topicId, subTopicId } = req.params;

        const taskTopic = await exponentialBackoff(() => TaskTopic.findById(topicId));

        if (!taskTopic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        taskTopic.subTopics = taskTopic.subTopics.filter(sub => sub._id.toString() !== subTopicId);
        await exponentialBackoff(() => taskTopic.save());

        // Also delete assigned tasks related to this sub-topic
        await exponentialBackoff(() => AssignedTask.deleteMany({ subTopic: subTopicId }));

        res.status(200).json({ success: true, message: 'Sub-topic and associated tasks deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign a task to selected workers or common task
// @route   POST /api/admin/tasks/assign
// @access  Admin
const assignTask = async (req, res) => {
    try {
        const { topicId, subTopicId, subTopicIds, workerIds, departmentId, isCommonTask } = req.body;
        const assignedBy = req.user.id; 

        const topic = await exponentialBackoff(() => TaskTopic.findById(topicId));
        if (!topic) {
            return res.status(404).json({ success: false, message: 'Task topic not found' });
        }

        let baseTaskPoints = topic.points;
        const subTopics = Array.isArray(subTopicIds) && subTopicIds.length > 0 ? subTopicIds : (subTopicId ? [subTopicId] : []);
        
        let assignedTasks = [];

        if (isCommonTask) {
            const workersInDepartment = await exponentialBackoff(() => Worker.find({ department: departmentId }));
            if (workersInDepartment.length === 0) {
                return res.status(404).json({ success: false, message: 'No workers found in this department to assign common tasks.' });
            }

            for (const worker of workersInDepartment) {
                if (subTopics.length > 0) {
                    for (const sub of subTopics) {
                        const subTopic = topic.subTopics.id(sub);
                        if (!subTopic) continue;
                        assignedTasks.push({
                            worker: worker._id,
                            department: departmentId,
                            topic: topicId,
                            subTopic: sub,
                            points: baseTaskPoints + subTopic.points,
                            assignedBy,
                            isCommonTask: true
                        });
                    }
                } else {
                     assignedTasks.push({
                        worker: worker._id,
                        department: departmentId,
                        topic: topicId,
                        subTopic: null,
                        points: baseTaskPoints,
                        assignedBy,
                        isCommonTask: true
                     });
                }
            }
        } else { // Assign to selected workers
            if (!workerIds || workerIds.length === 0) {
                return res.status(400).json({ success: false, message: 'Worker IDs are required for specific task assignment.' });
            }

            const selectedWorkers = await exponentialBackoff(() => Worker.find({ _id: { $in: workerIds } }));
            if (selectedWorkers.length !== workerIds.length) {
                return res.status(404).json({ success: false, message: 'One or more selected workers not found.' });
            }
            
            for (const worker of selectedWorkers) {
                if (subTopics.length > 0) {
                    for (const sub of subTopics) {
                        const subTopic = topic.subTopics.id(sub);
                        if (!subTopic) continue;
                        assignedTasks.push({
                            worker: worker._id,
                            department: worker.department,
                            topic: topicId,
                            subTopic: sub,
                            points: baseTaskPoints + subTopic.points,
                            assignedBy,
                            isCommonTask: false
                        });
                    }
                } else {
                    assignedTasks.push({
                        worker: worker._id,
                        department: worker.department,
                        topic: topicId,
                        subTopic: null,
                        points: baseTaskPoints,
                        assignedBy,
                        isCommonTask: false
                    });
                }
            }
        }
        
        await exponentialBackoff(() => AssignedTask.insertMany(assignedTasks));

        res.status(201).json({ success: true, message: 'Task(s) assigned successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

// @desc    Get all assigned daily tasks (for admin to view)
// @route   GET /api/admin/tasks/daily
// @access  Admin
const getDailyAssignedTasks = async (req, res) => {
    try {
        const { department, worker, startDate, endDate } = req.query;
        let filter = { isCompleted: false };

        if (department && department !== 'all') {
            filter.department = department;
        }
        if (worker && worker !== 'all') {
            filter.worker = worker;
        }
        if (startDate) {
            filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filter.createdAt = { ...filter.createdAt, $lt: end };
        }

        const dailyTasks = await exponentialBackoff(() => AssignedTask.find(filter)
            .populate('worker', 'name')
            .populate('department', 'name')
            .populate('topic', 'name')
            .lean()
            .sort({ createdAt: -1 }));

        const populatedDailyTasks = await Promise.all(dailyTasks.map(async task => {
            if (task.subTopic) {
                const topicWithSubTopic = await exponentialBackoff(() => TaskTopic.findOne({ "subTopics._id": task.subTopic }));
                if (topicWithSubTopic) {
                    const subTopic = topicWithSubTopic.subTopics.id(task.subTopic);
                    task.subTopicName = subTopic ? subTopic.name : 'N/A';
                }
            }
            return task;
        }));

        res.status(200).json({ success: true, data: populatedDailyTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Mark an assigned task as completed
// @route   PUT /api/admin/tasks/complete/:id
// @access  Admin
const completeTask = async (req, res) => {
    try {
        const { id } = req.params;

        const assignedTask = await exponentialBackoff(() => AssignedTask.findByIdAndUpdate(
            id,
            { isCompleted: true, completedAt: new Date() },
            { new: true }
        ));

        if (!assignedTask) {
            return res.status(404).json({ success: false, message: 'Assigned task not found' });
        }

        res.status(200).json({ success: true, data: assignedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all completed tasks
// @route   GET /api/admin/tasks/completed
// @access  Admin
const getCompletedTasks = async (req, res) => {
    try {
        const { department, worker, startDate, endDate } = req.query;
        let filter = { isCompleted: true };

        if (department && department !== 'all') {
            filter.department = department;
        }
        if (worker && worker !== 'all') {
            filter.worker = worker;
        }
        if (startDate) {
            filter.completedAt = { ...filter.completedAt, $gte: new Date(startDate) };
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filter.completedAt = { ...filter.completedAt, $lt: end };
        }

        const completedTasks = await exponentialBackoff(() => AssignedTask.find(filter)
            .populate('worker', 'name')
            .populate('department', 'name')
            .populate('topic', 'name')
            .lean()
            .sort({ completedAt: -1 }));

        const populatedCompletedTasks = await Promise.all(completedTasks.map(async task => {
            if (task.subTopic) {
                const topicWithSubTopic = await exponentialBackoff(() => TaskTopic.findOne({ "subTopics._id": task.subTopic }));
                if (topicWithSubTopic) {
                    const subTopic = topicWithSubTopic.subTopics.id(task.subTopic);
                    task.subTopicName = subTopic ? subTopic.name : 'N/A';
                }
            }
            return task;
        }));

        res.status(200).json({ success: true, data: populatedCompletedTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all workers
// @route   GET /api/admin/tasks/workers
// @access  Admin (Helper for frontend dropdowns)
const getAllWorkers = async (req, res) => {
    try {
        const workers = await exponentialBackoff(() => Worker.find().select('name department').populate('department', 'name'));
        res.status(200).json({ success: true, data: workers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all departments
// @route   GET /api/admin/tasks/departments
// @access  Admin (Helper for frontend dropdowns)
const getAllDepartments = async (req, res) => {
    try {
        const departments = await exponentialBackoff(() => Department.find().select('name'));
        res.status(200).json({ success: true, data: departments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTaskTopic,
    getAllTaskTopics,
    updateTaskTopic,
    deleteTaskTopic,
    addSubTopic,
    updateSubTopic,
    deleteSubTopic,
    assignTask,
    getDailyAssignedTasks,
    completeTask,
    getCompletedTasks,
    getAllWorkers,
    getAllDepartments
};