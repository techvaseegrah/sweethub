import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { 
    LuChartBar, 
    LuTrendingUp, 
    LuCalendar,
    LuRefreshCw 
} from 'react-icons/lu';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ProfitLossCharts = () => {
    const [chartData, setChartData] = useState(null);
    const [trendsData, setTrendsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [trendPeriod, setTrendPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly'

    useEffect(() => {
        fetchChartData();
        fetchTrendsData();
    }, [startDate, endDate, trendPeriod]);

    const fetchChartData = async () => {
        if (!startDate || !endDate) return;
        
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/admin/profit-loss/report', {
                params: { startDate, endDate },
                withCredentials: true,
            });
            setChartData(response.data);
        } catch (err) {
            setError('Failed to fetch chart data.');
            console.error('Chart data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendsData = async () => {
        try {
            const response = await axios.get('/admin/profit-loss/trends', {
                params: { period: trendPeriod },
                withCredentials: true,
            });
            setTrendsData(response.data);
        } catch (err) {
            console.error('Trends data error:', err);
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

    // Prepare comparison chart data
    const getComparisonChartData = () => {
        if (!chartData || !chartData.shopDetails) return null;

        const shopNames = chartData.shopDetails.map(shop => shop.shopName);
        const revenues = chartData.shopDetails.map(shop => shop.totalRevenue);
        const expenses = chartData.shopDetails.map(shop => shop.totalExpenses);
        const netProfits = chartData.shopDetails.map(shop => shop.netProfit);

        const chartConfig = {
            labels: shopNames,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                },
                {
                    label: 'Net Profit',
                    data: netProfits,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                }
            ]
        };

        return chartConfig;
    };

    // Prepare profit margin chart data
    const getProfitMarginChartData = () => {
        if (!chartData || !chartData.shopDetails) return null;

        const shopNames = chartData.shopDetails.map(shop => shop.shopName);
        const margins = chartData.shopDetails.map(shop => shop.profitMargin);

        return {
            labels: shopNames,
            datasets: [
                {
                    label: 'Profit Margin (%)',
                    data: margins,
                    backgroundColor: margins.map(margin => 
                        margin >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    ),
                    borderColor: margins.map(margin => 
                        margin >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                    ),
                    borderWidth: 2,
                }
            ]
        };
    };

    // Prepare trends chart data
    const getTrendsChartData = () => {
        if (!trendsData || !trendsData.trends) return null;

        // Get all unique periods from all shops
        const allPeriods = new Set();
        trendsData.trends.forEach(shop => {
            shop.trendData.forEach(period => allPeriods.add(period.period));
        });
        const periods = Array.from(allPeriods).sort();

        const datasets = trendsData.trends.map((shop, index) => {
            const colors = [
                'rgba(59, 130, 246, 1)',   // Blue
                'rgba(34, 197, 94, 1)',    // Green
                'rgba(239, 68, 68, 1)',    // Red
                'rgba(168, 85, 247, 1)',   // Purple
                'rgba(245, 158, 11, 1)',   // Amber
            ];
            
            const color = colors[index % colors.length];
            
            // Map trend data to periods
            const data = periods.map(period => {
                const periodData = shop.trendData.find(t => t.period === period);
                return periodData ? periodData.netProfit : 0;
            });

            return {
                label: shop.shopName,
                data: data,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
            };
        });

        return {
            labels: periods.map(period => format(new Date(period), 'MMM yyyy')),
            datasets: datasets
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        if (label === 'Profit Margin (%)') {
                            return `${label}: ${value.toFixed(2)}%`;
                        }
                        return `${label}: ${formatCurrency(value)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        }
    };

    const marginChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return `${value}%`;
                    }
                }
            }
        }
    };

    const comparisonData = getComparisonChartData();
    const marginData = getProfitMarginChartData();
    const trendsChartData = getTrendsChartData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <LuChartBar className="w-8 h-8 mr-3 text-blue-500" />
                            Profit & Loss Charts
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Visual comparison of financial performance across shops
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Chart Type Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    chartType === 'bar' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Bar Chart
                            </button>
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    chartType === 'line' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Line Chart
                            </button>
                        </div>

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

                        <button
                            onClick={() => { fetchChartData(); fetchTrendsData(); }}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        >
                            <LuRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Revenue, Expenses & Profit Comparison */}
            {comparisonData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Revenue vs Expenses vs Profit Comparison
                    </h3>
                    <div className="h-96">
                        {chartType === 'bar' ? (
                            <Bar data={comparisonData} options={chartOptions} />
                        ) : (
                            <Line data={comparisonData} options={chartOptions} />
                        )}
                    </div>
                </div>
            )}

            {/* Profit Margin Comparison */}
            {marginData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Profit Margin Comparison
                    </h3>
                    <div className="h-64">
                        <Bar data={marginData} options={marginChartOptions} />
                    </div>
                </div>
            )}

            {/* Profit Trends Over Time */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <LuTrendingUp className="w-6 h-6 mr-2 text-green-500" />
                        Profit Trends Over Time
                    </h3>
                    
                    <div className="flex gap-2">
                        <select
                            value={trendPeriod}
                            onChange={(e) => setTrendPeriod(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="daily">Daily (Last 30 days)</option>
                            <option value="weekly">Weekly (Last 12 weeks)</option>
                            <option value="monthly">Monthly (Last 12 months)</option>
                        </select>
                    </div>
                </div>
                
                {trendsChartData ? (
                    <div className="h-96">
                        <Line 
                            data={trendsChartData} 
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    legend: {
                                        position: 'top',
                                    }
                                }
                            }} 
                        />
                    </div>
                ) : (
                    <div className="h-96 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading trends data...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance Insights */}
            {chartData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Performance Insights
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Top Performer */}
                        {(() => {
                            const topShop = chartData.shopDetails.reduce((prev, current) => 
                                (prev.netProfit > current.netProfit) ? prev : current
                            );
                            return (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-2">Top Performer</h4>
                                    <p className="text-lg font-bold text-green-700">{topShop.shopName}</p>
                                    <p className="text-sm text-green-600">
                                        Net Profit: {formatCurrency(topShop.netProfit)}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Margin: {topShop.profitMargin.toFixed(2)}%
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Highest Revenue */}
                        {(() => {
                            const highestRevenueShop = chartData.shopDetails.reduce((prev, current) => 
                                (prev.totalRevenue > current.totalRevenue) ? prev : current
                            );
                            return (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 mb-2">Highest Revenue</h4>
                                    <p className="text-lg font-bold text-blue-700">{highestRevenueShop.shopName}</p>
                                    <p className="text-sm text-blue-600">
                                        Revenue: {formatCurrency(highestRevenueShop.totalRevenue)}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Needs Attention */}
                        {(() => {
                            const needsAttentionShop = chartData.shopDetails.reduce((prev, current) => 
                                (prev.profitMargin < current.profitMargin) ? prev : current
                            );
                            return (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-orange-800 mb-2">Needs Attention</h4>
                                    <p className="text-lg font-bold text-orange-700">{needsAttentionShop.shopName}</p>
                                    <p className="text-sm text-orange-600">
                                        Margin: {needsAttentionShop.profitMargin.toFixed(2)}%
                                    </p>
                                    <p className="text-sm text-orange-600">
                                        Net Profit: {formatCurrency(needsAttentionShop.netProfit)}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitLossCharts;