import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LuFileText,
    LuDownload,
    LuCalendar,
    LuFilter,
    LuSearch,
    LuIndianRupee,
    LuBox,
    LuTruck,
    LuChevronDown,
    LuLayoutList
} from 'react-icons/lu';
import axios from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const PurchaseReport = () => {
    const [loading, setLoading] = useState(true);
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [viewType, setViewType] = useState('list'); // 'list', 'vendor', or 'item'

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorSearch, setVendorSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchPurchaseHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/vendor-history');
            setPurchaseHistory(response.data);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            toast.error('Failed to fetch purchase data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPurchaseHistory();
    }, [fetchPurchaseHistory]);

    // Helper to get consistent data from records
    const getRecordDetails = (record) => {
        // Fallback for field names
        const qty = Number(record.quantityReceived || record.quantity || 0);
        const price = Number(record.pricePerUnit || record.price || 0);
        return {
            qty,
            price,
            total: qty * price,
            date: record.receivedDate || record.createdAt
        };
    };

    // Filtering Logic
    const filteredRecords = useMemo(() => {
        return purchaseHistory.filter(record => {
            const details = getRecordDetails(record);
            const recordDate = parseISO(details.date);
            const start = parseISO(dateRange.startDate + 'T00:00:00');
            const end = parseISO(dateRange.endDate + 'T23:59:59');

            const matchesDate = isWithinInterval(recordDate, { start, end });
            const matchesSearch = record.materialName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesVendor = (record.vendorName || record.vendor)?.toLowerCase().includes(vendorSearch.toLowerCase());

            return matchesDate && matchesSearch && matchesVendor;
        });
    }, [purchaseHistory, dateRange, searchTerm, vendorSearch]);

    // Statistics Calculation
    const stats = useMemo(() => {
        const totalCost = filteredRecords.reduce((sum, r) => sum + getRecordDetails(r).total, 0);
        const uniqueItems = new Set(filteredRecords.map(r => r.materialName)).size;
        const uniqueVendors = new Set(filteredRecords.map(r => r.vendorName || r.vendor)).size;
        const totalOrders = filteredRecords.length;

        return [
            { label: 'Total Purchase Cost', value: `₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: LuIndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Unique Materials', value: uniqueItems, icon: LuBox, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Active Suppliers', value: uniqueVendors, icon: LuTruck, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Total Transactions', value: totalOrders, icon: LuFileText, color: 'text-red-500', bg: 'bg-red-50' },
        ];
    }, [filteredRecords]);

    // Vendor-wise Aggregation
    const vendorWiseData = useMemo(() => {
        const aggregation = filteredRecords.reduce((acc, record) => {
            const vendor = record.vendorName || record.vendor || 'Unknown Supplier';
            const details = getRecordDetails(record);
            if (!acc[vendor]) {
                acc[vendor] = {
                    name: vendor,
                    totalCost: 0,
                    itemCount: 0,
                    materials: new Set(),
                    lastPurchase: null
                };
            }
            acc[vendor].totalCost += details.total;
            acc[vendor].itemCount += 1;
            acc[vendor].materials.add(record.materialName);

            const currentRecordDate = new Date(details.date);
            if (!acc[vendor].lastPurchase || currentRecordDate > new Date(acc[vendor].lastPurchase)) {
                acc[vendor].lastPurchase = details.date;
            }

            return acc;
        }, {});

        return Object.values(aggregation).sort((a, b) => b.totalCost - a.totalCost);
    }, [filteredRecords]);

    // Item-wise Aggregation (e.g. Potato, Oil...)
    const itemWiseData = useMemo(() => {
        const aggregation = filteredRecords.reduce((acc, record) => {
            const item = record.materialName || 'Unknown Material';
            const details = getRecordDetails(record);
            if (!acc[item]) {
                acc[item] = {
                    name: item,
                    totalCost: 0,
                    totalQty: 0,
                    unit: record.unit || 'units',
                    orderCount: 0,
                    avgPrice: 0,
                    suppliers: new Set()
                };
            }
            acc[item].totalCost += details.total;
            acc[item].totalQty += details.qty;
            acc[item].orderCount += 1;
            acc[item].suppliers.add(record.vendorName || record.vendor || 'Unknown');

            return acc;
        }, {});

        return Object.values(aggregation).sort((a, b) => b.totalCost - a.totalCost);
    }, [filteredRecords]);

    const handleExportExcel = () => {
        if (filteredRecords.length === 0) {
            toast.error("No data to export");
            return;
        }

        const dataToExport = filteredRecords.map(record => {
            const details = getRecordDetails(record);
            return {
                'Date': format(parseISO(details.date), 'dd-MM-yyyy HH:mm'),
                'Type': record.materialType || 'Raw Material',
                'Material Name': record.materialName,
                'Supplier': record.vendorName || record.vendor,
                'Quantity': details.qty,
                'Unit': record.unit,
                'Cost/Unit': details.price,
                'Total Cost': details.total.toFixed(2)
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Report");
        XLSX.writeFile(workbook, `Purchase_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
        toast.success("Excel report exported");
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Purchase Report</h1>
                    <p className="text-gray-500 mt-1">Detailed analysis of raw materials and procurement costs</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                        <button
                            onClick={() => setViewType('list')}
                            className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <LuLayoutList className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewType('item')}
                            className={`p-2 rounded-lg transition-all ${viewType === 'item' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Item-wise View"
                        >
                            <LuBox className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewType('vendor')}
                            className={`p-2 rounded-lg transition-all ${viewType === 'vendor' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Supplier-wise View"
                        >
                            <LuTruck className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 shadow-sm ${showFilters ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200 hover:border-red-500'}`}
                    >
                        <LuFilter className="w-4 h-4" />
                        <span className="font-semibold text-sm">Filters</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-semibold text-sm"
                    >
                        <LuDownload className="w-4 h-4" />
                        <span>Excel</span>
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                                <div className="relative">
                                    <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                                <div className="relative">
                                    <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Material</label>
                                <div className="relative">
                                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Potato, Oil..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Supplier</label>
                                <div className="relative">
                                    <LuTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Vendor name..."
                                        value={vendorSearch}
                                        onChange={(e) => setVendorSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"
                    >
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 leading-none">
                                {loading ? <div className="h-6 w-20 bg-gray-100 animate-pulse rounded" /> : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            {viewType === 'list' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                <LuLayoutList className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Recent Purchase Transactions</h2>
                        </div>
                        <div className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">
                            {filteredRecords.length} records found
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Material</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Cost/Unit</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map((record, idx) => {
                                        const details = getRecordDetails(record);
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 lg:transition-colors group">
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {format(parseISO(details.date), 'dd MMM yyyy')}
                                                    <div className="text-[10px] text-gray-300">{details.date ? format(new Date(details.date), 'hh:mm a') : ''}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${record.materialType === 'Packing Material' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                        {record.materialType || 'Raw Material'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 uppercase tracking-tight">{record.materialName}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-600 italic">
                                                    {record.vendorName || record.vendor || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100">
                                                        {details.qty} {record.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    {details.price > 0 ? (
                                                        <span className="text-gray-600">₹{details.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    ) : (
                                                        <span className="text-red-400 text-xs italic" title="Price not entered during procurement">₹0.00*</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-extrabold inline-block px-3 py-1 rounded-lg border ${details.total > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                                                        ₹{details.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                                <LuBox className="w-10 h-10 text-gray-200" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-400">No Purchase Records</h3>
                                            <p className="text-gray-300">Try changing filters or adding store room items</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewType === 'item' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-64" />
                        ))
                    ) : itemWiseData.length > 0 ? (
                        itemWiseData.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-red-500/20 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-red-50 rounded-xl text-red-500">
                                        <LuBox className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Procurement</div>
                                        <div className="text-2xl font-black text-emerald-600">₹{item.totalCost.toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">{item.name}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-2">Total Quantity</p>
                                        <p className="text-md font-extrabold text-gray-700">{item.totalQty} {item.unit}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-2">Transactions</p>
                                        <p className="text-md font-extrabold text-gray-700">{item.orderCount} Orders</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[...item.suppliers].slice(0, 3).map((s, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[10px] font-bold text-red-500 shadow-sm" title={s}>
                                                {s.charAt(0)}
                                            </div>
                                        ))}
                                        {item.suppliers.size > 3 && <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-red-500">+{item.suppliers.size - 3}</div>}
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Avg Price: ₹{(item.totalCost / (item.totalQty || 1)).toFixed(2)} / {item.unit}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-100">
                            <LuSearch className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-black text-xl">No items found matching filters</p>
                        </div>
                    )}
                </div>
            )}

            {viewType === 'vendor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm animate-pulse h-64" />
                        ))
                    ) : vendorWiseData.length > 0 ? (
                        vendorWiseData.map((vendor, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-red-500/30 hover:shadow-2xl transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                        <LuTruck className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-gray-900 leading-none">₹{vendor.totalCost.toLocaleString('en-IN')}</div>
                                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Total Value</div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 mb-2 truncate break-all group-hover:text-red-600 transition-colors uppercase tracking-tighter">{vendor.name}</h3>
                                <div className="flex items-center gap-4 py-4 border-y border-dashed border-gray-100 my-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Orders</p>
                                        <p className="font-extrabold text-gray-700">{vendor.itemCount}</p>
                                    </div>
                                    <div className="flex-1 border-x border-gray-100 px-4">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Materials</p>
                                        <p className="font-extrabold text-gray-700">{vendor.materials.size}</p>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                                    <span className="flex items-center gap-1 uppercase tracking-tighter">
                                        <LuCalendar className="w-3 h-3" />
                                        Last: {vendor.lastPurchase ? format(new Date(vendor.lastPurchase), 'dd MMM yy') : 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1 uppercase tracking-tighter text-blue-500 hover:bg-blue-50 rounded px-2 py-1 cursor-pointer">
                                        View All
                                        <LuChevronDown className="-rotate-90 w-3 h-3" />
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-4 border-dashed border-gray-50">
                            <LuTruck className="w-20 h-20 text-gray-50 mx-auto mb-4" />
                            <p className="text-gray-300 font-black text-2xl uppercase italic">No supplier history found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PurchaseReport;
