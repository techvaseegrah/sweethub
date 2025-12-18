import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function StockAlerts({ baseUrl = '/admin' }) {
  const PRODUCTS_URL = `${baseUrl}/products`;
  const SHOPS_URL = '/admin/shops';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('admin');
  const [shopAlertCounts, setShopAlertCounts] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(SHOPS_URL, { withCredentials: true });
        setShops(response.data);
      } catch (err) {
        setError('Failed to fetch shops.');
      }
    };

    if (baseUrl === '/admin') {
      fetchShops();
    }
  }, [baseUrl]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let params = {};
        if (baseUrl === '/admin') {
          if (selectedShop === 'admin') {
            params = { showAdmin: true };
          } else if (selectedShop) {
            params = { shopId: selectedShop };
          }
        }
  
        const CATEGORY_URL = `${baseUrl}/categories`;
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(PRODUCTS_URL, { params, withCredentials: true }),
          axios.get(CATEGORY_URL, { withCredentials: true })
        ]);
  
        const lowStockProducts = productsResponse.data.filter(
          (product) => product.stockLevel <= (product.stockAlertThreshold || 0)
        );
        setProducts(lowStockProducts);
        setCategories(categoriesResponse.data);
  
      } catch (err) {
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [selectedShop, baseUrl, PRODUCTS_URL]);

  useEffect(() => {
    const calculateAllAlerts = async () => {
      try {
        const allProductsResponse = await axios.get(PRODUCTS_URL, { withCredentials: true });
        const allProducts = allProductsResponse.data;
        
        const counts = {};
  
        counts.admin = allProducts.filter(
          (p) => !p.shop && p.stockLevel <= (p.stockAlertThreshold || 0)
        ).length;
  
        shops.forEach(shop => {
          counts[shop._id] = allProducts.filter(
            (p) => p.shop === shop._id && p.stockLevel <= (p.stockAlertThreshold || 0)
          ).length;
        });
  
        setShopAlertCounts(counts);
      } catch (err) {
        console.error('Failed to calculate all alert counts:', err);
      }
    };
  
    if (baseUrl === '/admin' && shops.length > 0) {
      calculateAllAlerts();
    }
  }, [baseUrl, shops, PRODUCTS_URL]);

  useEffect(() => {
    let tempProducts = [...products];
  
    if (selectedCategory !== 'All') {
      tempProducts = tempProducts.filter(
        (product) => product.category?._id === selectedCategory
      );
    }
  
    if (searchTerm) {
      tempProducts = tempProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  
    setFilteredProducts(tempProducts);
  }, [products, selectedCategory, searchTerm]);

  const handleShopSelect = (shopId) => {
    setSelectedShop(shopId);
    setIsDropdownOpen(false);
  };

  if (loading) return (
    <div className="p-4 flex flex-col items-center justify-center">
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

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-text-primary">Stock Alerts</h3>
      {/* New: Alerts Dashboard Section */}
      {baseUrl === '/admin' && (
       <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div 
            className={`p-4 rounded-lg shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              selectedShop === 'admin' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => handleShopSelect('admin')}
          >
            <span className="text-text-primary font-medium">Admin</span>
            <span className={`text-3xl font-bold mt-1 ${shopAlertCounts.admin > 0 ? 'text-primary' : 'text-text-secondary'}`}>
              {shopAlertCounts.admin || 0}
            </span>
            <span className="text-text-secondary">Products</span>
          </div>

          
          {shops.map(shop => (
            <div 
              key={shop._id}
              className={`p-4 rounded-lg shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                selectedShop === shop._id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => handleShopSelect(shop._id)}
            >
              <span className="text-text-primary font-medium">{shop.name}</span>
              <span className={`text-3xl font-bold mt-1 ${shopAlertCounts[shop._id] > 0 ? 'text-primary' : 'text-text-secondary'}`}>
                {shopAlertCounts[shop._id] || 0}
              </span>
              <span className="text-text-secondary">Products</span>
            </div>
          ))}
        </div>
      )}
      <hr className="my-6 border-gray-300" />
      {/* End New Section */}

      <div className="flex flex-wrap items-end gap-4 mb-4">
  {baseUrl === '/admin' && (
    <div className="flex-1 min-w-[200px]">
      <label className="block text-text-secondary text-sm font-medium mb-1">Filter by Shop</label>
      {/* Custom Dropdown Code remains here - no changes needed inside it */}
      <div className="relative">
            <button
                type="button"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <span>
                {selectedShop === 'admin' ? 'Admin Products' : (shops.find(s => s._id === selectedShop)?.name || 'Select Shop')}
                </span>
                <span className="text-xs">▼</span>
            </button>

            {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <ul>
                    <li
                    className="px-4 py-2 hover:bg-light-gray cursor-pointer flex justify-between items-center"
                    onClick={() => handleShopSelect('admin')}
                    >
                    <span>Admin Products</span>
                    {shopAlertCounts.admin > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                        {shopAlertCounts.admin}
                        </span>
                    )}
                    </li>
                    {shops.map((shop) => (
                    <li
                        key={shop._id}
                        className="px-4 py-2 hover:bg-light-gray cursor-pointer flex justify-between items-center"
                        onClick={() => handleShopSelect(shop._id)}
                    >
                        <span>{shop.name}</span>
                        {shopAlertCounts[shop._id] > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                            {shopAlertCounts[shop._id]}
                        </span>
                        )}
                    </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
    </div>
  )}

  <div className="flex-1 min-w-[200px]">
    <label className="block text-text-secondary text-sm font-medium mb-1">Search by Name or SKU</label>
    <input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>

  <div className="flex-1 min-w-[200px]">
    <label className="block text-text-secondary text-sm font-medium mb-1">Filter by Category</label>
    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="All">All Categories</option>
      {categories.map((cat) => (
        <option key={cat._id} value={cat._id}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>
</div>

{filteredProducts.length === 0 ? (
  <p className="text-gray-500">No stock alerts match your filters.</p>
) : (
  <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-light-gray">
          <tr>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product Name</th>
           <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
           <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Stock Level</th>
           <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Alert Threshold</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredProducts.map((product) => (
            <tr key={product._id} className="hover:bg-gray-50">
             <td className="px-2 sm:px-6 py-4 whitespace-nowrap">{product.name}</td>
             <td className="px-2 sm:px-6 py-4 whitespace-nowrap">{product.category?.name || 'N/A'}</td>
            <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-red-600 font-bold">{product.stockLevel}</td>
              <td className="px-2 sm:px-6 py-4 whitespace-nowrap">{product.stockAlertThreshold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
)}

    </div>
  );
}

export default StockAlerts;