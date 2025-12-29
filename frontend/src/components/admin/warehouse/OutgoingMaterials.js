import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

const OutgoingMaterials = () => {
    const [outgoingMaterials, setOutgoingMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // Filter by status

    const fetchOutgoingMaterials = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch actual outgoing materials (ingredients used in production)
            const response = await axios.get('/admin/warehouse/outgoing-materials');
            setOutgoingMaterials(response.data);
        } catch (err) {
            setError('Failed to fetch outgoing materials.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOutgoingMaterials();
    }, [fetchOutgoingMaterials]);

    const filteredMaterials = outgoingMaterials
        .filter(item =>
            (item.materialName && item.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.manufacturedProductName && item.manufacturedProductName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .filter(item => 
            statusFilter === 'all' || item.status === statusFilter
        )
        .sort((a, b) => new Date(b.dateUsed || b.usedDate) - new Date(a.dateUsed || a.usedDate));

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
        <div className="text-red-500 font-medium">Loading outgoing materials...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold mb-4">Outgoing Materials (Ingredients Used)</h1>
            <p className="text-gray-600 mb-6">History of ingredients used in production processes with complete details.</p>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Search materials or products..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                <thead className="bg-light-gray">
                    <tr>
                        <th className="py-2 px-4 text-left">Material Name</th>
                        <th className="py-2 px-4 text-left">Manufactured Product</th>
                        <th className="py-2 px-4 text-left">Quantity Used</th>
                        <th className="py-2 px-4 text-left">Unit</th>
                        <th className="py-2 px-4 text-left">Price per Unit</th>
                        <th className="py-2 px-4 text-left">Total Cost</th>
                        <th className="py-2 px-4 text-left">Date Used</th>
                        <th className="py-2 px-4 text-left">Manufacturing Process</th>
                        <th className="py-2 px-4 text-left">Daily Schedule</th>
                        <th className="py-2 px-4 text-left">Status</th>
                    </tr>
                </thead>
                    <tbody>
                        {filteredMaterials.length > 0 ? filteredMaterials.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{item.materialName}</td>
                                <td className="border px-4 py-2">{item.manufacturedProductName || item.scheduleReference}</td>
                                <td className="border px-4 py-2">{item.quantityUsed}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.pricePerUnit}</td>
                                <td className="border px-4 py-2">₹{item.totalCost ? item.totalCost.toFixed(2) : (item.quantityUsed * item.pricePerUnit).toFixed(2)}</td>
                                <td className="border px-4 py-2">{new Date(item.dateUsed || item.usedDate).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">{item.manufacturingProcessReference}</td>
                                <td className="border px-4 py-2">{item.dailyScheduleReference}</td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" className="text-center py-4">No outgoing materials found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OutgoingMaterials;