import React, { useState, useEffect, useCallback } from 'react';
import { LuDownload, LuBox, LuSearch, LuStore, LuChevronDown, LuTriangleAlert, LuPackage, LuContainer } from 'react-icons/lu';
import axios from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StockReport = () => {
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState({
        adminStock: { products: [], rawMaterials: [], packingMaterials: [] },
        shopStock: [],
        summary: { totalAdminItems: 0, totalShopItems: 0, lowStockCount: 0 }
    });

    const [selectedShop, setSelectedShop] = useState('all');
    const [shops, setShops] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchShops = useCallback(async () => {
        try {
            const response = await axios.get('/admin/shops');
            setShops(response.data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    }, []);

    const fetchStockReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                shopId: selectedShop
            };
            const response = await axios.get('/admin/reports/stock', { params });
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching stock report:', error);
            toast.error('Failed to fetch stock report');
        } finally {
            setLoading(false);
        }
    }, [selectedShop]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    useEffect(() => {
        fetchStockReport();
    }, [fetchStockReport]);

    const stats = [
        { label: 'Admin Items', value: stockData.summary.totalAdminItems, icon: LuBox, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Shop Items', value: stockData.summary.totalShopItems, icon: LuStore, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Low Stock', value: stockData.summary.lowStockCount, icon: LuTriangleAlert, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Total Variations', value: stockData.summary.totalAdminItems + stockData.summary.totalShopItems, icon: LuPackage, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];

    const filterItems = (items) => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category?.name && item.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

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
                        const isLow = qty <= (item.stockAlertThreshold || 0);

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={item._id}
                                className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isLow ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight uppercase tracking-tight">{item.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                            {item.category?.name || 'Uncategorized'}
                                        </p>
                                    </div>
                                    {isLow && (
                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                            <LuTriangleAlert className="w-4 h-4 text-red-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <span className="text-3xl font-black text-gray-900 tracking-tighter">{qty}</span>
                                        <span className="ml-2 text-sm font-bold text-gray-500 uppercase tracking-widest">{unit}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Status</p>
                                        <p className={`text-xs font-bold uppercase tracking-tighter ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {isLow ? 'Critical Low' : 'In Stock'}
                                        </p>
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
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Report</h1>
                    <p className="text-gray-500 mt-1">Real-time inventory levels across all locations</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search stock..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm w-full md:w-64 shadow-sm font-semibold"
                        />
                    </div>
                    <button className="flex items-center space-x-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 font-bold text-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Shop Selector */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 text-gray-700 min-w-max">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <LuStore className="w-5 h-5 text-red-500" />
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
                        className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-bold text-gray-800 appearance-none cursor-pointer shadow-inner"
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
            </div>

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
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 leading-none">
                                {loading ? <div className="h-6 w-12 bg-gray-100 animate-pulse rounded" /> : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Stock Sections */}
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
                                <LuBox className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No Stock Records Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium">Try adjusting your filters or search term to find what you're looking for.</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default StockReport;
