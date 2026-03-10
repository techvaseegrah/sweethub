import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuCheck } from 'react-icons/lu';
import CreateBeforePackingAccountModal from './CreateBeforePackingAccountModal';
import CustomModal from '../../CustomModal';
import { AuthContext } from '../../../context/AuthContext';
import { formatDateWithTime, convertUnit, getRelatedUnits } from '../../../utils/unitConversion';

const BeforePacking = () => {
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
    const [completedQty, setCompletedQty] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/before-packing');
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch Before Packing items.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredItems = items
        .filter(item =>
            (item.productName || item.sweetName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleStatusChange = async (itemId, newStatus, qty) => {
        try {
            const response = await axios.put(`/admin/warehouse/before-packing/${itemId}/status`, {
                status: newStatus,
                completedQty: qty
            });
            setMessage(response.data.message);
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update item status.');
        }
    };

    const confirmComplete = (item) => {
        setItemToComplete(item);
        setCompletedQty(item.quantity);
        setSelectedUnit(item.unit);
        setShowConfirmation(true);
    };

    const handleConfirmComplete = () => {
        if (itemToComplete && completedQty && selectedUnit) {
            try {
                const inputQty = Number(completedQty);
                if (inputQty <= 0) {
                    setError('Please enter a valid quantity.');
                    return;
                }

                // Convert input quantity to the original unit for comparison and processing
                const convertedQty = convertUnit(inputQty, selectedUnit, itemToComplete.unit);

                // Use a small epsilon for floating point comparison
                if (convertedQty > itemToComplete.quantity + 0.000001) {
                    setError(`Quantity cannot exceed remaining amount (${itemToComplete.quantity} ${itemToComplete.unit}).`);
                    return;
                }

                const status = Math.abs(convertedQty - itemToComplete.quantity) < 0.000001 ? 'Completed' : 'Partial';
                handleStatusChange(itemToComplete._id, status, convertedQty);
                setShowConfirmation(false);
                setItemToComplete(null);
                setCompletedQty('');
                setSelectedUnit('');
            } catch (err) {
                setError('Unit conversion error: ' + err.message);
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmation(false);
        setItemToComplete(null);
        setCompletedQty('');
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
            <div className="text-red-500 font-medium">Loading Before Packing items...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Before Packing</h1>
                {/* Show Create Account button only for admin users (not for before-packing-only users) */}
                {authState?.isAuthenticated && authState?.role === 'admin' && (
                    <button
                        onClick={() => {
                            setEditingAccount(null);  // Ensure we're in create mode
                            setShowManageMode(false);  // Set to open modal in create mode
                            setShowCreateAccountModal(true);
                        }}
                        className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Create Account
                    </button>
                )}
            </div>
            <p className="text-gray-600 mb-6">Manage products that need pre-packing processing.</p>

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
                            <th className="py-2 px-4 text-left">Quantity / Total</th>
                            <th className="py-2 px-4 text-left">Unit</th>
                            <th className="py-2 px-4 text-left">Price (Unit)</th>
                            <th className="py-2 px-4 text-left">Total Value</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2 font-medium">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">
                                    {item.quantity} / {item.totalQuantity || item.quantity}
                                </td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.price}</td>
                                <td className="border px-4 py-2 text-blue-600 font-semibold">
                                    ₹{(item.quantity * item.price).toFixed(2)}
                                </td>
                                <td className="border px-4 py-2">
                                    {formatDateWithTime(item.date)}
                                </td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.status === 'Partial'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    {item.status !== 'Completed' ? (
                                        <button
                                            onClick={() => confirmComplete(item)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                                        >
                                            <LuCheck className="w-4 h-4" />
                                            Complete {item.status === 'Partial' ? 'More' : ''}
                                        </button>
                                    ) : (
                                        <span className="text-gray-500 text-sm flex items-center gap-1">
                                            <LuCheck className="w-4 h-4" />
                                            Completed
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
                        <h3 className="text-lg font-bold mb-4">Complete Packing</h3>
                        <div className="mb-4 text-sm text-gray-600">
                            <p className="font-semibold text-gray-800">Product: {itemToComplete?.productName || itemToComplete?.sweetName}</p>
                            <p>Total Original: {itemToComplete?.totalQuantity || itemToComplete?.quantity} {itemToComplete?.unit}</p>
                            <p>Current Remaining: {itemToComplete?.quantity} {itemToComplete?.unit}</p>
                            <p>Unit Price: ₹{itemToComplete?.price} / {itemToComplete?.unit}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={completedQty}
                                    onChange={(e) => setCompletedQty(e.target.value)}
                                    min="0"
                                    step="any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                >
                                    {getRelatedUnits(itemToComplete?.unit).map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {completedQty && selectedUnit && itemToComplete && (
                            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm font-semibold text-blue-800">
                                    Total Value: ₹
                                    {(convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit) * itemToComplete.price).toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    (Converted Quantity: {convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit).toFixed(3)} {itemToComplete.unit})
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelConfirm}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                            >
                                Update Status
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
                    title={editingAccount ? "Edit Before Packing Account" : "Create Before Packing Account"}
                >
                    <CreateBeforePackingAccountModal
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

export default BeforePacking;