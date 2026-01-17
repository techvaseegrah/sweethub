import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useTypewriter, Cursor } from 'react-simple-typewriter'; // Import the typewriter
import { 
    LuUsers, 
    LuBuilding, 
    LuBoxes, 
    LuArchive, 
    LuStore, 
    LuClipboardCheck, 
    LuPackage, 
    LuTrendingUp, 
    LuTriangleAlert, 
    LuActivity,
    LuDollarSign
} from 'react-icons/lu';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    workers: { total: 0, active: 0, onLeave: 0 },
    departments: { total: 0, activeProjects: 0 },
    products: { total: 0, lowStock: 0, outOfStock: 0 },
    storeRoom: { total: 0, lowStock: 0, totalValue: 0 },
    shops: { total: 0, revenue: 0 },
    tasks: { total: 0, pending: 0, completed: 0, overdue: 0 },
    returns: { total: 0, pending: 0, approved: 0, thisMonth: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // --- TYPEWRITER HOOK ---
  const [text] = useTypewriter({
    words: ['Welcome To SweetHub Admin Panel'],
    loop: 1,
    typeSpeed: 70,
    deleteSpeed: 50,
    delaySpeed: 1000,
  });

  const setDateRangeToThisWeek = () => {
    setStartDate(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfWeek(new Date()), 'yyyy-MM-dd'));
  };

  const setDateRangeToThisMonth = () => {
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [workersRes, departmentsRes, productsRes, storeRoomRes, shopsRes, returnsRes] = await Promise.all([
          axios.get('/admin/workers').catch(() => ({ data: [] })),
          axios.get('/admin/departments').catch(() => ({ data: [] })),
          axios.get('/admin/products', { params: { showAdmin: true } }).catch(() => ({ data: [] })),
          axios.get('/admin/warehouse/store-room').catch(() => ({ data: [] })),
          axios.get('/admin/shops').catch(() => ({ data: [] })),
          axios.get('/admin/warehouse/returns').catch(() => ({ data: [] }))
        ]);

        const storeItems = storeRoomRes.data;
        const lowStockItems = storeItems.filter(item => item.quantity <= (item.stockAlertThreshold || 5));
        const totalValue = storeItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        const products = productsRes.data;
        const lowStockProducts = products.filter(product => product.stockLevel <= 10);
        const outOfStockProducts = products.filter(product => product.stockLevel === 0);

        const returns = returnsRes.data;
        const pendingReturns = returns.filter(ret => !ret.isApproved);
        const approvedReturns = returns.filter(ret => ret.isApproved);
        const thisMonthReturns = returns.filter(ret => {
          const returnDate = new Date(ret.dateOfReturn);
          const now = new Date();
          return returnDate.getMonth() === now.getMonth() && returnDate.getFullYear() === now.getFullYear();
        });

        setDashboardData({
          workers: { 
            total: workersRes.data.length, 
            active: workersRes.data.filter(w => w.status === 'active').length || workersRes.data.length,
            onLeave: workersRes.data.filter(w => w.status === 'on-leave').length || 0
          },
          departments: { 
            total: departmentsRes.data.length,
            activeProjects: departmentsRes.data.filter(d => d.isActive !== false).length || departmentsRes.data.length
          },
          products: { 
            total: products.length,
            lowStock: lowStockProducts.length,
            outOfStock: outOfStockProducts.length
          },
          storeRoom: { 
            total: storeItems.length,
            lowStock: lowStockItems.length,
            totalValue: totalValue
          },
          shops: { 
            total: shopsRes.data.length,
            revenue: 0 
          },
          tasks: { 
            total: 0, 
            pending: 0,
            completed: 0,
            overdue: 0
          },
          returns: { 
            total: returns.length,
            pending: pendingReturns.length,
            approved: approvedReturns.length,
            thisMonth: thisMonthReturns.length
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!startDate || !endDate) return;
      
      setRevenueLoading(true);
      setRevenueError('');
      try {
        const response = await axios.get('/admin/profit-loss', {
          params: { startDate, endDate },
          withCredentials: true,
        });
        setRevenueData(response.data);
      } catch (err) {
        setRevenueError('Failed to fetch revenue data.');
        console.error(err);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenueData();
  }, [startDate, endDate]);

  const StatCard = ({ title, mainCount, subtitle, subCount, icon: IconComponent, color, bgColor, route, alert = false }) => (
    <div
      onClick={() => navigate(route)}
      className={`${bgColor} rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {alert && <LuTriangleAlert className="w-5 h-5 text-red-500" />}
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{mainCount}</p>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}: <span className="font-medium">{subCount}</span></p>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-')} bg-opacity-10`}>
          <IconComponent className={`w-8 h-8 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-64">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

        {/* Quick Stats Summary */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <LuTrendingUp className="w-6 h-6 mr-2 text-green-500" />
          Quick Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Store Value</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">₹{dashboardData.storeRoom.totalValue.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Active Workers</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{dashboardData.workers.active}</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">Pending Returns</p>
            <p className="text-base sm:text-lg font-bold text-orange-600">{dashboardData.returns.pending}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Shops</p>
            <p className="text-base sm:text-lg font-bold text-purple-600">{dashboardData.shops.total}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard title="Workers" mainCount={dashboardData.workers.total} subtitle="Active" subCount={dashboardData.workers.active} icon={LuUsers} color="border-blue-500" bgColor="bg-white" route="/admin/workers/view" />
        <StatCard title="Departments" mainCount={dashboardData.departments.total} subtitle="Active Projects" subCount={dashboardData.departments.activeProjects} icon={LuBuilding} color="border-green-500" bgColor="bg-white" route="/admin/departments/view" />
        <StatCard title="Products" mainCount={dashboardData.products.total} subtitle="Low Stock" subCount={dashboardData.products.lowStock} icon={LuBoxes} color="border-purple-500" bgColor="bg-white" route="/admin/products/view" alert={dashboardData.products.outOfStock > 0} />
        <StatCard title="Store Room" mainCount={dashboardData.storeRoom.total} subtitle="Low Stock Items" subCount={dashboardData.storeRoom.lowStock} icon={LuArchive} color="border-orange-500" bgColor="bg-white" route="/admin/warehouse/store-room" alert={dashboardData.storeRoom.lowStock > 0} />
        <StatCard title="Shops" mainCount={dashboardData.shops.total} subtitle="Total Revenue" subCount={`₹${dashboardData.shops.revenue.toLocaleString()}`} icon={LuStore} color="border-pink-500" bgColor="bg-white" route="/admin/shops/view" />
        <StatCard title="Daily Tasks" mainCount={dashboardData.tasks.total} subtitle="Pending" subCount={dashboardData.tasks.pending} icon={LuClipboardCheck} color="border-yellow-500" bgColor="bg-white" route="/admin/tasks/daily" />
        <StatCard title="Returns" mainCount={dashboardData.returns.total} subtitle="This Month" subCount={dashboardData.returns.thisMonth} icon={LuPackage} color="border-red-500" bgColor="bg-white" route="/admin/warehouse/return-products/history" alert={dashboardData.returns.pending > 0} />
      </div>

      {/* --- REVENUE SUMMARY SECTION (CORRECT PLACEMENT) --- */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
          <LuDollarSign className="w-6 h-6 mr-2 text-green-500" />
          Revenue & Profit Summary
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={setDateRangeToThisWeek} className="px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark text-sm">This Week</button>
            <button onClick={setDateRangeToThisMonth} className="px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark text-sm">This Month</button>
          </div>
        </div>
        {revenueLoading ? (
          <p>Loading revenue data...</p>
        ) : revenueError ? (
          <p className="text-red-500">{revenueError}</p>
        ) : revenueData && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800">Total Revenue</h4>
                <p className="text-2xl font-bold text-green-700">₹{revenueData.consolidated.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800">Total Expenses</h4>
                <p className="text-2xl font-bold text-red-700">₹{revenueData.consolidated.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800">Net Profit</h4>
                <p className="text-2xl font-bold text-blue-700">₹{revenueData.consolidated.netProfit.toLocaleString()}</p>
              </div>
            </div>
            <h4 className="text-base font-semibold text-gray-700 mt-6 mb-2">Breakdown by Shop</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net P&L</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.shopData.map((shop) => (
                    <tr key={shop.shopId || 'admin'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{shop.shopName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">₹{shop.revenue.totalBillingProfit.toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">₹{shop.expenses.totalExpenses.toLocaleString()}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-medium ${shop.profitability.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(shop.profitability.netProfit).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">{shop.profitability.profitMargin.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;