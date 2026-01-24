import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuCheck, LuClock, LuPackage } from 'react-icons/lu';
import CreateAfterPackingAccountModal from './CreateAfterPackingAccountModal';
import CustomModal from '../../CustomModal';
import { AuthContext } from '../../../context/AuthContext';

const AfterPacking = () => {
    const { authState } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemToComplete, setItemToComplete] = useState(null);
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showManageMode, setShowManageMode] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/after-packing');
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch After Packing items.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredItems = items
        .filter(item =>
            item.sweetName && item.sweetName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleStatusChange = async (itemId, newStatus) => {
        try {
            const response = await axios.put(`/admin/warehouse/after-packing/${itemId}/status`, {
                status: newStatus
            });
            setMessage(response.data.message);
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update item status.');
        }
    };

    const handleAddToStock = async (itemId) => {
        try {
            const response = await axios.put(`/admin/warehouse/after-packing/${itemId}/add-to-stock`);
            setMessage(response.data.message);
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add item to stock.');
        }
    };

    const confirmComplete = (item) => {
        setItemToComplete(item);
        setShowConfirmation(true);
    };

    const handleConfirmComplete = () => {
        if (itemToComplete) {
            handleAddToStock(itemToComplete._id);
            setShowConfirmation(false);
            setItemToComplete(null);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmation(false);
        setItemToComplete(null);
    };

    if (loading) return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading After Packing items...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">After Packing</h1>
                {/* Show Create Account button only for admin users (not for after-packing-only users) */}
                {authState?.isAuthenticated && authState?.role === 'admin' && (
                    <button 
                        onClick={() => {
                            setEditingAccount(null);  // Ensure we're in create mode
                            setShowManageMode(false);  // Set to open modal in create mode
                            setShowCreateAccountModal(true);
                        }}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Create Account
                    </button>
                )}
            </div>
            <p className="text-gray-600 mb-6">Manage products ready for final packaging and stock addition.</p>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search items..."
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
                        <th className="py-2 px-4 text-left">Price</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Actions</th>
                    </tr>
                </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{item.sweetName}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.price}</td>
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
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm flex items-center gap-1"
                                        >
                                            <LuPackage className="w-4 h-4" />
                                            Add to Stock
                                        </button>
                                    ) : (
                                        <span className="text-gray-500 text-sm flex items-center gap-1">
                                            <LuCheck className="w-4 h-4" />
                                            Added to Stock
                                        </span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No items found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirm Stock Addition</h3>
                        <p className="mb-4">
                            Are you sure you want to add this product to stock? 
                            The quantity will be added to the View Products inventory.
                        </p>
                        <p className="mb-4 font-semibold">
                            Product: {itemToComplete?.sweetName} | 
                            Quantity: {itemToComplete?.quantity} {itemToComplete?.unit}
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

            {/* Create Account Modal */}
            {showCreateAccountModal && (
                <CustomModal
                    isOpen={showCreateAccountModal}
                    onClose={() => {
                        setShowCreateAccountModal(false);
                        setEditingAccount(null);  // Reset editing state when modal is closed
                    }}
                    title={editingAccount ? "Edit After Packing Account" : "Create After Packing Account"}
                >
                    <CreateAfterPackingAccountModal 
                        onClose={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when modal is closed
                            setShowManageMode(false);  // Reset manage mode
                        }}
                        onAccountCreated={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when account is created
                            setShowManageMode(false);  // Reset manage mode
                            // Optionally refresh data or show success message
                        }}
                        editingAccount={editingAccount}
                        showManageAccountsInitial={showManageMode}
                    />
                </CustomModal>
            )}
        </div>
    );
};

export default AfterPacking;