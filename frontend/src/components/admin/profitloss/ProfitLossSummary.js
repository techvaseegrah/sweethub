import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { 
    LuTrendingUp, 
    LuTrendingDown, 
    LuDollarSign, 
    LuCalendar,
    LuRefreshCw,
    LuDownload,
    LuEye
} from 'react-icons/lu';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const ProfitLossSummary = () => {
    const [profitLossData, setProfitLossData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [selectedShop, setSelectedShop] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchProfitLossData();
    }, [startDate, endDate]);

    const fetchProfitLossData = async () => {
        if (!startDate || !endDate) return;
        
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/admin/profit-loss/report', {
                params: { startDate, endDate },
                withCredentials: true,
            });
            setProfitLossData(response.data);
        } catch (err) {
            setError('Failed to fetch profit & loss data.');
            console.error('P&L Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getProfitClass = (profit) => {
        if (profit > 0) return 'text-green-600 bg-green-50';
        if (profit < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getProfitIcon = (profit) => {
        return profit >= 0 ? LuTrendingUp : LuTrendingDown;
    };

    const setDateRangeToThisMonth = () => {
        setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    };

    const setDateRangeToLastMonth = () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
    };

    const handleViewDetails = async (shop) => {
        try {
            setLoading(true);
            const response = await axios.get(`/admin/profit-loss/shop/${shop.shopId}`, {
                params: { startDate, endDate },
                withCredentials: true,
            });
            setSelectedShop(response.data);
            setShowDetailModal(true);
        } catch (err) {
            setError('Failed to fetch detailed shop data.');
            console.error('Shop details error:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        if (!profitLossData) return;
        
        const csvContent = [
            ['Shop Name', 'Revenue', 'Expenses', 'Gross Profit', 'Net Profit', 'Profit Margin'],
            ...profitLossData.shopDetails.map(shop => [
                shop.shopName,
                shop.totalRevenue,
                shop.totalExpenses,
                shop.grossProfit,
                shop.netProfit,
                `${shop.profitMargin.toFixed(2)}%`
            ]),
            ['TOTAL', profitLossData.overallTotals.totalRevenue, profitLossData.overallTotals.totalExpenses, profitLossData.overallTotals.grossProfit, profitLossData.overallTotals.netProfit, '']
        ].map(row => row.join(',')).join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profit-loss-${startDate}-to-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <LuDollarSign className="w-8 h-8 mr-3 text-green-500" />
                            Profit & Loss Analysis
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Comprehensive financial performance across all shops
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Date Range Selection */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        {/* Quick Date Buttons */}
                        <div className="flex flex-col justify-end gap-2">
                            <button
                                onClick={setDateRangeToThisMonth}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center"
                            >
                                <LuCalendar className="w-4 h-4 mr-2" />
                                This Month
                            </button>
                            <button
                                onClick={setDateRangeToLastMonth}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm flex items-center"
                            >
                                <LuCalendar className="w-4 h-4 mr-2" />
                                Last Month
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall Summary Cards */}
            {profitLossData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(profitLossData.overallTotals.totalRevenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <LuTrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(profitLossData.overallTotals.totalExpenses)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <LuTrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                                <p className={`text-2xl font-bold ${profitLossData.overallTotals.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(profitLossData.overallTotals.grossProfit)}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${profitLossData.overallTotals.grossProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {React.createElement(getProfitIcon(profitLossData.overallTotals.grossProfit), {
                                    className: `w-6 h-6 ${profitLossData.overallTotals.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                                <p className={`text-2xl font-bold ${profitLossData.overallTotals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(profitLossData.overallTotals.netProfit)}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${profitLossData.overallTotals.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {React.createElement(getProfitIcon(profitLossData.overallTotals.netProfit), {
                                    className: `w-6 h-6 ${profitLossData.overallTotals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shop-wise P&L Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Shop-wise Performance
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchProfitLossData}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        >
                            <LuRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {profitLossData && (
                            <button
                                onClick={exportData}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                            >
                                <LuDownload className="w-4 h-4 mr-2" />
                                Export CSV
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Loading P&L data...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                )}

                {profitLossData && !loading && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Shop Name
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expenses
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gross Profit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Net Profit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Margin %
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {profitLossData.shopDetails.map((shop) => (
                                    <tr key={shop.shopId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {shop.shopName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {formatCurrency(shop.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {formatCurrency(shop.totalExpenses)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfitClass(shop.grossProfit)}`}>
                                                {formatCurrency(shop.grossProfit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfitClass(shop.netProfit)}`}>
                                                {formatCurrency(shop.netProfit)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {shop.profitMargin.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button
                                                onClick={() => handleViewDetails(shop)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="View Details"
                                            >
                                                <LuEye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr className="font-semibold">
                                    <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {formatCurrency(profitLossData.overallTotals.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {formatCurrency(profitLossData.overallTotals.totalExpenses)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {formatCurrency(profitLossData.overallTotals.grossProfit)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {formatCurrency(profitLossData.overallTotals.netProfit)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        {profitLossData.overallTotals.totalRevenue > 0 
                                            ? (profitLossData.overallTotals.netProfit / profitLossData.overallTotals.totalRevenue * 100).toFixed(2)
                                            : '0.00'
                                        }%
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedShop && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {selectedShop.shopName} - Detailed P&L
                                </h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Revenue Breakdown */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Revenue Breakdown</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Customer Sales</p>
                                        <p className="text-lg font-bold text-green-700">
                                            {formatCurrency(selectedShop.revenueBreakdown?.customerSales?.amount || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedShop.revenueBreakdown?.customerSales?.transactions || 0} transactions
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Invoice Sales</p>
                                        <p className="text-lg font-bold text-blue-700">
                                            {formatCurrency(selectedShop.revenueBreakdown?.invoiceSales?.amount || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedShop.revenueBreakdown?.invoiceSales?.invoices || 0} invoices
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expense Breakdown */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Expense Breakdown</h4>
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">Direct Costs (COGS)</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-orange-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Product Costs</p>
                                                <p className="font-bold text-orange-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.directCosts?.productCosts || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Manufacturing</p>
                                                <p className="font-bold text-orange-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.directCosts?.manufacturingCosts || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Materials</p>
                                                <p className="font-bold text-orange-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.directCosts?.materialCosts || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">Indirect Costs (Operating)</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-red-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Salaries</p>
                                                <p className="font-bold text-red-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.indirectCosts?.salaryCosts || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Transport</p>
                                                <p className="font-bold text-red-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.indirectCosts?.transportCosts || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Utilities</p>
                                                <p className="font-bold text-red-700">
                                                    {formatCurrency(selectedShop.expenseBreakdown?.indirectCosts?.utilityCosts || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Revenue</p>
                                        <p className="font-bold text-green-600">{formatCurrency(selectedShop.totalRevenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Expenses</p>
                                        <p className="font-bold text-red-600">{formatCurrency(selectedShop.totalExpenses)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Gross Profit</p>
                                        <p className={`font-bold ${selectedShop.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(selectedShop.grossProfit)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Net Profit</p>
                                        <p className={`font-bold ${selectedShop.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(selectedShop.netProfit)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitLossSummary;