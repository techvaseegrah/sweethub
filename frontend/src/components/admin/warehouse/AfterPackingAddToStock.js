import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPackage, LuClock, LuCheckCircle, LuPlus } from 'react-icons/lu';
import MessageAlert from '../../MessageAlert';
import { LuCheck, LuX } from 'react-icons/lu';
import { formatDateWithTime } from '../../../utils/unitConversion';

const AfterPackingAddToStock = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemToAdd, setItemToAdd] = useState(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [usedByDate, setUsedByDate] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all after packing items and filter for pending ones (ready to add to stock)
            const response = await axios.get('/admin/warehouse/after-packing');
            const pendingItems = response.data.filter(item => item.status === 'Pending');
            setItems(pendingItems);
            setError('');
        } catch (err) {
            setError('Failed to fetch After Packing items ready for stock.');
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

    const handleAddToStock = async (item) => {
        setItemToAdd(item);
        setShowConfirmation(true);
    };

    const confirmAddToStock = async () => {
        if (!itemToAdd) return;

        try {
            const response = await axios.put(`/admin/warehouse/after-packing/${itemToAdd._id}/add-to-stock`, {
                expiryDate,
                usedByDate
            });
            setMessage(response.data.message);
            setShowConfirmation(false);
            setItemToAdd(null);
            setExpiryDate('');
            setUsedByDate('');
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add item to stock.');
            setShowConfirmation(false);
            setItemToAdd(null);
        }
    };

    const cancelAddToStock = () => {
        setShowConfirmation(false);
        setItemToAdd(null);
        setExpiryDate('');
        setUsedByDate('');
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
            <div className="text-red-500 font-medium">Loading items for stock...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">After Packing - Add to Stock</h1>
            </div>
            <p className="text-gray-600 mb-6">Add products from After Packing to the main stock inventory.</p>

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
                                <td className="border px-4 py-2">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">₹{item.price}</td>
                                <td className="border px-4 py-2">
                                    {formatDateWithTime(item.date)}
                                </td>
                                <td className="border px-4 py-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    <button
                                        onClick={() => handleAddToStock(item)}
                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm flex items-center gap-1"
                                    >
                                        <LuPlus className="w-4 h-4" />
                                        Add to Stock
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No items available to add to stock.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirm Adding to Stock</h3>
                        <p className="mb-4">
                            Are you sure you want to add this product to stock?
                            The quantity will be added to the View Products inventory with calculated expiry and use-by dates.
                        </p>
                        <p className="mb-4 font-semibold text-gray-700">
                            Product: {itemToAdd?.productName || itemToAdd?.sweetName} |
                            Quantity: {itemToAdd?.quantity} {itemToAdd?.unit}
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Expiry Date (dd-mm-yyyy)
                                </label>
                                <input
                                    type="date"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Used By Date (dd-mm-yyyy)
                                </label>
                                <input
                                    type="date"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={usedByDate}
                                    onChange={(e) => setUsedByDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelAddToStock}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 flex items-center gap-1"
                            >
                                <LuX className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddToStock}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                            >
                                <LuCheck className="w-4 h-4" />
                                Confirm Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AfterPackingAddToStock;