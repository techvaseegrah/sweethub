// backend/models/assignedTaskModel.js
const mongoose = require('mongoose');

// Schema for an assigned task
const assignedTaskSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: false // Not required for common tasks
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskTopic',
        required: true
    },
    subTopic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskTopic.subTopics', // Reference to the sub-topic within the topic
        required: false // Not required if only a main topic is assigned
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming an admin user assigns tasks
        required: true
    },
    isCommonTask: {
        type: Boolean,
        default: false // True if assigned to all workers in a department
    }
}, { timestamps: true });

const AssignedTask = mongoose.model('AssignedTask', assignedTaskSchema);

module.exports = AssignedTask;