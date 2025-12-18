// backend/models/taskTopicModel.js
const mongoose = require('mongoose');

// Schema for a sub-topic
const taskSubTopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    // Reference to the parent topic
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskTopic',
        required: true
    }
}, { timestamps: true });

// Schema for a main task topic (headline)
const taskTopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    // Department can be null for common topics
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    // Sub-topics are stored as an array of sub-documents
    subTopics: [taskSubTopicSchema]
}, { timestamps: true });

const TaskTopic = mongoose.model('TaskTopic', taskTopicSchema);
const TaskSubTopic = mongoose.model('TaskSubTopic', taskSubTopicSchema); // Exported for direct use if needed, but primarily embedded

module.exports = { TaskTopic, TaskSubTopic };