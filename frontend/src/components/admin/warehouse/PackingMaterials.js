import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPencil, LuTrash2, LuHistory } from 'react-icons/lu';
import PackingMaterialNameSelector from './PackingMaterialNameSelector';

const PackingMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // State for the "Add Material" form
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '',
        price: '',
        stockAlertThreshold: '',
        vendor: ''
    });

    // State for the Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    
    // Vendor history state
    const [isVendorHistoryModalOpen, setIsVendorHistoryModalOpen] = useState(false);
    const [vendorHistory, setVendorHistory] = useState([]);
    const [vendorHistoryLoading, setVendorHistoryLoading] = useState(false);
    const [vendorHistoryMaterialName, setVendorHistoryMaterialName] = useState('');

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/packing-materials');
            setMaterials(response.data);
            setFilteredMaterials(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch packing materials.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    useEffect(() => {
        const results = materials.filter(material =>
            material.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredMaterials(results);
    }, [searchTerm, materials]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Skip handling name field as it's now managed by PackingMaterialNameSelector
        if (name !== 'name') {
            setNewItem(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await axios.post('/admin/warehouse/packing-materials', newItem);
            if (response.status === 200) {
                setMessage(`Successfully updated "${newItem.name}" with additional quantity.`);
            } else {
                setMessage(`Successfully added "${newItem.name}".`);
            }
            setNewItem({ name: '', quantity: '', price: '', stockAlertThreshold: '', vendor: '' });
            fetchMaterials(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add packing material.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this packing material?')) {
            try {
                await axios.delete(`/admin/warehouse/packing-materials/${id}`);
                setMessage('Material deleted successfully.');
                fetchMaterials(); // Refresh list
            } catch (err) {
                setError('Failed to delete material.');
            }
        }
    };

    const openEditModal = (material) => {
        setCurrentItem({ ...material });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleModalChange = (e) => {
        const { name, value } = e.target;
        // Skip handling name field as it's now managed by PackingMaterialNameSelector
        if (name !== 'name') {
            setCurrentItem(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = async () => {
        if (!currentItem) return;
        try {
            await axios.put(`/admin/warehouse/packing-materials/${currentItem._id}`, currentItem);
            setMessage('Material updated successfully.');
            closeModal();
            fetchMaterials(); // Refresh list
        } catch (err) {
            setError('Failed to update material.');
        }
    };
    
    // Vendor history functions
    const openVendorHistoryModal = async (materialName = null) => {
        setIsVendorHistoryModalOpen(true);
        setVendorHistoryLoading(true);
        setVendorHistoryMaterialName(materialName || '');
        
        try {
            const url = materialName 
                ? `/admin/warehouse/packing-materials/vendor-history/${encodeURIComponent(materialName)}`
                : `/admin/warehouse/vendor-history`;
            const response = await axios.get(url);
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
        setVendorHistoryMaterialName('');
    };

    // No grouping needed as we're displaying materials in a table format

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
                <h1 className="text-2xl font-bold">View Packing Materials</h1>
                <button 
                    onClick={() => openVendorHistoryModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                    <LuHistory className="mr-2" />
                    Vendor History
                </button>
            </div>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
                <h2 className="text-lg font-semibold mb-2">Add New Packing Material</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                        <PackingMaterialNameSelector 
                            value={newItem.name} 
                            onChange={(name) => setNewItem(prev => ({ ...prev, name }))} 
                            className="border p-2 rounded-md w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input type="text" name="quantity" placeholder="Quantity" value={newItem.quantity} onChange={handleInputChange} className="border p-2 rounded-md w-full" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input type="text" name="price" placeholder="Price" value={newItem.price} onChange={handleInputChange} className="border p-2 rounded-md w-full" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alert Threshold</label>
                        <input type="text" name="stockAlertThreshold" placeholder="Alert Threshold" value={newItem.stockAlertThreshold} onChange={handleInputChange} className="border p-2 rounded-md w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (Optional)</label>
                        <input type="text" name="vendor" placeholder="Vendor" value={newItem.vendor} onChange={handleInputChange} className="border p-2 rounded-md w-full" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="bg-primary text-white p-2 rounded-md hover:bg-primary-dark w-full">Add Material</button>
                    </div>
                </form>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by material name..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table display of materials */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-light-gray">
                        <tr>
                            <th className="py-2 px-4 text-left">Material Name</th>
                            <th className="py-2 px-4 text-left">Quantity</th>
                            <th className="py-2 px-4 text-left">Price (per unit)</th>
                            <th className="py-2 px-4 text-left">Stock Alert Threshold</th>
                            <th className="py-2 px-4 text-left">Vendor</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
                            <tr key={material._id} className={`border-b ${material.quantity <= (material.stockAlertThreshold || 0) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                <td className="border px-4 py-2">{material.name}</td>
                                <td className="border px-4 py-2">{material.quantity}</td>
                                <td className="border px-4 py-2">₹{material.price}</td>
                                <td className="border px-4 py-2">{material.stockAlertThreshold || 'N/A'}</td>
                                <td className="border px-4 py-2">
                                    <div className="flex items-center">
                                        <span>{material.vendor || '-'}</span>
                                        {material.vendor && (
                                            <button 
                                                onClick={() => openVendorHistoryModal(material.name)}
                                                className="ml-2 text-blue-600 hover:text-blue-800"
                                                title="View Vendor History"
                                            >
                                                <LuHistory size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="border px-4 py-2">
                                    <button 
                                        onClick={() => openEditModal(material)} 
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        <LuPencil />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(material._id)} 
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <LuTrash2 />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4">No packing materials found. Add some materials to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && currentItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Packing Material</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <PackingMaterialNameSelector 
                                    value={currentItem.name} 
                                    onChange={(name) => setCurrentItem(prev => ({ ...prev, name }))} 
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Quantity</label>
                                <input type="text" name="quantity" value={currentItem.quantity} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Price</label>
                                <input type="text" name="price" value={currentItem.price} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Stock Alert Threshold</label>
                                <input type="text" name="stockAlertThreshold" value={currentItem.stockAlertThreshold} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Vendor</label>
                                <input type="text" name="vendor" value={currentItem.vendor || ''} onChange={handleModalChange} className="w-full px-3 py-2 border rounded-md" />
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
                                {vendorHistoryMaterialName 
                                    ? `Vendor History for "${vendorHistoryMaterialName}"` 
                                    : 'All Vendor History'}
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

export default PackingMaterials;