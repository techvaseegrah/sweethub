import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const HolidayManagement = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form state
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [isPaid, setIsPaid] = useState(true);
    const [editingId, setEditingId] = useState(null);
    
    // Fetch holidays
    useEffect(() => {
        fetchHolidays();
    }, []);
    
    const fetchHolidays = async () => {
        setLoading(true);
        setError('');
        try {
            // Shop side will use shop holidays endpoint
            const response = await axios.get('/shop/holidays');
            setHolidays(response.data);
        } catch (err) {
            setError('Failed to fetch holidays');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!name || !date) {
            setError('Name and date are required');
            return;
        }
        
        try {
            // Note: Shops can only view holidays, not create/update/delete them
            setError('Shops cannot create or modify holidays. Please contact admin.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save holiday');
            console.error(err);
        }
    };
    
    // Handle edit
    const handleEdit = (holiday) => {
        // Note: Shops can only view holidays, not edit them
        setError('Shops cannot edit holidays. Please contact admin.');
    };
    
    // Handle delete
    const handleDelete = async (id) => {
        // Note: Shops can only view holidays, not delete them
        setError('Shops cannot delete holidays. Please contact admin.');
    };
    
    // Handle cancel edit
    const handleCancelEdit = () => {
        setName('');
        setDate('');
        setDescription('');
        setIsPaid(true);
        setEditingId(null);
    };
    
    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Holiday Management</h3>
            </div>
            
            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            
            {/* Holiday Form - Read Only for Shops */}
            <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                    {editingId ? 'Edit Holiday' : 'Add New Holiday'}
                </h4>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Holiday Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter holiday name"
                            required
                            readOnly
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            readOnly
                        />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter holiday description (optional)"
                            rows="3"
                            readOnly
                        />
                    </div>
                    
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={(e) => setIsPaid(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                                disabled
                            />
                            <span className="ml-2 text-gray-700">Paid Holiday</span>
                        </label>
                    </div>
                    
                    <div className="flex space-x-3 md:col-span-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                            disabled
                        >
                            {editingId ? 'Update Holiday' : 'Add Holiday'}
                        </button>
                        
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
                
                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <p className="text-sm">
                        <strong>Note:</strong> Shops can only view holidays. To create or modify holidays, please contact your administrator.
                    </p>
                </div>
            </div>
            
            {/* Holidays List */}
            <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4">Existing Holidays</h4>
                
                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-600">Loading holidays...</p>
                    </div>
                )}
                
                {!loading && holidays.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 border-b text-left">Name</th>
                                    <th className="py-2 px-4 border-b text-left">Date</th>
                                    <th className="py-2 px-4 border-b text-left">Description</th>
                                    <th className="py-2 px-4 border-b text-left">Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.map((holiday, index) => (
                                    <tr key={holiday._id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="py-2 px-4 border-b">{holiday.name}</td>
                                        <td className="py-2 px-4 border-b">{formatDate(holiday.date)}</td>
                                        <td className="py-2 px-4 border-b">{holiday.description || '-'}</td>
                                        <td className="py-2 px-4 border-b">
                                            <span className={`px-2 py-1 rounded-full text-xs ${holiday.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {holiday.isPaid ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {!loading && holidays.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No holidays found. Add a new holiday to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidayManagement;