import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuHistory, LuDownload } from 'react-icons/lu';
import { generateReturnProductsReportPdf } from '../../../utils/generateReturnProductsReportPdf';

const ReturnProductsHistory = ({ refresh }) => {
    const [returns, setReturns] = useState([]);
    const [filteredReturns, setFilteredReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Date filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                // For admin, fetch all returns (no shopId filter)
                const response = await axios.get('/admin/warehouse/returns');
                // Filter out shop returns for admin view (only show admin-created returns)
                const adminReturns = response.data.filter(item => !item.shopId);
                setReturns(adminReturns);
                setFilteredReturns(adminReturns); // Initialize filtered returns
            } catch (err) {
                setError('Failed to fetch return history');
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [refresh]);
    
    // Apply date filters
    useEffect(() => {
        let result = [...returns];
        
        if (dateFrom) {
            result = result.filter(returnItem => new Date(returnItem.dateOfReturn) >= new Date(dateFrom));
        }
        
        if (dateTo) {
            result = result.filter(returnItem => {
                const returnDate = new Date(returnItem.dateOfReturn);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // Include the entire end date
                return returnDate <= toDate;
            });
        }
        
        setFilteredReturns(result);
    }, [dateFrom, dateTo, returns]);

    if (loading) return (
      <div className="p-6 text-center flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );

    // Set date range for predefined periods
    const setDateRange = (period) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch(period) {
            case 'daily':
                // Today only
                start = new Date(today);
                end = new Date(today);
                break;
            case 'weekly':
                // Start of current week (Sunday)
                const dayOfWeek = today.getDay();
                start = new Date(today);
                start.setDate(today.getDate() - dayOfWeek);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'monthly':
                // Start of current month
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'yearly':
                // Start of current year
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                return;
        }

        // Format dates as YYYY-MM-DD
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        setDateFrom(formatDate(start));
        setDateTo(formatDate(end));
    };

    const exportToPdf = () => {
        // Prepare filter information for the report
        const filterInfo = {};
        if (dateFrom) filterInfo.dateFrom = dateFrom;
        if (dateTo) filterInfo.dateTo = dateTo;
        
        generateReturnProductsReportPdf(filteredReturns, filterInfo);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <LuHistory className="mr-2" /> Return Products History
                </h3>
                <button 
                    onClick={exportToPdf}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    disabled={filteredReturns.length === 0}
                >
                    <LuDownload className="mr-2" />
                    Download PDF
                </button>
            </div>
            
            {/* Date Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">From:</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">To:</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setDateRange('daily')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            Today
                        </button>
                        <button 
                            onClick={() => setDateRange('weekly')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            This Week
                        </button>
                        <button 
                            onClick={() => setDateRange('monthly')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            This Month
                        </button>
                        <button 
                            onClick={() => setDateRange('yearly')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            This Year
                        </button>
                    </div>
                </div>
                
                {/* Date Range Summary */}
                {(dateFrom || dateTo) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-blue-800 font-medium">Date Range:</span>
                                <span className="text-blue-700 ml-2">
                                    {dateFrom && dateTo 
                                        ? `${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`
                                        : dateFrom
                                            ? `From: ${new Date(dateFrom).toLocaleDateString()}`
                                            : `To: ${new Date(dateTo).toLocaleDateString()}`}
                                </span>
                                <span className="text-blue-700 ml-3">
                                    <span className="font-medium">Total Returns:</span> {filteredReturns.length}
                                </span>
                            </div>
                            <button 
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Clear Dates
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">Return ID</th>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">Quantity</th>
                            <th className="py-3 px-4 text-left">Reason</th>
                            <th className="py-3 px-4 text-left">Source</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
    {returns.map(returnItem => (
        <tr key={returnItem._id} className="border-b hover:bg-gray-50">
            <td className="border px-4 py-2">{returnItem.returnId}</td>
            <td className="border px-4 py-2">{returnItem.productName}</td>
            <td className="border px-4 py-2">{returnItem.quantityReturned}</td>
            <td className="border px-4 py-2">{returnItem.reasonForReturn}</td>
            <td className="border px-4 py-2">{returnItem.source}</td>
            <td className="border px-4 py-2">{new Date(returnItem.dateOfReturn).toLocaleDateString()}</td>
            <td className="border px-4 py-2">{returnItem.remarks || '-'}</td>

        </tr>
    ))}
</tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnProductsHistory;