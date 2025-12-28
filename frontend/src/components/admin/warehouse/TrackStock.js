// File: frontend/src/components/admin/warehouse/TrackStock.js

import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuDownload } from 'react-icons/lu';
import { generateStockReportPdf } from '../../../utils/generateStockReportPdf';

function TrackStock({ baseUrl = '/admin' }) {
  const PRODUCTS_URL = `${baseUrl}/products`;
  const SHOPS_URL = '/admin/shops';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedThreshold, setEditedThreshold] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState('');
  
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('admin');
  
  const exportToPdf = () => {
    // Prepare filter information for the report
    const filterInfo = {};
    if (selectedShop !== 'admin') {
      const selectedShopName = shops.find(shop => shop._id === selectedShop)?.name || 'All Shops';
      filterInfo.shop = selectedShopName;
    } else {
      filterInfo.shop = 'Admin Products Only';
    }
    
    generateStockReportPdf(products, filterInfo);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let params = {};
        if (selectedShop === 'admin') {
          params = { showAdmin: true };
        } else if (selectedShop) {
          params = { shopId: selectedShop };
        }
        
        const response = await axios.get(PRODUCTS_URL, {
          params,
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setProducts(response.data);
      } catch (err) {
        setError('Failed to fetch product data.');
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
    
    if (baseUrl === '/admin') {
      fetchShops();
    }
    fetchProducts();
  }, [baseUrl, selectedShop]);

  const handleEdit = (product) => {
    setEditingProductId(product._id);
    setEditedThreshold(product.stockAlertThreshold || '');
    setEditingUnit(product.prices && product.prices.length > 0 ? product.prices[0].unit : product.unit || '');
    setIsModalOpen(true);
};

const handleCancel = () => {
  setEditingProductId(null);
  setEditedThreshold('');
  setEditingUnit('');
  setIsModalOpen(false);
};

  const handleUpdate = async (productId) => {
    try {
      await axios.put(`${PRODUCTS_URL}/${productId}`, {
        stockAlertThreshold: editedThreshold,
      });
      setProducts(
        products.map((p) =>
          p._id === productId ? { ...p, stockAlertThreshold: editedThreshold } : p
        )
      );
      handleCancel();
    } catch (err) {
      setError('Failed to update threshold.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading stock data...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Track Stock</h3>
        <button 
          onClick={exportToPdf}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          disabled={products.length === 0}
        >
          <LuDownload className="mr-2" />
          Download PDF
        </button>
      </div>
      
      {/* Add the filter dropdown */}
      {baseUrl === '/admin' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Shop</label>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin Products Only</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Price</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Total Stock Value</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Alert Threshold</th>
        </tr>
      </thead>
        <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.prices && product.prices.length > 0 ?
                  `₹${(product.prices[0].netPrice || 0).toFixed(2)} (${product.prices[0].unit})` :
                  `₹0.00`}
              </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockLevel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                {product.prices && product.prices.length > 0 ?
                  `₹${((product.stockLevel || 0) * (product.prices[0].netPrice || 0)).toFixed(2)}` :
                  `₹0.00`}
              </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center justify-between">
                  <span>{product.stockAlertThreshold} {product.unit}</span>
                  <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </div>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
       <div className="relative m-4 p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Stock Alert Threshold</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Threshold</label>
              <input
        type="text"
        value={editedThreshold}
        onChange={(e) => setEditedThreshold(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
    <span className="ml-2 text-gray-500">{editingUnit}</span>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={() => handleUpdate(editingProductId)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackStock;