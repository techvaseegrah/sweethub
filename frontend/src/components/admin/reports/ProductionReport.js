import React, { useState, useEffect, useCallback } from 'react';
import {
    LuFileText,
    LuDownload,
    LuCalendar,
    LuSearch,
    LuFilter,
    LuPackage,
    LuChartBar,
    LuCircleCheck,
    LuChefHat,
    LuChevronDown,
    LuLayoutGrid
} from 'react-icons/lu';
import axios from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const ProductionReport = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState({
        productionItems: [],
        materialConsumption: [],
        stats: {
            totalBatches: 0,
            completedSchedules: 0,
            totalOutput: '0.00',
            activeProducts: 0,
            totalMaterialCost: '0.00'
        }
    });

    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [timeFilter, setTimeFilter] = useState('this-month');

    // New states for Category Filter
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                filter: timeFilter === 'custom' ? undefined : timeFilter,
                ...(timeFilter === 'custom' && {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                })
            };

            const response = await axios.get('/admin/reports/production', { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching production report:', error);
            toast.error('Failed to fetch production report');
        } finally {
            setLoading(false);
        }
    }, [dateRange, timeFilter]);

    const fetchCategoriesAndProducts = useCallback(async () => {
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                axios.get('/admin/categories'),
                axios.get('/admin/products')
            ]);
            setCategories(categoriesRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching categories and products:', error);
        }
    }, []);

    useEffect(() => {
        fetchReport();
        fetchCategoriesAndProducts();
    }, [fetchReport, fetchCategoriesAndProducts]);

    const productCategoryMap = {};
    products.forEach(p => {
        productCategoryMap[p.name] = p.category?._id || p.category;
    });

    const filteredProductionItems = reportData.productionItems.filter(p => {
        const matchesSearch = (p.productName || 'Unknown Product').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || productCategoryMap[p.productName] === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredMaterialConsumption = reportData.materialConsumption.filter(m => {
        const matchesSearch = (m.materialName || 'Unknown Material').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || productCategoryMap[m.materialName] === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const displayTotalOutput = selectedCategory === 'all'
        ? reportData.stats.totalOutput
        : filteredProductionItems.reduce((acc, item) => acc + item.totalQuantity, 0).toFixed(2);

    const displayActiveProducts = selectedCategory === 'all'
        ? reportData.stats.activeProducts
        : filteredProductionItems.length;

    const displayTotalBatches = selectedCategory === 'all'
        ? reportData.stats.totalBatches
        : filteredProductionItems.reduce((acc, item) => acc + item.batchCount, 0);

    const displayMaterialCost = selectedCategory === 'all'
        ? Number(reportData.stats.totalMaterialCost)
        : filteredMaterialConsumption.reduce((acc, item) => acc + item.totalCost, 0);

    const stats = [
        { label: 'Total Output', value: `${displayTotalOutput} units`, icon: LuPackage, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Active Products', value: displayActiveProducts, icon: LuChefHat, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Total Batches', value: displayTotalBatches, icon: LuChartBar, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Material Cost', value: `₹${displayMaterialCost.toLocaleString()}`, icon: LuCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Production Report</h1>
                    <p className="text-gray-500 mt-1">Monitor manufacturing output and factory efficiency</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 shadow-sm ${showFilters ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200 hover:border-red-500'}`}
                    >
                        <LuFilter className="w-4 h-4" />
                        <span className="font-semibold text-sm">Time Filters</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-red-600 border border-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all shadow-sm font-semibold text-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:border-red-500 transition-all shadow-sm font-semibold text-sm">
                        <LuFileText className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Time Selector */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <LuCalendar className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Time Period</span>
                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Report Range</span>
                                </div>
                            </div>

                            <div className="relative flex-1 w-full max-w-md">
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="today">Today's Production</option>
                                    <option value="yesterday">Yesterday's Production</option>
                                    <option value="this-week">This Week</option>
                                    <option value="this-month">This Month</option>
                                    <option value="custom">Custom Date Range</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <LuChevronDown className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {timeFilter === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 w-full md:w-auto"
                                >
                                    <div className="flex-1 md:w-40">
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-bold">to</span>
                                    <div className="flex-1 md:w-40">
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div className="hidden lg:block h-10 w-px bg-gray-100 mx-2" />

                            <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <LuLayoutGrid className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Filter</span>
                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">Category</span>
                                </div>
                            </div>

                            <div className="relative flex-1 w-full max-w-[200px]">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full pl-5 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                                <LuChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Production Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <LuChartBar className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Finished Goods Output</h2>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Total Output</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Batches</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/4 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredProductionItems.length > 0 ? (
                                    filteredProductionItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-800 group-hover:text-red-600 transition-colors uppercase tracking-tight">{item.productName || 'Unknown Product'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                                                    {item.totalQuantity.toLocaleString()} {item.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                                                    {item.batchCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center">
                                            <p className="text-gray-400 font-medium">No production data found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Material Consumption Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <LuPackage className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Raw Material Consumption</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Material</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Total Used</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/4 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredMaterialConsumption.length > 0 ? (
                                    filteredMaterialConsumption.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-800 uppercase tracking-tight">{item.materialName || 'Unknown Material'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-amber-600">
                                                {item.totalUsed.toLocaleString()} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                ₹{item.totalCost.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center">
                                            <p className="text-gray-400 font-medium">No consumption data found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionReport;
