import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../../api/axios';
import { LuPencil, LuTrash2, LuHistory, LuDownload, LuBox, LuFileText, LuSearch } from 'react-icons/lu';
import * as XLSX from 'xlsx';

const StoreRoom = () => {
    const [view, setView] = useState('stock'); // 'stock' or 'records'
    const [items, setItems] = useState([]);
    const [vendorHistory, setVendorHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorSearch, setVendorSearch] = useState('');
    const [timeFilter, setTimeFilter] = useState('all'); // all, hour, today, yesterday, week, month

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const [stockRes, historyRes] = await Promise.all([
                axios.get('/admin/warehouse/store-room'),
                axios.get('/admin/warehouse/vendor-history')
            ]);
            setItems(stockRes.data);
            setVendorHistory(historyRes.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch store room data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = (id) => {
        const item = items.find(item => item._id === id);
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`/admin/warehouse/store-room/${itemToDelete._id}`);
            fetchItems();
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (err) {
            setError('Failed to delete item.');
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

    const handleUpdate = async () => {
        if (!currentItem) return;
        try {
            await axios.put(`/admin/warehouse/store-room/${currentItem._id}`, currentItem);
            setIsModalOpen(false);
            setCurrentItem(null);
            fetchItems();
        } catch (err) {
            setError('Failed to update item.');
        }
    };

    // Filter Logic
    const filteredStock = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (vendorSearch === '' || (item.vendor && item.vendor.toLowerCase().includes(vendorSearch.toLowerCase())))
        );
    }, [items, searchTerm, vendorSearch]);

    const filteredRecords = useMemo(() => {
        const now = new Date();
        return vendorHistory.filter(record => {
            const recordDate = new Date(record.receivedDate || record.createdAt);

            // Time Filter
            let matchesTime = true;
            if (timeFilter === 'hour') {
                const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
                matchesTime = recordDate >= oneHourAgo;
            } else if (timeFilter === 'today') {
                matchesTime = recordDate.toDateString() === now.toDateString();
            } else if (timeFilter === 'yesterday') {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                matchesTime = recordDate.toDateString() === yesterday.toDateString();
            } else if (timeFilter === 'week') {
                const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                matchesTime = recordDate >= oneWeekAgo;
            } else if (timeFilter === 'month') {
                matchesTime = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
            }

            // Vendor Filter
            const matchesVendor = vendorSearch === '' ||
                (record.vendorName && record.vendorName.toLowerCase().includes(vendorSearch.toLowerCase()));

            // Search Term (Material Name)
            const matchesSearch = searchTerm === '' ||
                (record.materialName && record.materialName.toLowerCase().includes(searchTerm.toLowerCase()));

            return matchesTime && matchesVendor && matchesSearch;
        });
    }, [vendorHistory, timeFilter, vendorSearch, searchTerm]);

    const totalPurchaseValue = useMemo(() => {
        return filteredRecords.reduce((sum, record) => sum + ((record.quantityReceived || 0) * (record.pricePerUnit || 0)), 0);
    }, [filteredRecords]);

    const downloadReport = () => {
        const dataToExport = filteredRecords.map(record => ({
            'Material Name': record.materialName,
            'Vendor Name': record.vendorName,
            'Quantity': record.quantityReceived,
            'Unit': record.unit,
            'Price Per Unit': record.pricePerUnit || 0,
            'Total Value': (record.quantityReceived * (record.pricePerUnit || 0)).toFixed(2),
            'Date': new Date(record.receivedDate).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Records");
        XLSX.writeFile(workbook, `StoreRoom_Report_${timeFilter}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return (
        <div className="p-4 flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <div className="text-red-500 font-medium">Loading store room data...</div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Store Room Management</h1>
                        <p className="text-gray-500 mt-1">Manage inventory and track purchase records</p>
                    </div>

                    <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                        <button
                            onClick={() => setView('stock')}
                            className={`flex items-center px-4 py-2 rounded-md transition-all ${view === 'stock' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <LuBox className="mr-2" /> Stock Inventory
                        </button>
                        <button
                            onClick={() => setView('records')}
                            className={`flex items-center px-4 py-2 rounded-md transition-all ${view === 'records' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <LuFileText className="mr-2" /> Purchase Records
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700">{error}</div>}

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Material</label>
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="e.g. Sugar, Milk..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Vendor</label>
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Vendor name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={vendorSearch}
                                    onChange={(e) => setVendorSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Time Period</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                            >
                                <option value="all">All Records</option>
                                <option value="hour">Per Hour</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={downloadReport}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                            >
                                <LuDownload className="mr-2" /> Download Report
                            </button>
                        </div>
                    </div>

                    {view === 'records' && (
                        <div className="mt-6 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <LuFileText size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Filtered Purchase Value</p>
                                    <p className="text-2xl font-bold text-gray-800">₹{totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-bold text-gray-800">{filteredRecords.length}</span> transaction(s)
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                {view === 'stock' ? (
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Material Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Unit)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry / Used By</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Material Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price/Unit</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">GST (%)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">GST Amt</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total (with GST)</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {view === 'stock' ? (
                                    filteredStock.length > 0 ? filteredStock.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-sm font-bold ${item.quantity <= item.stockAlertThreshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                                            <td className="px-6 py-4 text-gray-800 font-semibold">₹{item.price}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-800">{item.vendor || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{item.address || ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs">
                                                    <span className="text-gray-400">EXP:</span> {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                                                </div>
                                                <div className="text-xs">
                                                    <span className="text-gray-400">USE:</span> {item.usedByDate ? new Date(item.usedByDate).toLocaleDateString() : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <LuPencil />
                                                    </button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <LuTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No stock items found matching your search.</td>
                                        </tr>
                                    )
                                ) : (
                                    filteredRecords.length > 0 ? filteredRecords.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(record.receivedDate || record.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{record.materialName}</td>
                                            <td className="px-6 py-4 text-gray-600">{record.vendorName}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold">{record.quantityReceived}</span> {record.unit}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">₹{record.pricePerUnit || 0}</td>
                                            <td className="px-6 py-4 text-gray-600">{record.gstPercentage || 0}%</td>
                                            <td className="px-6 py-4 text-emerald-600 font-medium">₹{(record.gstAmount || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800">
                                                ₹{((record.quantityReceived * (record.pricePerUnit || 0)) + (record.gstAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No purchase records found for the selected filters.</td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && currentItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Edit Material Details</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Material Name</label>
                                <input type="text" name="name" value={currentItem.name} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Quantity</label>
                                <input type="text" name="quantity" value={currentItem.quantity} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Unit</label>
                                <input type="text" name="unit" value={currentItem.unit} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Price per Unit (₹)</label>
                                <input type="text" name="price" value={currentItem.price} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Alert Threshold</label>
                                <input type="text" name="stockAlertThreshold" value={currentItem.stockAlertThreshold} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">GST %</label>
                                <input type="text" name="gstPercentage" value={currentItem.gstPercentage || '0'} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Vendor Name</label>
                                <input type="text" name="vendor" value={currentItem.vendor || ''} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Vendor Address</label>
                                <input type="text" name="address" value={currentItem.address || ''} onChange={handleModalChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={currentItem.expiryDate ? new Date(currentItem.expiryDate).toISOString().split('T')[0] : ''}
                                    onChange={handleModalChange}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Used By Date</label>
                                <input
                                    type="date"
                                    name="usedByDate"
                                    value={currentItem.usedByDate ? new Date(currentItem.usedByDate).toISOString().split('T')[0] : ''}
                                    onChange={handleModalChange}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleUpdate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-md transition-all">Update Stock</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <LuTrash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Material?</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-700">{itemToDelete.name}</span>?
                                This will remove it from current stock permanently.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-colors"
                                >
                                    Delete Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreRoom;