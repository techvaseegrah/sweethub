import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

const ProductionSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [scheduleToComplete, setScheduleToComplete] = useState(null);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch daily schedules with status
            const response = await axios.get('/admin/warehouse/daily-schedules');
            setSchedules(response.data);
        } catch (err) {
            setError('Failed to fetch production schedules.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const filteredSchedules = schedules
        .filter(item =>
            item.sweetName && item.sweetName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleStatusChange = async (scheduleId, newStatus) => {
        try {
            const response = await axios.put(`/admin/warehouse/daily-schedules/${scheduleId}/status`, {
                status: newStatus
            });
            setMessage(response.data.message);
            fetchSchedules(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update schedule status.');
        }
    };

    const confirmComplete = (schedule) => {
        setScheduleToComplete(schedule);
        setShowConfirmation(true);
    };

    const handleConfirmComplete = () => {
        if (scheduleToComplete) {
            handleStatusChange(scheduleToComplete._id, 'Completed');
            setShowConfirmation(false);
            setScheduleToComplete(null);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmation(false);
        setScheduleToComplete(null);
    };

    if (loading) return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading production schedules...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold mb-4">Production Schedules</h1>
            <p className="text-gray-600 mb-6">Track and manage your daily production schedules with status updates.</p>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search schedules..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                <thead className="bg-light-gray">
                    <tr>
                        <th className="py-2 px-4 text-left">Product Name</th>
                        <th className="py-2 px-4 text-left">Quantity</th>
                        <th className="py-2 px-4 text-left">Unit</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Actions</th>
                    </tr>
                </thead>
                    <tbody>
                        {filteredSchedules.length > 0 ? filteredSchedules.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{item.sweetName}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'Pending' 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    {item.status === 'Pending' ? (
                                        <button
                                            onClick={() => confirmComplete(item)}
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                                        >
                                            Mark Complete
                                        </button>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Completed</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4">No schedules found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirm Completion</h3>
                        <p className="mb-4">
                            Are you sure you want to mark this schedule as completed? 
                            Product stock will be automatically updated.
                        </p>
                        <p className="mb-4 font-semibold">
                            Product: {scheduleToComplete?.sweetName} | 
                            Quantity: {scheduleToComplete?.quantity} {scheduleToComplete?.unit}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelConfirm}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionSchedules;