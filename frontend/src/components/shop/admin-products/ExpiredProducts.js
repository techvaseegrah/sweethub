import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuCalendar, LuPackage, LuRefreshCw } from 'react-icons/lu';

const ExpiredProducts = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/shop/products/expired');
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch expired products.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Calculate days remaining until expiry
    const calculateDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Determine if item is expired or near expiry
    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        const daysRemaining = calculateDaysRemaining(expiryDate);
        return daysRemaining !== null && daysRemaining <= 0;
    };

    const isNearExpiry = (expiryDate) => {
        if (!expiryDate) return false;
        const daysRemaining = calculateDaysRemaining(expiryDate);
        return daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7; // Within 7 days
    };

    const hasExpiryDate = (expiryDate) => {
        return !!expiryDate;
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'No expiry date';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Get status color based on expiry
    const getStatusColor = (expiryDate) => {
        if (isExpired(expiryDate)) {
            return 'text-red-600 bg-red-50';
        } else if (isNearExpiry(expiryDate)) {
            return 'text-orange-600 bg-orange-50';
        }
        return 'text-gray-600 bg-gray-50';
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
            <div className="text-red-500 font-medium">Loading Expired Products...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <LuPackage className="text-red-500 text-2xl mr-3" />
                    <h1 className="text-2xl font-bold text-gray-800">Expire Products</h1>
                </div>
                <button 
                    onClick={fetchItems}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <LuRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
            
            {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded-md">{error}</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">SKU</th>
                            <th className="py-3 px-4 text-left">Category</th>
                            <th className="py-3 px-4 text-left">Stock Level</th>
                            <th className="py-3 px-4 text-left">Unit</th>
                            <th className="py-3 px-4 text-left">Expiry Date</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Days Remaining</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <tr 
                                    key={item._id} 
                                    className={`border-b border-gray-200 hover:bg-gray-50 ${isExpired(item.expiryDate) ? 'bg-red-50' : isNearExpiry(item.expiryDate) ? 'bg-orange-50' : ''}`}
                                >
                                    <td className="py-3 px-4 font-medium">{item.name}</td>
                                    <td className="py-3 px-4">{item.sku}</td>
                                    <td className="py-3 px-4">{item.category?.name || 'N/A'}</td>
                                    <td className="py-3 px-4">{item.stockLevel}</td>
                                    <td className="py-3 px-4">{item.prices && item.prices.length > 0 ? item.prices[0].unit : 'N/A'}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.expiryDate)}`}>
                                            <LuCalendar className="mr-1" />
                                            {formatDate(item.expiryDate)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.expiryDate)}`}>
                                            {isExpired(item.expiryDate) ? (
                                                <>
                                                    Expired
                                                </>
                                            ) : isNearExpiry(item.expiryDate) ? (
                                                <>
                                                    Near Expiry
                                                </>
                                            ) : (
                                                <>Good</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {hasExpiryDate(item.expiryDate) ? (
                                            <span className={`font-semibold ${isExpired(item.expiryDate) ? 'text-red-600' : isNearExpiry(item.expiryDate) ? 'text-orange-600' : 'text-green-600'}`}>
                                                {calculateDaysRemaining(item.expiryDate)} days
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-gray-500">No expiry date</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <LuPackage className="text-gray-400 text-4xl mb-2" />
                                        <p>No expired or near expiry products found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    Legend & Sorting Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="font-medium mb-2">Status Indicators:</div>
                        <div className="space-y-1">
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50 mr-2">
                                    Expired
                                </span>
                                <span>Products that have passed expiry date</span>
                            </div>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-50 mr-2">
                                    Near Expiry
                                </span>
                                <span>Products expiring within 7 days</span>
                            </div>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-50 mr-2">
                                    Good
                                </span>
                                <span>Products with good expiry status</span>
                            </div>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-500 bg-gray-100 mr-2">
                                    No expiry date
                                </span>
                                <span>Products without expiry dates (sorted last)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="font-medium mb-2">Sorting Order:</div>
                        <div className="space-y-1 text-gray-700">
                            <div>1. Expired products (most urgent first)</div>
                            <div>2. Near expiry products (soonest first)</div>
                            <div>3. Good expiry products (soonest first)</div>
                            <div>4. Products without expiry dates (last)</div>
                            <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                                This view shows all products sorted by expiry urgency.
                                Products without expiry dates are displayed at the bottom.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpiredProducts;