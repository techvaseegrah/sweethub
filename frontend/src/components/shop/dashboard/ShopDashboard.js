import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuBuilding, LuUsers, LuBoxes, LuFileText, LuDollarSign, LuSettings } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

const SHOP_URL = '/shop';

function ShopDashboard() {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${SHOP_URL}/dashboard`, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
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

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Navigation handlers
  const handleDepartmentsClick = () => {
    navigate('/shop/departments/create');
  };

  const handleWorkersClick = () => {
    navigate('/shop/workers/view');
  };

  const handleProductsClick = () => {
    navigate('/shop/products/view');
  };

  const handleInvoicesClick = () => {
    navigate('/shop/billing/view');
  };

  const handleSalesClick = () => {
    navigate('/shop/billing/view');
  };

  // Add handler for settings
  const handleSettingsClick = () => {
    navigate('/shop/settings');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Shop Dashboard</h2>
        <p className="text-gray-600">Overview of your shop's performance and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Departments Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={handleDepartmentsClick}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <LuBuilding className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Departments</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.departments?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Workers Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={handleWorkersClick}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <LuUsers className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Workers</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.workers?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={handleProductsClick}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <LuBoxes className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stockLevels?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Invoices Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={handleInvoicesClick}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <LuFileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Invoices</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.invoiceCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
          onClick={handleSettingsClick}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-100">
              <LuSettings className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Settings</h3>
              <p className="text-2xl font-bold text-gray-900">Manage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors duration-300"
            onClick={handleSalesClick}
          >
            <div className="flex items-center">
              <LuDollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-blue-600 font-medium">Total Sales</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(dashboardData.totalSales)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments List */}
      {dashboardData.departments && dashboardData.departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Departments</h3>
            <button 
              onClick={handleDepartmentsClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.departments.map((dept) => (
              <div key={dept._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <LuBuilding className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{dept.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers List */}
      {dashboardData.workers && dashboardData.workers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Workers</h3>
            <button 
              onClick={handleWorkersClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.workers.map((worker) => (
              <div key={worker._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100">
                    <LuUsers className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{worker.name}</h4>
                    <p className="text-sm text-gray-500">
                      {worker.workingHours?.from} - {worker.workingHours?.to}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Levels */}
      {dashboardData.stockLevels && dashboardData.stockLevels.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Current Stock Levels</h3>
            <button 
              onClick={handleProductsClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.stockLevels.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stockLevel} {product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopDashboard;