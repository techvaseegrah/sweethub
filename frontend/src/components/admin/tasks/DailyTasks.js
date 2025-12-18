// frontend/src/components/admin/tasks/DailyTasks.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuPencil, LuTrash2, LuSend, LuClipboardCheck } from 'react-icons/lu';
import CustomModal from '../../CustomModal';
import MessageAlert from '../../MessageAlert';

const DailyTasks = () => {
    const [topics, setTopics] = useState([]);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [workers, setWorkers] = useState([]);

    // State for Topic Modal
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicPoints, setNewTopicPoints] = useState(0);
    const [newTopicDepartment, setNewTopicDepartment] = useState('');
    const [editingTopic, setEditingTopic] = useState(null);
    const [showTopicModal, setShowTopicModal] = useState(false);

    // State for Sub-topic Modal
    const [newSubTopicName, setNewSubTopicName] = useState('');
    const [newSubTopicPoints, setNewSubTopicPoints] = useState(0);
    const [editingSubTopic, setEditingSubTopic] = useState(null);
    const [currentTopicForSub, setCurrentTopicForSub] = useState(null);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);

    // State for Assign Task Modal
    const [selectedTopicToAssign, setSelectedTopicToAssign] = useState('');
    const [selectedSubTopicsToAssign, setSelectedSubTopicsToAssign] = useState([]); // Changed to an array for multiple selections
    const [selectedWorkersToAssign, setSelectedWorkersToAssign] = useState([]);
    const [selectedDepartmentToAssign, setSelectedDepartmentToAssign] = useState('');
    const [isCommonTask, setIsCommonTask] = useState(false);
    const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);

    // General UI State
    const [alert, setAlert] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get('/admin/tasks/topics');
            setTopics(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch topics.' });
        }
    }, []);
    
    const fetchAssignedTasks = useCallback(async () => {
        try {
            const response = await axios.get('/admin/tasks/daily');
            setAssignedTasks(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch assigned tasks.' });
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await axios.get('/admin/tasks/departments');
            setDepartments(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch departments.' });
        }
    }, []);

    const fetchWorkers = useCallback(async () => {
        try {
            const response = await axios.get('/admin/tasks/workers');
            setWorkers(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch workers.' });
        }
    }, []);
    
    useEffect(() => {
        fetchData();
        fetchAssignedTasks();
        fetchDepartments();
        fetchWorkers();
    }, [fetchData, fetchAssignedTasks, fetchDepartments, fetchWorkers]);

    const handleCreateUpdateTopic = async () => {
        try {
            const payload = {
                name: newTopicName,
                points: newTopicPoints,
                department: newTopicDepartment || null
            };
            if (editingTopic) {
                await axios.put(`/admin/tasks/topics/${editingTopic._id}`, payload);
                setAlert({ type: 'success', message: 'Task topic updated successfully!' });
            } else {
                await axios.post('/admin/tasks/topics', payload);
                setAlert({ type: 'success', message: 'Task topic created successfully!' });
            }
            setShowTopicModal(false);
            resetTopicForm();
            fetchData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to save topic.' });
        }
    };

    const handleDeleteTopic = (id) => {
        setConfirmMessage('Are you sure you want to delete this topic? All associated sub-topics and assigned tasks will also be deleted.');
        setConfirmAction(() => async () => {
            try {
                await axios.delete(`/admin/tasks/topics/${id}`);
                setAlert({ type: 'success', message: 'Task topic deleted successfully!' });
                fetchData();
            } catch (error) {
                setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete topic.' });
            } finally {
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleAddSubTopic = async () => {
        if (!currentTopicForSub || !currentTopicForSub._id) {
            setAlert({ type: 'error', message: 'Cannot add sub-topic. The parent topic is not selected.' });
            setShowSubTopicModal(false);
            return;
        }

        try {
            const payload = {
                name: newSubTopicName,
                points: newSubTopicPoints
            };
            if (editingSubTopic) {
                await axios.put(`/admin/tasks/topics/${currentTopicForSub._id}/subtopics/${editingSubTopic._id}`, payload);
                setAlert({ type: 'success', message: 'Sub-topic updated successfully!' });
            } else {
                await axios.post(`/admin/tasks/topics/${currentTopicForSub._id}/subtopics`, payload);
                setAlert({ type: 'success', message: 'Sub-topic added successfully!' });
            }
            setShowSubTopicModal(false);
            resetSubTopicForm();
            fetchData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to save sub-topic.' });
        }
    };

    const handleDeleteSubTopic = (topicId, subTopicId) => {
        setConfirmMessage('Are you sure you want to delete this sub-topic? All associated assigned tasks will also be deleted.');
        setConfirmAction(() => async () => {
            try {
                await axios.delete(`/admin/tasks/topics/${topicId}/subtopics/${subTopicId}`);
                setAlert({ type: 'success', message: 'Sub-topic deleted successfully!' });
                fetchData();
            } catch (error) {
                setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete sub-topic.' });
            } finally {
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleAssignTask = async () => {
        try {
            if (isCommonTask && !selectedDepartmentToAssign) {
                setAlert({ type: 'error', message: 'Please select a department for common tasks.' });
                return;
            }
            if (!isCommonTask && selectedWorkersToAssign.length === 0) {
                setAlert({ type: 'error', message: 'Please select at least one worker for specific tasks.' });
                return;
            }
            if (!selectedTopicToAssign) {
                setAlert({ type: 'error', message: 'Please select a topic to assign.' });
                return;
            }
            
            // Assign main topic if no subtopics are selected
            if (selectedSubTopicsToAssign.length === 0) {
                await axios.post('/admin/tasks/assign', {
                    topicId: selectedTopicToAssign,
                    subTopicId: null, // No sub-topic
                    workerIds: isCommonTask ? [] : selectedWorkersToAssign,
                    departmentId: selectedDepartmentToAssign,
                    isCommonTask
                });
            } else {
                // Iterate through selected sub-topics and assign each as a separate task
                const assignmentPromises = selectedSubTopicsToAssign.map(subTopicId =>
                    axios.post('/admin/tasks/assign', {
                        topicId: selectedTopicToAssign,
                        subTopicId: subTopicId,
                        workerIds: isCommonTask ? [] : selectedWorkersToAssign,
                        departmentId: selectedDepartmentToAssign,
                        isCommonTask
                    })
                );
                await Promise.all(assignmentPromises);
            }

            setAlert({ type: 'success', message: 'Task(s) assigned successfully!' });
            setShowAssignTaskModal(false);
            resetAssignTaskForm();
            fetchAssignedTasks(); // Refresh assigned tasks list
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to assign task.' });
        }
    };
    
    const handleMarkAsCompleted = (taskId) => {
        setConfirmMessage('Are you sure you want to mark this task as completed?');
        setConfirmAction(() => async () => {
            try {
                await axios.put(`/admin/tasks/complete/${taskId}`);
                setAlert({ type: 'success', message: 'Task marked as completed successfully!' });
                fetchAssignedTasks();
            } catch (error) {
                setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to mark task as completed.' });
            } finally {
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const resetTopicForm = () => {
        setNewTopicName('');
        setNewTopicPoints(0);
        setNewTopicDepartment('');
        setEditingTopic(null);
    };

    const resetSubTopicForm = () => {
        setNewSubTopicName('');
        setNewSubTopicPoints(0);
        setEditingSubTopic(null);
    };

    const resetAssignTaskForm = () => {
        setSelectedTopicToAssign('');
        setSelectedSubTopicsToAssign([]);
        setSelectedWorkersToAssign([]);
        setSelectedDepartmentToAssign('');
        setIsCommonTask(false);
    };

    const openEditTopicModal = (topic) => {
        setEditingTopic(topic);
        setNewTopicName(topic.name);
        setNewTopicPoints(topic.points);
        setNewTopicDepartment(topic.department?._id || '');
        setShowTopicModal(true);
    };

    const openAddSubTopicModal = (topic) => {
        setCurrentTopicForSub(topic);
        resetSubTopicForm();
        setShowSubTopicModal(true);
    };

    const openEditSubTopicModal = (topic, subTopic) => {
        setCurrentTopicForSub(topic);
        setEditingSubTopic(subTopic);
        setNewSubTopicName(subTopic.name);
        setNewSubTopicPoints(subTopic.points);
        setShowSubTopicModal(true);
    };

    const handleWorkerSelection = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedWorkersToAssign((prev) => [...prev, value]);
        } else {
            setSelectedWorkersToAssign((prev) => prev.filter((workerId) => workerId !== value));
        }
    };

    const handleSubTopicSelection = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedSubTopicsToAssign((prev) => [...prev, value]);
        } else {
            setSelectedSubTopicsToAssign((prev) => prev.filter((subTopicId) => subTopicId !== value));
        }
    };

    const filteredWorkers = selectedDepartmentToAssign
        ? workers.filter(worker => worker.department?._id === selectedDepartmentToAssign)
        : workers;

    const availableSubTopics = selectedTopicToAssign
        ? topics.find(topic => topic._id === selectedTopicToAssign)?.subTopics || []
        : [];
        
    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Daily Tasks Management</h2>

            {alert && (
                <MessageAlert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => { resetTopicForm(); setShowTopicModal(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md"
                >
                    <LuPlus className="mr-2" /> Add New Topic
                </button>
                <button
                    onClick={() => { resetAssignTaskForm(); setShowAssignTaskModal(true); }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-md"
                >
                    <LuSend className="mr-2" /> Assign Task
                </button>
            </div>
            
            <hr className="my-6" />

            {/* Assigned Tasks Section */}
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Pending Tasks</h3>
                <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Task
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Points
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignedTasks.length > 0 ? (
                                assignedTasks.map((task) => (
                                    <tr key={task._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {task.worker ? task.worker.name : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {task.department ? task.department.name : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {task.topic?.name} {task.subTopicName ? ` - ${task.subTopicName}` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {task.points}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleMarkAsCompleted(task._id)}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <LuClipboardCheck className="mr-2" /> Complete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No pending tasks found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <hr className="my-6" />

            {/* Task Topics Management Section */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Task Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic) => (
                    <div key={topic._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold text-gray-700">{topic.name}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openEditTopicModal(topic)}
                                    className="p-2 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                                >
                                    <LuPencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteTopic(topic._id)}
                                    className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                    <LuTrash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                            Department: {topic.department ? topic.department.name : 'All Departments'} | Points: {topic.points}
                        </p>

                        <details className="group mt-4">
                            <summary className="flex items-center justify-between cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                Sub-topics ({topic.subTopics.length})
                                <span className="transform transition-transform duration-200 group-open:rotate-90">
                                    ▶
                                </span>
                            </summary>
                            <div className="pt-2 pl-4 space-y-2">
                                {topic.subTopics.length > 0 ? (
                                    topic.subTopics.map((sub) => (
                                        <div key={sub._id} className="flex justify-between items-center text-gray-700 text-sm bg-white p-2 rounded-md shadow-xs border border-gray-100">
                                            <span>{sub.name} ({sub.points} pts)</span>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => openEditSubTopicModal(topic, sub)}
                                                    className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                                                >
                                                    <LuPencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubTopic(topic._id, sub._id)}
                                                    className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No sub-topics defined for this topic.</p>
                                )}
                                <button
                                    onClick={() => openAddSubTopicModal(topic)}
                                    className="flex items-center mt-3 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    <LuPlus className="mr-1" /> Add Sub-Topic
                                </button>
                            </div>
                        </details>
                    </div>
                ))}
            </div>

            {/* Topic Modal */}
            <CustomModal
                isOpen={showTopicModal}
                onClose={() => setShowTopicModal(false)}
                title={editingTopic ? 'Edit Task Topic' : 'Add New Task Topic'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Topic Name:</label>
                        <input
                            type="text"
                            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            placeholder="Enter topic name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Points:</label>
                        <input
                            type="number"
                            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTopicPoints}
                            onChange={(e) => setNewTopicPoints(Number(e.target.value))}
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Department (Optional):</label>
                        <select
                            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTopicDepartment}
                            onChange={(e) => setNewTopicDepartment(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleCreateUpdateTopic}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        {editingTopic ? 'Update Topic' : 'Create Topic'}
                    </button>
                </div>
            </CustomModal>

            {/* Sub-Topic Modal */}
            <CustomModal
                isOpen={showSubTopicModal}
                onClose={() => setShowSubTopicModal(false)}
                title={editingSubTopic ? `Edit Sub-topic for "${currentTopicForSub?.name}"` : `Add Sub-topic for "${currentTopicForSub?.name}"`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Sub-topic Name:</label>
                        <input
                            type="text"
                            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newSubTopicName}
                            onChange={(e) => setNewSubTopicName(e.target.value)}
                            placeholder="Enter sub-topic name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Points:</label>
                        <input
                            type="number"
                            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newSubTopicPoints}
                            onChange={(e) => setNewSubTopicPoints(Number(e.target.value))}
                            min="0"
                        />
                    </div>
                    <button
                        onClick={handleAddSubTopic}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        {editingSubTopic ? 'Update Sub-topic' : 'Add Sub-topic'}
                    </button>
                </div>
            </CustomModal>

            {/* Assign Task Modal */}
            <CustomModal
                isOpen={showAssignTaskModal}
                onClose={() => setShowAssignTaskModal(false)}
                title="Assign New Task"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                        <select
                            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedTopicToAssign}
                            onChange={(e) => {
                                setSelectedTopicToAssign(e.target.value);
                                setSelectedSubTopicsToAssign([]); // Reset sub-topics when topic changes
                            }}
                        >
                            <option value="">-- Select a Topic --</option>
                            {topics.map(topic => (
                                <option key={topic._id} value={topic._id}>{topic.name} ({topic.points} pts)</option>
                            ))}
                        </select>
                    </div>

                    {selectedTopicToAssign && availableSubTopics.length > 0 && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Select Sub-topics (Optional):</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                                {availableSubTopics.map(sub => (
                                    <label key={sub._id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            value={sub._id}
                                            checked={selectedSubTopicsToAssign.includes(sub._id)}
                                            onChange={handleSubTopicSelection}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{sub.name} ({sub.points} pts)</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isCommonTask"
                            checked={isCommonTask}
                            onChange={(e) => setIsCommonTask(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isCommonTask" className="ml-2 block text-sm text-gray-900">
                            Assign as Common Task (to all workers in selected department)
                        </label>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Select Department:</label>
                        <select
                            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedDepartmentToAssign}
                            onChange={(e) => {
                                setSelectedDepartmentToAssign(e.target.value);
                                setSelectedWorkersToAssign([]); // Reset workers when department changes
                            }}
                        >
                            <option value="">-- Select a Department --</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {!isCommonTask && selectedDepartmentToAssign && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Select Workers (for specific task):</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                                {filteredWorkers.length > 0 ? (
                                    filteredWorkers.map(worker => (
                                        <label key={worker._id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                value={worker._id}
                                                checked={selectedWorkersToAssign.includes(worker._id)}
                                                onChange={handleWorkerSelection}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{worker.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 col-span-2">No workers found for this department.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleAssignTask}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                        Assign Task
                    </button>
                </div>
            </CustomModal>

            {/* Confirmation Modal */}
            <CustomModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Confirm Action"
            >
                <div className="p-4">
                    <p className="text-lg text-gray-700 mb-6">{confirmMessage}</p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmAction}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </CustomModal>
        </div>
    );
};

export default DailyTasks;