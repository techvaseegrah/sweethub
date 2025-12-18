// frontend/src/components/admin/tasks/TaskCompleted.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuCircleCheck, LuFilter } from 'react-icons/lu';
import CustomModal from '../../CustomModal';
import MessageAlert from '../../MessageAlert';

const TaskCompleted = () => {
    const [completedTasks, setCompletedTasks] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterWorker, setFilterWorker] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [alert, setAlert] = useState(null);
    const [selectedTaskToComplete, setSelectedTaskToComplete] = useState(null);
    const [showCompleteConfirmationModal, setShowCompleteConfirmationModal] = useState(false);
    
    const fetchCompletedTasks = useCallback(async () => {
        try {
            const params = {
                department: filterDepartment,
                worker: filterWorker,
                startDate: filterStartDate,
                endDate: filterEndDate
            };
            const response = await axios.get('/admin/tasks/completed', { params });
            setCompletedTasks(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch completed tasks.' });
        }
    }, [filterDepartment, filterWorker, filterStartDate, filterEndDate]);

    const fetchWorkers = useCallback(async () => {
        try {
            const response = await axios.get('/admin/tasks/workers');
            setWorkers(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to fetch workers.' });
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

    useEffect(() => {
        fetchCompletedTasks();
        fetchWorkers();
        fetchDepartments();
    }, [fetchCompletedTasks, fetchWorkers, fetchDepartments]);

    const handleMarkAsCompleted = async () => {
        try {
            await axios.put(`/admin/tasks/complete/${selectedTaskToComplete._id}`);
            setAlert({ type: 'success', message: 'Task marked as completed successfully!' });
            setShowCompleteConfirmationModal(false);
            fetchCompletedTasks(); // Re-fetch to update the list
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to mark task as completed.' });
        }
    };

    const openCompleteConfirmation = (task) => {
        setSelectedTaskToComplete(task);
        setShowCompleteConfirmationModal(true);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Tasks Completed</h2>

            {alert && (
                <MessageAlert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="filterDepartment" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                        id="filterDepartment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="filterWorker" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                        id="filterWorker"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={filterWorker}
                        onChange={(e) => setFilterWorker(e.target.value)}
                    >
                        <option value="all">All Employees</option>
                        {workers
                            .filter(worker => filterDepartment === 'all' || worker.department?._id === filterDepartment)
                            .map(worker => (
                                <option key={worker._id} value={worker._id}>{worker.name}</option>
                            ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        id="filterStartDate"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                </div>
            </div>

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
                                Completed On
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {completedTasks.length > 0 ? (
                            completedTasks.map((task) => (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {!task.isCompleted && (
                                            <button
                                                onClick={() => openCompleteConfirmation(task)}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <LuCircleCheck className="mr-2" /> Complete
                                            </button>
                                        )}
                                        {task.isCompleted && (
                                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No completed tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Complete Task Confirmation Modal */}
            <CustomModal
                isOpen={showCompleteConfirmationModal}
                onClose={() => setShowCompleteConfirmationModal(false)}
                title="Confirm Task Completion"
            >
                <div className="p-4">
                    <p className="text-lg text-gray-700 mb-6">
                        Are you sure you want to mark "
                        <span className="font-semibold">{selectedTaskToComplete?.topic?.name}
                            {selectedTaskToComplete?.subTopicName ? ` - ${selectedTaskToComplete.subTopicName}` : ''}
                        </span>"
                        for {selectedTaskToComplete?.worker?.name} as completed?
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setShowCompleteConfirmationModal(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMarkAsCompleted}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            Confirm Complete
                        </button>
                    </div>
                </div>
            </CustomModal>
        </div>
    );
};

export default TaskCompleted;