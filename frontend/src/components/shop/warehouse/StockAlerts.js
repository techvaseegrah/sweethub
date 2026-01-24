import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function StockAlerts({ baseUrl = '/shop' }) {
  const PRODUCTS_URL = `${baseUrl}/products`;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const CATEGORY_URL = `${baseUrl}/categories`;
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${baseUrl}/products/stock-alerts`, { withCredentials: true }),
          axios.get(CATEGORY_URL, { withCredentials: true })
        ]);

        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);

      } catch (err) {
        setError('Failed to fetch data.');
        console.error('Error fetching stock alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl]);

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-text-primary">Stock Alerts</h3>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-4">
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