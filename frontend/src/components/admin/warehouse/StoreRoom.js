import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPencil, LuTrash2, LuHistory } from 'react-icons/lu';

const StoreRoom = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    
    // Vendor history state
    const [isVendorHistoryModalOpen, setIsVendorHistoryModalOpen] = useState(false);
    const [vendorHistory, setVendorHistory] = useState([]);
    const [vendorHistoryLoading, setVendorHistoryLoading] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/store-room');
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch store room items.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`/admin/warehouse/store-room/${id}`);
                fetchItems(); // Refresh the list
            } catch (err) {
                setError('Failed to delete item.');
                console.error(err);
            }
        }
    };

    const openEditModal = (item) => {
        setCurrentItem({ ...item });
        setIsModalOpen(true);
    };
    
    const handleModalChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };
    
    // Vendor history functions
    const openVendorHistoryModal = async () => {
        setIsVendorHistoryModalOpen(true);
        setVendorHistoryLoading(true);
        
        try {
            const response = await axios.get(`/admin/warehouse/vendor-history`);
            setVendorHistory(response.data);
        } catch (err) {
            setError('Failed to fetch vendor history.');
            console.error(err);
        } finally {
            setVendorHistoryLoading(false);
        }
    };
    
    const closeVendorHistoryModal = () => {
        setIsVendorHistoryModalOpen(false);
        setVendorHistory([]);
    };

    const handleUpdate = async () => {
        if (!currentItem) return;
        try {
            await axios.put(`/admin/warehouse/store-room/${currentItem._id}`, currentItem);
            closeModal();
            fetchItems(); // Refresh the list
        } catch (err) {
            setError('Failed to update item.');
            console.error(err);
        }
    };
    
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Store Room</h1>
                <button 
                    onClick={openVendorHistoryModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <LuHistory className="mr-2" />
                    Vendor History
                </button>
            </div>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by material name..."
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
                            <th className="py-2 px-4 text-left">Quantity</th>
                            <th className="py-2 px-4 text-left">Unit</th>
                            <th className="py-2 px-4 text-left">Price (per unit)</th>
                            <th className="py-2 px-4 text-left">Vendor</th>
                            <th className="py-2 px-4 text-left">Expiry Date</th>
                            <th className="py-2 px-4 text-left">Used By Date</th>
                            <th className="py-2 px-4 text-left">Stock Alert Threshold</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{item.name}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.price}</td>
                                <td className="border px-4 py-2">{item.vendor || '-'}</td>
                                <td className="border px-4 py-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                                <td className="border px-4 py-2">{item.usedByDate ? new Date(item.usedByDate).toLocaleDateString() : '-'}</td>
                                <td className="border px-4 py-2">{item.stockAlertThreshold}</td>
                                <td className="border px-4 py-2">
                                    <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                                        <LuPencil />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
                                        <LuTrash2 />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No items found. Add items via the Raw Materials page.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && currentItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Item</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input type="text" name="name" value={currentItem.name} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Quantity</label>
                                <input type="text" name="quantity" value={currentItem.quantity} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Unit</label>
                                <input type="text" name="unit" value={currentItem.unit} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Price</label>
                                <input type="text" name="price" value={currentItem.price} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Vendor</label>
                                <input type="text" name="vendor" value={currentItem.vendor || ''} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Expiry Date</label>
                                <input 
                                    type="date" 
                                    name="expiryDate" 
                                    value={currentItem.expiryDate ? new Date(currentItem.expiryDate).toISOString().split('T')[0] : ''} 
                                    onChange={handleModalChange} 
                                    className="w-full px-3 py-2 border rounded-md" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Used By Date</label>
                                <input 
                                    type="date" 
                                    name="usedByDate" 
                                    value={currentItem.usedByDate ? new Date(currentItem.usedByDate).toISOString().split('T')[0] : ''} 
                                    onChange={handleModalChange} 
                                    className="w-full px-3 py-2 border rounded-md" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Stock Alert Threshold</label>
                                <input 
                                    type="number" 
                                    name="stockAlertThreshold" 
                                    value={currentItem.stockAlertThreshold || ''} 
                                    onChange={handleModalChange} 
                                    className="w-full px-3 py-2 border rounded-md" 
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Vendor History Modal */}
            {isVendorHistoryModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                All Vendor History
                            </h2>
                            <button 
                                onClick={closeVendorHistoryModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        
                        {vendorHistoryLoading ? (
                            <div className="text-center py-4">Loading vendor history...</div>
                        ) : vendorHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-light-gray">
                                        <tr>
                                            <th className="py-2 px-4 text-left">Material Name</th>
                                            <th className="py-2 px-4 text-left">Vendor Name</th>
                                            <th className="py-2 px-4 text-left">Quantity Received</th>
                                            <th className="py-2 px-4 text-left">Unit</th>
                                            <th className="py-2 px-4 text-left">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorHistory.map((entry, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="border px-4 py-2">{entry.materialName}</td>
                                                <td className="border px-4 py-2">{entry.vendorName}</td>
                                                <td className="border px-4 py-2">{entry.quantityReceived}</td>
                                                <td className="border px-4 py-2">{entry.unit}</td>
                                                <td className="border px-4 py-2">
                                                    {new Date(entry.receivedDate).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No vendor history found.
                            </div>
                        )}
                        
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={closeVendorHistoryModal}
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreRoom;