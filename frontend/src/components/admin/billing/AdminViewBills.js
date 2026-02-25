import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { generateBillPdf } from '../../../utils/generateBillPdf';
import BillDetailView from './BillDetailView';
import { useNavigate } from 'react-router-dom';
import { formatDateToDDMMYYYY, formatDateTime } from '../../../utils/unitConversion';
import { generateBillExcel } from '../../../utils/generateBillExcel';

const BILLS_URL = '/admin/bills';
const SHOPS_URL = '/admin/shops';

function AdminViewBills({ baseUrl = '/admin' }) {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Time-based filters
  const [timeFilterType, setTimeFilterType] = useState('All'); // 'All', 'Today', 'Yesterday', 'Last7Days', 'ThisWeek', 'ThisMonth', 'PerHour'
  const [selectedHour, setSelectedHour] = useState(''); // For per-hour filter

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('all');

  // Category filter state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillDetailModalOpen, setIsBillDetailModalOpen] = useState(false);
  const [initialEditMode, setInitialEditMode] = useState(false);

  // State for edit/delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [customDeletionReason, setCustomDeletionReason] = useState('');
  const [deletionLoading, setDeletionLoading] = useState(false);

  // Excel download state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFromDate, setExcelFromDate] = useState('');
  const [excelToDate, setExcelToDate] = useState('');

  // Load More state — show 2 days at a time
  const [visibleDays, setVisibleDays] = useState(2);

  const navigate = useNavigate();

  const fetchBills = async () => {
    try {
      let params = {};
      if (selectedShop === 'admin') {
        params = { shopId: 'admin' };
      } else if (selectedShop && selectedShop !== 'all') {
        params = { shopId: selectedShop };
      }

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const response = await axios.get(`${baseUrl}/bills`, {
        params,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const sorted = [...response.data].sort((a, b) => {
        const aTime = a.billDate
          ? new Date(a.billDate).getTime()
          : parseInt(a._id.slice(0, 8), 16) * 1000;
        const bTime = b.billDate
          ? new Date(b.billDate).getTime()
          : parseInt(b._id.slice(0, 8), 16) * 1000;
        return bTime - aTime;
      });
      setBills(sorted);
    } catch (err) {
      setError('Failed to fetch bills.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get(SHOPS_URL, { withCredentials: true });
      setShops(response.data);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/admin/categories', { withCredentials: true });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    if (baseUrl === '/admin') {
      fetchShops();
      fetchCategories();
    }
    fetchBills();
  }, [baseUrl, selectedShop, selectedCategory]);

  // Calculate total sales amount for filtered bills
  const calculateTotalSales = (billsList) => {
    return billsList.reduce((total, bill) => {
      // Only count non-deleted ORDINARY bills (exclude REFERENCE bills)
      if (!bill.isDeleted && bill.billType !== 'REFERENCE') {
        return total + (bill.totalAmount || 0);
      }
      return total;
    }, 0);
  };

  // New useEffect hook to handle filtering on the frontend
  useEffect(() => {
    let tempBills = [...bills];

    // Filter by search term (customer name or mobile number)
    if (searchTerm) {
      tempBills = tempBills.filter(bill =>
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerMobileNumber.includes(searchTerm)
      );
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'All') {
      tempBills = tempBills.filter(bill =>
        bill.paymentMethod && bill.paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    // Time-based filtering
    const now = new Date();

    switch (timeFilterType) {
      case 'Today':
        tempBills = tempBills.filter(bill => {
          const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
          return billDate.toDateString() === now.toDateString();
        });
        break;
      case 'Yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
          return billDate.toDateString() === yesterday.toDateString();
        });
        break;
      case 'Last7Days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
          return billDate >= sevenDaysAgo && billDate <= now;
        });
        break;
      case 'ThisWeek':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
          return billDate >= startOfWeek;
        });
        break;
      case 'ThisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
          return billDate >= startOfMonth;
        });
        break;
      case 'PerHour':
        if (selectedHour) {
          const [hour, minute] = selectedHour.split(':');
          tempBills = tempBills.filter(bill => {
            const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
            return billDate.getHours() === parseInt(hour);
          });
        }
        break;
      default:
        // No time-based filter applied
        break;
    }

    // Filter by bill date range
    if (fromDate) {
      const from = new Date(fromDate).setHours(0, 0, 0, 0);
      tempBills = tempBills.filter(bill => {
        const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
        return billDate.getTime() >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate).setHours(23, 59, 59, 999);
      tempBills = tempBills.filter(bill => {
        const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
        return billDate.getTime() <= to;
      });
    }

    setFilteredBills(tempBills);
  }, [bills, searchTerm, paymentMethodFilter, fromDate, toDate, timeFilterType, selectedHour]);

  // Reset visibleDays whenever filters change
  useEffect(() => {
    setVisibleDays(2);
  }, [searchTerm, paymentMethodFilter, fromDate, toDate, timeFilterType, selectedHour, selectedShop, selectedCategory]);

  // Group filteredBills by date and compute visible bills
  const getUniqueDates = () => {
    const dateMap = {};
    filteredBills.forEach(bill => {
      const d = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
      const dateKey = d.toDateString();
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { dateKey, dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()), bills: [] };
      }
      dateMap[dateKey].bills.push(bill);
    });
    return Object.values(dateMap).sort((a, b) => b.dateObj - a.dateObj);
  };

  const groupedByDate = getUniqueDates();
  const visibleGroups = groupedByDate.slice(0, visibleDays);
  const hasMoreDays = visibleDays < groupedByDate.length;
  const visibleBills = visibleGroups.flatMap(g => g.bills);

  // Calculate total sales for current filtered bills (all filtered, not just visible)
  const totalSalesAmount = calculateTotalSales(filteredBills);

  const generateInvoice = (bill) => {
    // Find the shop data for this bill
    const shop = selectedShop === 'admin'
      ? { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' }
      : shops.find(s => s._id === selectedShop) || bill.shop;

    generateBillPdf(bill, shop);
  };

  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setInitialEditMode(false);
    setIsBillDetailModalOpen(true);
  };

  const handleEditPaymentMethod = (bill) => {
    setSelectedBill(bill);
    setInitialEditMode(true);
    setIsBillDetailModalOpen(true);
  };

  const handleEditBill = (bill) => {
    // Navigate to create bill page in edit mode with bill data
    navigate('/admin/bills/create', { state: { billData: bill, isEditMode: true } });
  };

  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setDeletionReason('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    let finalReason = deletionReason;
    if (deletionReason === 'Other' && customDeletionReason.trim()) {
      finalReason = customDeletionReason;
    }

    if (!finalReason.trim()) {
      alert('Please enter a reason for deletion');
      return;
    }

    setDeletionLoading(true);
    try {
      await axios({
        method: 'delete',
        url: `${BILLS_URL}/${billToDelete._id}`,
        data: { reason: finalReason },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      // Update the local bills state to mark the bill as deleted instead of refetching
      setBills(prevBills =>
        prevBills.map(bill =>
          bill._id === billToDelete._id
            ? { ...bill, isDeleted: true, deletionReason: finalReason, deletedBy: { name: 'Current User' }, deletedAt: new Date().toISOString() }
            : bill
        )
      );

      setIsDeleteModalOpen(false);
      setBillToDelete(null);
      setDeletionReason('');
      setCustomDeletionReason('');
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleDownloadPDF = (bill) => {
    // Find the shop data for this bill
    const shop = selectedShop === 'admin'
      ? { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' }
      : shops.find(s => s._id === selectedShop) || bill.shop;

    generateBillPdf(bill, shop);
  };

  const handleDownloadExcelClick = () => {
    setIsExcelModalOpen(true);
    // Pre-fill with current filters if available, or default to today/this month if preferred
    if (fromDate) setExcelFromDate(fromDate);
    if (toDate) setExcelToDate(toDate);
  };

  const confirmExcelDownload = () => {
    if (!excelFromDate || !excelToDate) {
      alert("Please select both From and To dates.");
      return;
    }

    generateBillExcel(bills, excelFromDate, excelToDate);
    setIsExcelModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img
            src="/sweethub-logo.png"
            alt="Sweet Hub Logo"
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading bills...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">View Bills</h3>
        <button
          onClick={handleDownloadExcelClick}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors duration-200"
        >
          <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" /></svg>
          <span>Download Excel</span>
        </button>
      </div>

      {/* Add filter dropdown for admin panel */}
      {baseUrl === '/admin' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Shop</label>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Bills</option>
            <option value="admin">Admin Bills Only</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        {/* Total Sales Summary */}
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="text-lg font-semibold text-green-800">Sales Summary</h4>
              <p className="text-sm text-green-600">
                Showing {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}
                {filteredBills.length > 0 && (
                  <span> ({filteredBills.filter(bill => !bill.isDeleted && bill.billType !== 'REFERENCE').length} active ORDINARY)</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">₹{totalSalesAmount.toFixed(2)}</div>
              <div className="text-sm text-green-600">Total Sales Amount</div>
            </div>
          </div>

          {/* Show applied filters */}
          {(searchTerm || paymentMethodFilter !== 'All' || fromDate || toDate || timeFilterType !== 'All') && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs text-green-700 font-medium">Applied Filters:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {searchTerm}
                  </span>
                )}
                {paymentMethodFilter !== 'All' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Payment: {paymentMethodFilter}
                  </span>
                )}
                {timeFilterType !== 'All' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Time: {timeFilterType}
                    {timeFilterType === 'PerHour' && selectedHour && ` (${selectedHour})`}
                  </span>
                )}
                {fromDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    From: {fromDate}
                  </span>
                )}
                {toDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    To: {toDate}
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                    Category: {categories.find(c => c._id === selectedCategory)?.name || 'Unknown'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="All">All</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>




        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2">Time Filter</label>
          <select
            value={timeFilterType}
            onChange={(e) => setTimeFilterType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last7Days">Last 7 Days</option>
            <option value="ThisWeek">This Week</option>
            <option value="ThisMonth">This Month</option>
            <option value="PerHour">Per Hour</option>
          </select>
        </div>

        {timeFilterType === 'PerHour' && (
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Hour</label>
            <input
              type="time"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        )}
      </div>


      {
        filteredBills.length === 0 ? (
          <p>No bills found.</p>
        ) : (
          <>
            {visibleGroups.map((group) => (
              <div key={group.dateKey} className="mb-6">
                {/* Date Header */}
                <div className="bg-gray-100 px-4 py-2 rounded-t-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700">
                    {(() => {
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      if (group.dateObj.toDateString() === today.toDateString()) return `📅 Today — ${formatDateToDDMMYYYY(group.dateObj)}`;
                      if (group.dateObj.toDateString() === yesterday.toDateString()) return `📅 Yesterday — ${formatDateToDDMMYYYY(group.dateObj)}`;
                      return `📅 ${formatDateToDDMMYYYY(group.dateObj)}`;
                    })()}
                    <span className="ml-2 text-xs font-normal text-gray-500">({group.bills.length} bill{group.bills.length !== 1 ? 's' : ''})</span>
                  </h4>
                </div>
                <div className="overflow-x-auto border border-t-0 border-gray-200 rounded-b-lg">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</td>
                        <td className="hidden md:table-cell px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</td>
                        <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</td>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.bills.map((bill) => (
                        <tr key={bill._id} className={bill.isDeleted ? 'bg-red-50' : ''}>
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bill.isDeleted && <span className="text-red-600 mr-1">[DELETED]</span>}
                            <div>{bill.billId || bill._id.slice(-8)}</div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mt-1 ${bill.billType === 'REFERENCE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {bill.billType || 'ORDINARY'}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div>{bill.customerName}</div>
                            <div>{bill.customerMobileNumber}</div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bill.worker ? bill.worker.name : 'N/A'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bill.items.map(item => (
                              <div key={item._id}>
                                {item.productName || (item.product ? item.product.name : '[Deleted Product]')} ({item.quantity} {item.unit || (item.product ? item.product.unit : 'unit')})
                              </div>
                            ))}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div>₹{bill.totalAmount.toFixed(2)}</div>
                            <div className="text-xs text-gray-400">({bill.paymentMethod})</div>
                          </td>
                          <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bill.billDate ? (
                              <>
                                <div>{formatDateTime(bill.billDate).date}</div>
                                <div className="text-xs text-gray-500">{formatDateTime(bill.billDate).time}</div>
                              </>
                            ) : bill.createdAt ? (
                              <>
                                <div>{formatDateTime(bill.createdAt).date}</div>
                                <div className="text-xs text-gray-500">{formatDateTime(bill.createdAt).time}</div>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                            {bill.isDeleted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Deleted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => viewBillDetails(bill)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-2 rounded-md transition-colors duration-200"
                              title="View"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {!bill.isDeleted && (
                              <>
                                <button
                                  onClick={() => handleEditPaymentMethod(bill)}
                                  className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 p-2 rounded-md transition-colors duration-200"
                                  title="Edit Payment Method"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(bill)}
                                  className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-md transition-colors duration-200"
                                  title="Download PDF"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {!bill.isDeleted && (
                              <button
                                onClick={() => handleDeleteClick(bill)}
                                className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-md transition-colors duration-200"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMoreDays && (
              <div className="flex justify-center mt-4 mb-2">
                <button
                  onClick={() => setVisibleDays(prev => prev + 2)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Load More ({groupedByDate.length - visibleDays} more day{groupedByDate.length - visibleDays !== 1 ? 's' : ''})
                </button>
              </div>
            )}

            {!hasMoreDays && groupedByDate.length > 0 && (
              <div className="text-center text-sm text-gray-400 mt-4 mb-2">
                All {groupedByDate.length} day{groupedByDate.length !== 1 ? 's' : ''} loaded
              </div>
            )}
          </>
        )
      }

      {/* Bill Detail Modal */}
      {
        isBillDetailModalOpen && selectedBill && (
          <BillDetailView
            bill={selectedBill}
            onClose={() => setIsBillDetailModalOpen(false)}
            onUpdate={fetchBills}
            initialEditMode={initialEditMode}
          />
        )
      }

      {/* Delete Confirmation Modal */}
      {
        isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Bill Deletion</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to restore quantities for this deleted bill? This will add the quantities back to the product stock.</p>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Reason for Deletion *</label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Wrong item billed">Wrong item billed</option>
                  <option value="Wrong quantity / price">Wrong quantity / price</option>
                  <option value="Customer cancellation">Customer cancellation</option>
                  <option value="Duplicate bill">Duplicate bill</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {deletionReason === 'Other' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Please specify reason</label>
                  <input
                    type="text"
                    value={customDeletionReason}
                    onChange={(e) => setCustomDeletionReason(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the reason for deletion"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                  disabled={deletionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  disabled={deletionLoading || !deletionReason.trim()}
                >
                  {deletionLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Excel Download Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Bills Excel</h3>
            <p className="text-gray-600 mb-4">Select the date range for the bills you want to download.</p>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">From Date</label>
              <input
                type="date"
                value={excelFromDate}
                onChange={(e) => setExcelFromDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">To Date</label>
              <input
                type="date"
                value={excelToDate}
                onChange={(e) => setExcelToDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmExcelDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                disabled={!excelFromDate || !excelToDate}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}

export default AdminViewBills;

