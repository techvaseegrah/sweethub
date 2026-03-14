import React, { useState, useEffect, useCallback } from 'react';
import { LuFileClock, LuDownload, LuSearch, LuStore, LuChevronDown, LuPackage, LuBox, LuContainer, LuClock, LuTriangleAlert, LuOctagonAlert, LuCircleCheck, LuLayoutGrid, LuCalendar } from 'react-icons/lu';
import { format } from 'date-fns';
import axios from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateExpiryBatchReportExcel } from '../../../utils/generateExpiryBatchReportExcel';

const ExpiryBatchReport = () => {
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState({
        adminStock: { products: [], rawMaterials: [], packingMaterials: [] },
        shopStock: [],
        summary: { totalAdminItems: 0, totalShopItems: 0, lowStockCount: 0 }
    });

    const [selectedShop, setSelectedShop] = useState('all');
    const [shops, setShops] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    const fetchShopsAndCategories = useCallback(async () => {
        try {
            const [shopsRes, categoriesRes] = await Promise.all([
                axios.get('/admin/shops'),
                axios.get('/admin/categories')
            ]);
            setShops(shopsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching shops and categories:', error);
        }
    }, []);

    const fetchStockReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                shopId: selectedShop,
                ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };
            const response = await axios.get('/admin/reports/stock', { params });
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching stock report:', error);
            toast.error('Failed to fetch stock report');
        } finally {
            setLoading(false);
        }
    }, [selectedShop, selectedCategory, dateRange]);

    useEffect(() => {
        fetchShopsAndCategories();
    }, [fetchShopsAndCategories]);

    const handleExportExcel = () => {
        const viewName = selectedShop === 'all' ? 'Global' : 
                        selectedShop === 'admin' ? 'Admin Side' : 
                        shops.find(s => s._id === selectedShop)?.name || 'Shop';
        
        generateExpiryBatchReportExcel(stockData, viewName);
        toast.success('Excel report generated');
    };

    useEffect(() => {
        fetchStockReport();
    }, [fetchStockReport]);

    const filterItems = (items) => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category?.name && item.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const getExpiryStatus = (item) => {
        const dateStr = item.expiryDate || item.usedByDate;
        if (!dateStr) return { status: 'No Expiry', days: null, color: 'text-gray-400', bg: 'bg-gray-100', icon: LuCircleCheck };

        const expDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'Expired', days: diffDays, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', isExpired: true, icon: LuOctagonAlert };
        if (diffDays <= 7) return { status: 'Expiring \u2264 7 Days', days: diffDays, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', isExpiring7: true, icon: LuTriangleAlert };
        if (diffDays <= 30) return { status: 'Expiring \u2264 30 Days', days: diffDays, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', isExpiring30: true, icon: LuClock };
        
        return { status: 'Valid', days: diffDays, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: LuCircleCheck };
    };

    // Calculate overall stats
    let expiredCount = 0;
    let expiring7Count = 0;
    let expiring30Count = 0;

    const calculateStats = (items) => {
        items.forEach(item => {
            const status = getExpiryStatus(item);
            if (status.isExpired) expiredCount++;
            else if (status.isExpiring7) expiring7Count++;
            else if (status.isExpiring30) expiring30Count++;
        });
    };

    calculateStats(stockData.adminStock.products);
    calculateStats(stockData.adminStock.rawMaterials);
    calculateStats(stockData.adminStock.packingMaterials);
    stockData.shopStock.forEach(shop => calculateStats(shop.items));

    const stats = [
        { label: 'Expired Items', value: loading ? '-' : expiredCount, color: 'text-red-600', bg: 'bg-red-100', icon: LuOctagonAlert },
        { label: 'Expiring in 7 Days', value: loading ? '-' : expiring7Count, color: 'text-orange-600', bg: 'bg-orange-100', icon: LuTriangleAlert },
        { label: 'Expiring in 30 Days', value: loading ? '-' : expiring30Count, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: LuClock },
    ];

    const renderStockList = (items, title, Icon) => {
        const filtered = filterItems(items);
        if (filtered.length === 0 && !loading) return null;

        return (
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))
                    ) : filtered.map((item, idx) => {
                        const qty = item.stockLevel !== undefined ? item.stockLevel : item.quantity;
                        const unit = item.prices && item.prices.length > 0 ? item.prices[0].unit : (item.unit || 'unit');
                        const expiryInfo = getExpiryStatus(item);

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={item._id}
                                className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${expiryInfo.border || 'border-gray-100'} ${expiryInfo.isExpired ? 'bg-red-50/30' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight uppercase tracking-tight">{item.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                            {item.category?.name || 'Item'}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-xl flex items-center justify-center ${expiryInfo.bg}`}>
                                        <expiryInfo.icon className={`w-5 h-5 ${expiryInfo.color}`} />
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-4 pb-4 border-b border-gray-50">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Current Stock</p>
                                        <div className="flex items-baseline">
                                            <span className="text-2xl font-black text-gray-900 tracking-tighter">{qty}</span>
                                            <span className="ml-1 text-xs font-bold text-gray-500 uppercase tracking-widest">{unit}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Expiry Date</p>
                                        <p className={`text-sm font-bold tracking-tighter ${(item.expiryDate || item.usedByDate) ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {(item.expiryDate || item.usedByDate) ? new Date(item.expiryDate || item.usedByDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Status</p>
                                        <p className={`text-xs font-bold uppercase tracking-tighter ${expiryInfo.color}`}>
                                            {expiryInfo.status}
                                        </p>
                                        {expiryInfo.days !== null && (
                                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                                                {expiryInfo.days < 0 ? `Expired by ${Math.abs(expiryInfo.days)} days` : `${expiryInfo.days} days left`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Expiry / Batch Report</h1>
                    <p className="text-gray-500 mt-1">Track batch validity and upcoming product expirations</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm w-full md:w-64 shadow-sm font-semibold"
                        />
                    </div>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 font-bold text-sm"
                    >
                        <LuDownload className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 font-bold text-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                {/* Date Filter */}
                <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <LuCalendar className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Time Period</span>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Date Range</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <div className="relative w-full">
                        <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <span className="text-gray-400 font-bold hidden sm:block">to</span>
                    <div className="relative w-full">
                        <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Shop Selector */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <LuStore className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Select View</span>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Inventory Location</span>
                    </div>
                </div>

                <div className="relative flex-1 w-full max-w-md">
                    <select
                        value={selectedShop}
                        onChange={(e) => setSelectedShop(e.target.value)}
                        className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
                    >
                        <option value="all">View All Inventory (Global)</option>
                        <option value="admin">Admin Side / Factory Only</option>
                        {shops.map(shop => (
                            <option key={shop._id} value={shop._id}>{shop.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <LuChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Category Dropdown */}
                <div className="hidden lg:block h-10 w-px bg-gray-100 mx-2" />

                <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <LuLayoutGrid className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Filter By</span>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Category</span>
                    </div>
                </div>

                <div className="relative flex-1 w-full max-w-md">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <LuChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <h3 className={`text-3xl font-black ${stat.color} leading-none`}>{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-4">
                {/* Admin Stock Section */}
                {(selectedShop === 'all' || selectedShop === 'admin') && (
                    <>
                        {renderStockList(stockData.adminStock.products, "Admin Factory - Finished Products", LuPackage)}
                        {renderStockList(stockData.adminStock.rawMaterials, "Admin Factory - Raw Materials", LuBox)}
                        {renderStockList(stockData.adminStock.packingMaterials, "Admin Factory - Packing Materials", LuContainer)}
                    </>
                )}

                {/* Shop Stock Sections */}
                {(selectedShop === 'all' || (selectedShop !== 'admin' && selectedShop !== 'all')) &&
                    stockData.shopStock.map(shop => (
                        <div key={shop.shopId}>
                            {renderStockList(shop.items, `${shop.shopName} - Outlet Stock`, LuStore)}
                        </div>
                    ))
                }

                {/* Empty State */}
                {!loading && filterItems(stockData.adminStock.products).length === 0 &&
                    filterItems(stockData.adminStock.rawMaterials).length === 0 &&
                    filterItems(stockData.adminStock.packingMaterials).length === 0 &&
                    stockData.shopStock.every(s => filterItems(s.items).length === 0) && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LuFileClock className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Expiry Data Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium">Try adjusting your filters or search term to find what you're looking for.</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default ExpiryBatchReport;
