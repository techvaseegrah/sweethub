import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { 
    LuFileText, 
    LuDownload, 
    LuPrinter,
    LuCalendar,
    LuRefreshCw,
    LuTrendingUp,
    LuTrendingDown
} from 'react-icons/lu';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const ConsolidatedProfitLossReport = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [expandedSections, setExpandedSections] = useState({
        revenue: true,
        expenses: true,
        profit: true
    });

    useEffect(() => {
        fetchReportData();
    }, [startDate, endDate]);

    const fetchReportData = async () => {
        if (!startDate || !endDate) return;
        
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/admin/profit-loss/report', {
                params: { startDate, endDate },
                withCredentials: true,
            });
            setReportData(response.data);
        } catch (err) {
            setError('Failed to fetch consolidated report data.');
            console.error('Report data error:', err);
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

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const exportToPDF = () => {
        window.print();
    };

    const exportToCSV = () => {
        if (!reportData) return;
        
        const csvContent = [
            ['SweetHub Consolidated Profit & Loss Report'],
            [`Period: ${startDate} to ${endDate}`],
            [''],
            ['Revenue Summary'],
            ['Shop Name', 'Customer Sales', 'Invoice Sales', 'Total Revenue'],
            ...reportData.shopDetails.map(shop => [
                shop.shopName,
                shop.revenueBreakdown?.customerSales?.amount || 0,
                shop.revenueBreakdown?.invoiceSales?.amount || 0,
                shop.totalRevenue
            ]),
            [''],
            ['Expense Summary'],
            ['Shop Name', 'Product Costs', 'Manufacturing', 'Materials', 'Salaries', 'Transport', 'Utilities', 'Total Expenses'],
            ...reportData.shopDetails.map(shop => [
                shop.shopName,
                shop.expenseBreakdown?.directCosts?.productCosts || 0,
                shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0,
                shop.expenseBreakdown?.directCosts?.materialCosts || 0,
                shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0,
                shop.expenseBreakdown?.indirectCosts?.transportCosts || 0,
                shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0,
                shop.totalExpenses
            ]),
            [''],
            ['Profit Summary'],
            ['Shop Name', 'Gross Profit', 'Net Profit', 'Profit Margin %'],
            ...reportData.shopDetails.map(shop => [
                shop.shopName,
                shop.grossProfit,
                shop.netProfit,
                shop.profitMargin.toFixed(2)
            ]),
            [''],
            ['Overall Totals'],
            ['Total Revenue', 'Total Expenses', 'Gross Profit', 'Net Profit'],
            [
                reportData.overallTotals.totalRevenue,
                reportData.overallTotals.totalExpenses,
                reportData.overallTotals.grossProfit,
                reportData.overallTotals.netProfit
            ]
        ].map(row => row.join(',')).join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consolidated-pl-report-${startDate}-to-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getProfitClass = (profit) => {
        if (profit > 0) return 'text-green-600';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getProfitBgClass = (profit) => {
        if (profit > 0) return 'bg-green-50 border-green-200';
        if (profit < 0) return 'bg-red-50 border-red-200';
        return 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <LuFileText className="w-8 h-8 mr-3 text-blue-500" />
                            Consolidated Profit & Loss Report
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Detailed financial performance report for all shops
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Date Range Selection */}
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={fetchReportData}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                            >
                                <LuRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                            >
                                <LuDownload className="w-4 h-4 mr-2" />
                                Export CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
                            >
                                <LuPrinter className="w-4 h-4 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="bg-white rounded-xl shadow-lg p-12 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Generating consolidated report...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {reportData && !loading && (
                <div className="space-y-6">
                    {/* Executive Summary */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Executive Summary
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium">Total Revenue</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                    {formatCurrency(reportData.overallTotals.totalRevenue)}
                                </p>
                            </div>
                            
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-sm text-red-800 font-medium">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">
                                    {formatCurrency(reportData.overallTotals.totalExpenses)}
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg border ${getProfitBgClass(reportData.overallTotals.grossProfit)}`}>
                                <p className="text-sm font-medium">Gross Profit</p>
                                <p className={`text-2xl font-bold mt-1 ${getProfitClass(reportData.overallTotals.grossProfit)}`}>
                                    {formatCurrency(reportData.overallTotals.grossProfit)}
                                </p>
                                <p className="text-xs mt-1">
                                    {reportData.overallTotals.totalRevenue > 0 
                                        ? ((reportData.overallTotals.grossProfit / reportData.overallTotals.totalRevenue) * 100).toFixed(2) 
                                        : '0.00'}% margin
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg border ${getProfitBgClass(reportData.overallTotals.netProfit)}`}>
                                <p className="text-sm font-medium">Net Profit/Loss</p>
                                <p className={`text-2xl font-bold mt-1 ${getProfitClass(reportData.overallTotals.netProfit)}`}>
                                    {formatCurrency(reportData.overallTotals.netProfit)}
                                </p>
                                <p className="text-xs mt-1">
                                    {reportData.overallTotals.totalRevenue > 0 
                                        ? ((reportData.overallTotals.netProfit / reportData.overallTotals.totalRevenue) * 100).toFixed(2) 
                                        : '0.00'}% margin
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <h4 className="font-medium text-gray-800 mb-2">Performance Overview</h4>
                            <div className="flex items-center">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                                <div className="ml-4 text-sm text-gray-600">
                                    {reportData.shopDetails.filter(shop => shop.netProfit < 0).length} shops losing money, 
                                    {' '}{reportData.shopDetails.filter(shop => shop.netProfit > 0).length} shops profitable
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg">
                        <div 
                            className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                            onClick={() => toggleSection('revenue')}
                        >
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <LuTrendingUp className="w-5 h-5 mr-2 text-green-500" />
                                Revenue Breakdown
                            </h3>
                            <span className="text-gray-500">
                                {expandedSections.revenue ? '▼' : '▶'}
                            </span>
                        </div>
                        
                        {expandedSections.revenue && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Shop
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer Sales
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Invoice Sales
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total Revenue
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    % of Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.shopDetails.map((shop) => (
                                                <tr key={shop.shopId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {shop.shopName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.revenueBreakdown?.customerSales?.amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.revenueBreakdown?.invoiceSales?.amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                        {formatCurrency(shop.totalRevenue)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {reportData.overallTotals.totalRevenue > 0 
                                                            ? ((shop.totalRevenue / reportData.overallTotals.totalRevenue) * 100).toFixed(1)
                                                            : '0.0'}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-semibold">
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.revenueBreakdown?.customerSales?.amount || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.revenueBreakdown?.invoiceSales?.amount || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.overallTotals.totalRevenue)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    100.0%
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg">
                        <div 
                            className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                            onClick={() => toggleSection('expenses')}
                        >
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <LuTrendingDown className="w-5 h-5 mr-2 text-red-500" />
                                Expense Breakdown
                            </h3>
                            <span className="text-gray-500">
                                {expandedSections.expenses ? '▼' : '▶'}
                            </span>
                        </div>
                        
                        {expandedSections.expenses && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Shop
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Product Costs
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Manufacturing
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Materials
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Salaries
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Transport
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Utilities
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total Expenses
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.shopDetails.map((shop) => (
                                                <tr key={shop.shopId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {shop.shopName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.directCosts?.productCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.directCosts?.materialCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.indirectCosts?.transportCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                        {formatCurrency(shop.totalExpenses)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-semibold">
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.directCosts?.productCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.directCosts?.materialCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.indirectCosts?.transportCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                        sum + (shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0), 0
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.overallTotals.totalExpenses)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-800 mb-3">Expense Distribution</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                            <p className="text-xs text-orange-800">Direct Costs</p>
                                            <p className="font-bold text-orange-700">
                                                {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                    sum + (shop.expenseBreakdown?.directCosts?.productCosts || 0) +
                                                        (shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0) +
                                                        (shop.expenseBreakdown?.directCosts?.materialCosts || 0), 0
                                                ))}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded border border-red-200">
                                            <p className="text-xs text-red-800">Salaries</p>
                                            <p className="font-bold text-red-700">
                                                {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                    sum + (shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0), 0
                                                ))}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded border border-red-200">
                                            <p className="text-xs text-red-800">Transport</p>
                                            <p className="font-bold text-red-700">
                                                {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                    sum + (shop.expenseBreakdown?.indirectCosts?.transportCosts || 0), 0
                                                ))}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded border border-red-200">
                                            <p className="text-xs text-red-800">Utilities</p>
                                            <p className="font-bold text-red-700">
                                                {formatCurrency(reportData.shopDetails.reduce((sum, shop) => 
                                                    sum + (shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0), 0
                                                ))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profit Analysis */}
                    <div className="bg-white rounded-xl shadow-lg">
                        <div 
                            className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                            onClick={() => toggleSection('profit')}
                        >
                            <h3 className="text-xl font-semibold text-gray-900">
                                Profit Analysis
                            </h3>
                            <span className="text-gray-500">
                                {expandedSections.profit ? '▼' : '▶'}
                            </span>
                        </div>
                        
                        {expandedSections.profit && (
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Shop
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
                                                    Profit Margin
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.shopDetails.map((shop) => (
                                                <tr key={shop.shopId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {shop.shopName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.totalRevenue)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {formatCurrency(shop.totalExpenses)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        <span className={getProfitClass(shop.grossProfit)}>
                                                            {formatCurrency(shop.grossProfit)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                                                        <span className={getProfitClass(shop.netProfit)}>
                                                            {formatCurrency(shop.netProfit)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        <span className={getProfitClass(shop.netProfit)}>
                                                            {shop.profitMargin.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        {shop.netProfit > 0 ? (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                                Profitable
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                                Loss
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-semibold">
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.overallTotals.totalRevenue)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(reportData.overallTotals.totalExpenses)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    <span className={getProfitClass(reportData.overallTotals.grossProfit)}>
                                                        {formatCurrency(reportData.overallTotals.grossProfit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    <span className={getProfitClass(reportData.overallTotals.netProfit)}>
                                                        {formatCurrency(reportData.overallTotals.netProfit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {reportData.overallTotals.totalRevenue > 0 
                                                        ? ((reportData.overallTotals.netProfit / reportData.overallTotals.totalRevenue) * 100).toFixed(2)
                                                        : '0.00'}%
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                                                    {reportData.overallTotals.netProfit > 0 ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                            Profitable
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                            Loss
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-800 mb-3">Key Insights</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800">Best Performing Shop</p>
                                            <p className="font-bold text-blue-700 mt-1">
                                                {reportData.shopDetails.reduce((prev, current) => 
                                                    (prev.netProfit > current.netProfit) ? prev : current
                                                ).shopName}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {formatCurrency(reportData.shopDetails.reduce((prev, current) => 
                                                    (prev.netProfit > current.netProfit) ? prev : current
                                                ).netProfit)} profit
                                            </p>
                                        </div>
                                        
                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                            <p className="text-sm text-orange-800">Average Profit Margin</p>
                                            <p className="font-bold text-orange-700 mt-1">
                                                {(reportData.shopDetails.reduce((sum, shop) => 
                                                    sum + shop.profitMargin, 0) / reportData.shopDetails.length).toFixed(2)}%
                                            </p>
                                        </div>
                                        
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <p className="text-sm text-red-800">Underperforming Shops</p>
                                            <p className="font-bold text-red-700 mt-1">
                                                {reportData.shopDetails.filter(shop => shop.netProfit < 0).length} shops
                                            </p>
                                            <p className="text-xs text-red-600">
                                                {reportData.shopDetails.filter(shop => shop.netProfit < 0).length > 0
                                                    ? reportData.shopDetails
                                                        .filter(shop => shop.netProfit < 0)
                                                        .map(s => s.shopName)
                                                        .join(', ')
                                                    : 'None'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsolidatedProfitLossReport;