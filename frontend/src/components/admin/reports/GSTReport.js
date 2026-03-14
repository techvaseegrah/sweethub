import React, { useState, useEffect, useCallback } from 'react';
import { LuFileText, LuDownload, LuCalendar, LuPercent, LuLayoutGrid, LuChevronDown, LuTrendingUp, LuTrendingDown, LuWallet } from 'react-icons/lu';
import { format } from 'date-fns';
import axios from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { generateGSTReportExcel } from '../../../utils/generateGSTReportExcel';

const GSTReport = () => {
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [gstData, setGstData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchGSTData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/reports/gst', {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    category: selectedCategory
                }
            });
            setGstData(res.data);
        } catch (err) {
            console.error("Failed to fetch GST data", err);
            toast.error("Failed to load GST report data");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedCategory]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/admin/categories');
                setCategories(res.data);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchGSTData();
    }, [fetchGSTData]);

    const handleExportExcel = () => {
        if (!gstData) {
            toast.error("No data available to export");
            return;
        }

        const exportData = {
            totalTaxableSales: gstData.salesStats.totalTaxableSales,
            cgstAmount: gstData.salesStats.totalCGST,
            sgstAmount: gstData.salesStats.totalSGST,
            totalTaxLiability: gstData.salesStats.totalGSTCollected,
            totalTaxablePurchases: gstData.purchaseStats.totalTaxablePurchases,
            totalPurchaseGST: gstData.purchaseStats.totalPurchaseGST,
            netGSTPayable: gstData.netGSTPayable,
            breakdown: gstData.breakdown
        };

        generateGSTReportExcel(exportData, dateRange);
        toast.success('Excel report generated');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">GST Report</h1>
                    <p className="text-gray-600">Tax summaries and filing information</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <LuCalendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-32"
                            title="Start Date"
                        />
                        <span className="text-gray-400 font-bold">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-32"
                            title="End Date"
                        />
                    </div>
                    
                    <div className="relative flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                        <LuLayoutGrid className="w-4 h-4 text-gray-400 mr-2" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 outline-none cursor-pointer pr-4 appearance-none w-32"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <LuChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <LuDownload className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                    {/* <button className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button> */}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : gstData ? (
                <>
                    {/* Sales Section */}
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <LuTrendingUp className="text-emerald-500" /> Sales GST (GST Collected)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Taxable Sales</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(gstData.salesStats.totalTaxableSales)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total CGST (Collected)</p>
                            <h3 className="text-2xl font-bold text-gray-800 text-emerald-600">{formatCurrency(gstData.salesStats.totalCGST)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total SGST (Collected)</p>
                            <h3 className="text-2xl font-bold text-gray-800 text-emerald-600">{formatCurrency(gstData.salesStats.totalSGST)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Sales GST</p>
                            <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(gstData.salesStats.totalGSTCollected)}</h3>
                        </div>
                    </div>

                    {/* Purchase Section */}
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <LuTrendingDown className="text-orange-500" /> Purchase GST (Input Tax Credit)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-400">
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Taxable Purchases</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(gstData.purchaseStats.totalTaxablePurchases)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium mb-1">GST Paid on Materials</p>
                            <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(gstData.purchaseStats.totalPurchaseGST)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 border-l-4 border-l-purple-500">
                            <p className="text-sm text-gray-500 font-medium mb-1">Net GST Payable (Sales GST - ITC)</p>
                            <h3 className={`text-2xl font-bold ${gstData.netGSTPayable >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatCurrency(gstData.netGSTPayable)}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {gstData.netGSTPayable >= 0 ? 'Total tax to be paid to government.' : 'Excess ITC available for future adjustment.'}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700">GST Breakdown by Product/Material</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {gstData.breakdown && gstData.breakdown.length > 0 ? (
                                        gstData.breakdown.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.taxableAmount)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">{formatCurrency(item.gstAmount)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-10 text-center text-gray-500">No transaction data found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-700">GST Summary Breakdown</h3>
                    </div>
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LuPercent className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">No Tax Data</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Tax calculations will be generated here based on your sales and purchase records for the selected period.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GSTReport;
