import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuCheck, LuDownload, LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import CreateBeforePackingAccountModal from './CreateBeforePackingAccountModal';
import AddFinishedProductModal from './AddFinishedProductModal';
import CustomModal from '../../CustomModal';
import { AuthContext } from '../../../context/AuthContext';
import { formatDateWithTime, getBatchId } from '../../../utils/unitConversion';
import * as XLSX from 'xlsx';

const BeforePacking = () => {
    const { authState } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showManageMode, setShowManageMode] = useState(false);
    const [viewMode, setViewMode] = useState('OWN'); // 'OWN' or 'FINISHED'
    const [showAddFinishedProductModal, setShowAddFinishedProductModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [itemToComplete, setItemToComplete] = useState(null);

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
            setCategories(catRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error("Failed to fetch auxiliary data", error);
        }
    };

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
        fetchCategoriesAndProducts();
    }, [fetchItems]);

    const filteredItems = items
        .filter(item => {
            const productName = (item.productName || item.sweetName || '').toLowerCase();
            const matchesSearch = productName.includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            const itemSource = item.source || 'OWN';
            if (viewMode === 'OWN' && itemSource !== 'OWN') return false;
            if (viewMode === 'FINISHED' && itemSource !== 'FINISHED PRODUCT') return false;

            // Category filter
            if (selectedCategory) {
                const product = products.find(p => p.name.toLowerCase() === productName);
                const itemCategoryId = product?.category?._id || product?.category || '';
                if (itemCategoryId !== selectedCategory) return false;
            }

            const itemDate = new Date(item.date);
            const now = new Date();

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
            } else if (timeFilter !== 'all') {
                // Preset time filters (only applied if custom date range is not set)
                if (timeFilter === 'hour') {
                    if ((now - itemDate) > 60 * 60 * 1000) return false;
                } else if (timeFilter === 'today') {
                    if (itemDate.toDateString() !== now.toDateString()) return false;
                } else if (timeFilter === 'yesterday') {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (itemDate.toDateString() !== yesterday.toDateString()) return false;
                } else if (timeFilter === 'week') {
                    if ((now - itemDate) > 7 * 24 * 60 * 60 * 1000) return false;
                } else if (timeFilter === 'month') {
                    if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) return false;
                }
            }

            return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleDownloadExcel = () => {
        const dataToExport = filteredItems.map(item => ({
            'Batch ID': getBatchId(item.scheduleId, item.batchId),
            'Product Name': item.productName || item.sweetName,
            'Quantity': item.quantity,
            'Total Quantity': item.totalQuantity || item.quantity,
            'Unit': item.unit,
            'Date': formatDateWithTime(item.date),
            'Status': item.status
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Before Packing');
        XLSX.writeFile(wb, `Before_Packing_Report_${timeFilter}.xlsx`);
    };

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
        setShowCompleteConfirm(true);
    };

    const handleFinalComplete = async () => {
        if (!itemToComplete) return;
        await handleStatusChange(itemToComplete._id, 'Completed', itemToComplete.quantity);
        setShowCompleteConfirm(false);
        setItemToComplete(null);
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const response = await axios.delete(`/admin/warehouse/before-packing/${itemToDelete._id}`);
            setMessage(response.data.message);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete item.');
        }
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
                <div className="flex items-center gap-4">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-700"
                    >
                        <option value="all">All Records</option>
                        <option value="hour">Per Hour</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button
                        onClick={handleDownloadExcel}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                        title="Download Excel"
                    >
                        <LuDownload className="w-4 h-4" />
                        Download
                    </button>
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
            </div>

            <div className="flex justify-between flex-wrap gap-4 mb-6">
                <p className="text-gray-600">Manage products that need pre-packing processing.</p>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('OWN')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'OWN' ? 'bg-white text-purple-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        OWN Products
                    </button>
                    <button
                        onClick={() => setViewMode('FINISHED')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'FINISHED' ? 'bg-white text-purple-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Finished Products
                    </button>
                    {viewMode === 'FINISHED' && (
                        <button
                            onClick={() => setShowAddFinishedProductModal(true)}
                            className="ml-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-purple-700 transition-colors text-sm flex items-center"
                        >
                            + Add Finished Product
                        </button>
                    )}
                </div>
            </div>

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
                        <option value="">All Categories</option>
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
                            <th className="py-2 px-4 text-left">Quantity / Total</th>
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
                                <td className="border px-4 py-2 font-medium">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">
                                    {item.quantity} / {item.totalQuantity || item.quantity}
                                </td>
                                <td className="border px-4 py-2">{item.unit}</td>
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
                                    <div className="flex items-center gap-2">
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
                                        <button
                                            onClick={() => confirmDelete(item)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center"
                                            title="Delete Item"
                                        >
                                            <LuTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fadeIn">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <LuTriangleAlert className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-semibold">{itemToDelete?.productName || itemToDelete?.sweetName}</span>?
                                This action will also automatically delete the corresponding item in After Packing. This action cannot be undone.
                            </p>
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setItemToDelete(null);
                                    }}
                                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    <LuTrash2 className="w-5 h-5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Confirmation Modal */}
            {showCompleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fadeIn">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <LuCheck className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Processing</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to mark <span className="font-semibold">{itemToComplete?.productName || itemToComplete?.sweetName}</span> as completed?
                                This will move the quantity to the packing stage.
                            </p>
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => {
                                        setShowCompleteConfirm(false);
                                        setItemToComplete(null);
                                    }}
                                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
                                >
                                    No, Keep Pending
                                </button>
                                <button
                                    onClick={handleFinalComplete}
                                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    <LuCheck className="w-5 h-5" />
                                    Yes, Complete
                                </button>
                            </div>
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

            {/* Add Finished Product Modal */}
            {showAddFinishedProductModal && (
                <CustomModal
                    isOpen={showAddFinishedProductModal}
                    onClose={() => setShowAddFinishedProductModal(false)}
                    title="Add Finished Product to Before Packing"
                >
                    <AddFinishedProductModal
                        onClose={() => setShowAddFinishedProductModal(false)}
                        onSuccess={() => {
                            setShowAddFinishedProductModal(false);
                            setMessage('Finished product added successfully');
                            fetchItems();
                        }}
                    />
                </CustomModal>
            )}
        </div>
    );
};

export default BeforePacking;