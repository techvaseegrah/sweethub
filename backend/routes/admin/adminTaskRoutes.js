// backend/routes/admin/adminTaskRoutes.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../../controllers/admin/taskController');
const { adminAuth } = require('../../middleware/authMiddleware'); // Import your specific adminAuth middleware

// Apply the adminAuth middleware to all routes in this router
// This middleware will handle both token verification and role checking for 'admin'.
router.use(adminAuth);

// Task Topics routes
router.route('/topics')
    .post(createTaskTopic)
    .get(getAllTaskTopics);
router.route('/topics/:id')
    .put(updateTaskTopic)
    .delete(deleteTaskTopic);

// Sub-topics routes
router.route('/topics/:id/subtopics')
    .post(addSubTopic);
router.route('/topics/:topicId/subtopics/:subTopicId')
    .put(updateSubTopic)
    .delete(deleteSubTopic);

// Assigned tasks routes
router.post('/assign', assignTask);
router.get('/daily', getDailyAssignedTasks);
router.put('/complete/:id', completeTask);
router.get('/completed', getCompletedTasks);

// Helper routes for dropdowns
router.get('/workers', getAllWorkers);
router.get('/departments', getAllDepartments);


module.exports = router;
