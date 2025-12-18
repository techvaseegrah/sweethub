import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

const OutgoingMaterials = () => {
    const [storeRoomItems, setStoreRoomItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch outgoing materials from daily schedules instead of store room
            const response = await axios.get('/admin/warehouse/outgoing-materials');
            setStoreRoomItems(response.data);
        } catch (err) {
            setError('Failed to fetch outgoing materials.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredStoreRoomItems = storeRoomItems
    .filter(item =>
        item.materialName && item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.usedDate) - new Date(a.usedDate));

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
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold mb-4">Outgoing Materials</h1>
            <p className="text-gray-600 mb-6">History of materials deducted from store room.</p>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}
    
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search materials..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
    
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                <thead className="bg-light-gray">
                    <tr>
                        <th className="py-2 px-4 text-left">Material Name</th>
                        <th className="py-2 px-4 text-left">Quantity Used</th>
                        <th className="py-2 px-4 text-left">Unit</th>
                        <th className="py-2 px-4 text-left">Price (per unit)</th>
                        <th className="py-2 px-4 text-left">Date Used</th>
                        <th className="py-2 px-4 text-left">Schedule Reference</th>
                    </tr>
                </thead>
                    <tbody>
                        {filteredStoreRoomItems.length > 0 ? filteredStoreRoomItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{item.materialName}</td>
                                <td className="border px-4 py-2">{item.quantityUsed}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.pricePerUnit}</td>
                                <td className="border px-4 py-2">{new Date(item.usedDate).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">{item.scheduleReference}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4">No outgoing materials found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OutgoingMaterials;