import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    LuFileText,
    LuDownload,
    LuCalendar,
    LuFilter,
    LuSearch,
    LuTrendingUp,
    LuUsers,
    LuBox,
    LuIndianRupee,
    LuStore,
    LuChevronDown,
    LuLayoutGrid
} from 'react-icons/lu';
import axios from '../../../api/axios';
import { AuthContext } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSalesReportExcel } from '../../../utils/generateSalesReportExcel';

const SalesReport = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState({
        stats: { totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0 },
        productSales: [],
        customerSales: [],
        shopSummaries: []
    });

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [selectedShop, setSelectedShop] = useState('all');
    const [shops, setShops] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Get role to determine API endpoint
    const { authState } = useContext(AuthContext);
    const isShop = authState?.role === 'shop';
    const isAdmin = authState?.role === 'admin';

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const response = await axios.get('/admin/shops');
            setShops(response.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    }, [isAdmin]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = isShop ? '/shop/report/sales' : '/admin/bills/report/sales';
            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                ...(isAdmin && { shopId: selectedShop })
            };

            const response = await axios.get(endpoint, { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching sales report:', error);
            toast.error('Failed to fetch sales report');
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedShop, isShop, isAdmin]);

    const fetchCategoriesAndProducts = useCallback(async () => {
        try {
            const endpointCategories = isShop ? '/shop/categories/all' : '/admin/categories';
            const endpointProducts = isShop ? '/shop/products' : '/admin/products';

            const [categoriesRes, productsRes] = await Promise.all([
                axios.get(endpointCategories),
                axios.get(endpointProducts)
            ]);
            setCategories(categoriesRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching categories and products:', error);
        }
    }, [isShop]);

    useEffect(() => {
        fetchShops();
        fetchCategoriesAndProducts();
    }, [fetchShops, fetchCategoriesAndProducts]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const productCategoryMap = {};
    products.forEach(p => {
        productCategoryMap[p.name] = p.category?._id || p.category;
    });

    const filteredProductSales = reportData.productSales.filter(p => {
        const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const pCategory = p.category || productCategoryMap[p.productName];
        const matchesCategory = selectedCategory === 'all' || pCategory === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const displayRevenue = selectedCategory === 'all'
        ? reportData.stats.totalRevenue
        : filteredProductSales.reduce((acc, item) => acc + item.totalRevenue, 0);

    const displayItemsSold = selectedCategory === 'all'
        ? reportData.stats.totalItemsSold
        : filteredProductSales.reduce((acc, item) => acc + item.totalQuantity, 0);

    const handleExportExcel = () => {
        if (reportData.productSales.length === 0) {
            toast.error("No data to export");
            return;
        }

        const shopName = isAdmin
            ? (selectedShop === 'all' ? 'All Shops' : (selectedShop === 'admin' ? 'Admin Factory' : (shops.find(s => s._id === selectedShop)?.name || 'Shop')))
            : 'Shop Outlet';

        generateSalesReportExcel(reportData, dateRange, shopName);
        toast.success("Excel report generating...");
    };

    const stats = [
        { label: 'Total Revenue', value: `₹${displayRevenue.toLocaleString()}`, icon: LuIndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Total Transactions', value: reportData.stats.totalTransactions, icon: LuTrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Items Sold', value: displayItemsSold, icon: LuBox, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Customers Served', value: reportData.customerSales.length, icon: LuUsers, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sales Report</h1>
                        {isAdmin && selectedShop !== 'all' && (
                            <button
                                onClick={() => setSelectedShop('all')}
                                className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center space-x-1"
                            >
                                <span>×</span>
                                <span>{selectedShop === 'admin' ? 'Admin Factory' : (shops.find(s => s._id === selectedShop)?.name || 'Shop')}</span>
                                <span className="ml-1 opacity-50 font-medium">(Back to All)</span>
                            </button>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">
                        {selectedShop === 'all'
                            ? 'Detailed analysis of your sales performance across all outlets'
                            : `Deep dive into ${selectedShop === 'admin' ? 'Admin Factory' : (shops.find(s => s._id === selectedShop)?.name || 'Shop')} sales performance`}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 shadow-sm ${showFilters ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200 hover:border-red-500'}`}
                    >
                        <LuFilter className="w-4 h-4" />
                        <span className="font-semibold text-sm">Filters</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 bg-emerald-600 border border-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-semibold text-sm"
                    >
                        <LuFileText className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:border-red-500 transition-all shadow-sm font-semibold text-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Consolidated Shop/Admin Selector Dropdown */}
            {isAdmin && (
                <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <LuStore className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Select View</span>
                            <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Report Context</span>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full max-w-md">
                        <select
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                            className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
                        >
                            <optgroup label="Overall Business">
                                <option value="all">View All Sales (Cumulative)</option>
                            </optgroup>
                            <optgroup label="Internal Management">
                                <option value="admin">Admin Side / Factory Only</option>
                            </optgroup>
                            <optgroup label="Individual Outlets">
                                {shops.map(shop => (
                                    <option key={shop._id} value={shop._id}>{shop.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                            <LuChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="hidden lg:block h-10 w-px bg-gray-100 mx-2" />

                    <div className="flex-1 hidden md:block">
                        <p className="text-xs text-gray-400 font-medium italic">
                            {selectedShop === 'all'
                                ? "Showing aggregated data from all shops and admin factory."
                                : selectedShop === 'admin'
                                    ? "Viewing sales recorded directly at the admin factory."
                                    : `Currently analazing performance for ${shops.find(s => s._id === selectedShop)?.name}.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters Section (Dates only now) */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <div className="relative">
                                    <LuLayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <LuChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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

            {/* Shop-wise Summary - Only shown when All Shops is selected */}
            {isAdmin && selectedShop === 'all' && reportData.shopSummaries.length > 0 && (
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <LuStore className="w-5 h-5 text-indigo-500" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Shop-wise Performance</h2>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Click a shop to view details</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Shop Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Transactions</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                                    {reportData.shopSummaries.map((shop, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedShop(shop.shopId)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${shop.shopId === 'admin' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                                        {shop.shopName.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{shop.shopName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    {shop.totalTransactions} bills
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">₹{shop.totalRevenue.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedShop(shop.shopId); }}
                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 uppercase"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product-wise Sales */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <LuBox className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    {selectedShop === 'all' ? 'Overall Product Sales' : `${selectedShop === 'admin' ? 'Admin Factory' : (shops.find(s => s._id === selectedShop)?.name || 'Shop')} Product Sales`}
                                </h2>
                            </div>
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm w-full sm:w-64"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Qty Sold</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" /></td>
                                                <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : filteredProductSales.length > 0 ? (
                                        filteredProductSales.map((product, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-800">{product.productName}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        {product.totalQuantity.toLocaleString()} {product.unit || 'units'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">₹{product.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center">
                                                <LuBox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                                <p className="text-gray-400 text-xs font-medium">No sales data found for products</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Customer-wise Sales */}
                <div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <LuUsers className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    {selectedShop === 'all' ? 'Top Customers (All)' : `Top Customers (${selectedShop === 'admin' ? 'Admin' : (shops.find(s => s._id === selectedShop)?.name || 'Shop')})`}
                                </h2>
                            </div>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 max-h-[600px]">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="p-4 flex items-center space-x-4 animate-pulse">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                                            <div className="h-3 bg-gray-100 rounded w-1/4" />
                                        </div>
                                    </div>
                                ))
                            ) : reportData.customerSales.length > 0 ? (
                                reportData.customerSales.map((customer, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50 rounded-xl transition-all group border border-transparent hover:border-gray-100 mb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-md">
                                                    {customer.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 leading-none mb-1 group-hover:text-red-500 transition-colors uppercase tracking-tight">{customer.name}</h4>
                                                    <p className="text-xs text-gray-400 font-semibold">{customer.mobile}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-sm text-gray-900 leading-none mb-1">₹{customer.totalSpent.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{customer.totalBills} Bills</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <LuUsers className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">No customer data found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;

