import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuPackage, LuClock, LuCheckCircle } from 'react-icons/lu';
import MessageAlert from '../../MessageAlert';
import { formatDateWithTime, getBatchId } from '../../../utils/unitConversion';
import { AuthContext } from '../../../context/AuthContext';

const AfterPackingPendingItems = () => {
    const { authState } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const fetchCategoriesAndProducts = async () => {
        try {
            const [catRes, prodRes] = await Promise.all([
                axios.get('/admin/categories'),
                axios.get('/admin/products')
            ]);
            let catData = catRes.data;
            if (authState?.role !== 'admin' && authState?.allowedCategories && authState.allowedCategories.length > 0) {
                const allowedIds = authState.allowedCategories.map(cat => typeof cat === 'object' ? cat._id : cat);
                catData = catData.filter(cat => allowedIds.includes(cat._id));
            }
            setCategories(catData);

            let prodData = prodRes.data;
            if (authState?.role !== 'admin' && authState?.allowedCategories && authState.allowedCategories.length > 0) {
                const allowedIds = authState.allowedCategories.map(cat => typeof cat === 'object' ? cat._id : cat);
                prodData = prodData.filter(p => allowedIds.includes(p.category?._id || p.category));
            }
            setProducts(prodData);
        } catch (error) {
            console.error("Failed to fetch auxiliary data", error);
        }
    };

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all after packing items and filter for pending ones
            const response = await axios.get('/admin/warehouse/after-packing');
            const pendingItems = response.data.filter(item => item.status === 'Pending');
            setItems(pendingItems);
            setError('');
        } catch (err) {
            setError('Failed to fetch After Packing pending items.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        fetchCategoriesAndProducts();
    }, [fetchItems]);

    const filteredItems = items
        .filter(item => {
            const productName = (item.productName || item.sweetName || '').toLowerCase();
            const matchesSearch = productName.includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Category filter
            if (selectedCategory) {
                const product = products.find(p => p.name.toLowerCase() === productName);
                const itemCategoryId = product?.category?._id || product?.category || '';
                if (itemCategoryId !== selectedCategory) return false;
            } else if (authState?.role !== 'admin' && authState?.allowedCategories && authState.allowedCategories.length > 0) {
                // If no filter selected but restricted, only show items belonging to allowed categories
                const allowedIds = authState.allowedCategories.map(cat => typeof cat === 'object' ? cat._id : cat);
                const product = products.find(p => p.name.toLowerCase() === productName);
                const itemCategoryId = product?.category?._id || product?.category || '';
                if (!allowedIds.includes(itemCategoryId)) return false;
            }

            // Date Range filter
            if (startDate || endDate) {
                const itemDateOnly = new Date(item.date);
                itemDateOnly.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (itemDateOnly < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(0, 0, 0, 0);
                    if (itemDateOnly > end) return false;
                }
            }

            return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (loading) return (
        <div className="p-4 flex flex-col items-center justify-center">
            <div className="relative flex justify-center items-center mb-4">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <img
                    src="/sweethub-logo.png"
                    className="absolute w-8 h-8"
                    alt="logo"
                />
            </div>
            <div className="text-blue-600 font-medium">Loading Pending Items...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">After Packing - Pending Items</h1>
            </div>
            <p className="text-gray-600 mb-6">View all pending items in the After Packing stage.</p>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {(!authState?.allowedCategories || authState.allowedCategories.length === 0 || authState?.role === 'admin') && (
                            <option value="">All Categories</option>
                        )}
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-light-gray">
                        <tr>
                            <th className="py-2 px-4 text-left">Batch ID</th>
                            <th className="py-2 px-4 text-left">Product Name</th>
                            <th className="py-2 px-4 text-left">Quantity</th>
                            <th className="py-2 px-4 text-left">Unit</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2 font-medium">{getBatchId(item.scheduleId, item.batchId)}</td>
                                <td className="border px-4 py-2">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">
                                    {formatDateWithTime(item.date)}
                                </td>
                                <td className="border px-4 py-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    <span className="text-gray-500 text-sm">
                                        Ready to Add to Stock
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No pending items found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AfterPackingPendingItems;