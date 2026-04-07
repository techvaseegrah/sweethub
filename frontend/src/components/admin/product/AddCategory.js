import React, { useState, useEffect, useContext } from 'react';
import axios from '../../../api/axios';
import CreateProductBillingAccountModal from './CreateProductBillingAccountModal';
import { AuthContext } from '../../../context/AuthContext';

function AddCategory({ baseUrl = '/admin' }) {
  const isShop = baseUrl.includes('shop');
  const { authState } = useContext(AuthContext);
  const isProductBilling = authState?.role === 'product-billing-admin' || authState?.role === 'product-billing-shop';
  
  const [showAccountModal, setShowAccountModal] = useState(false);
  const CATEGORY_URL = `${baseUrl}/categories`;
  const SHOPS_URL = `${baseUrl}/shops`;
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      const params = { showAdmin: true }; // Always fetch admin categories
      const response = await axios.get(CATEGORY_URL, { params, withCredentials: true });
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [CATEGORY_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = {
        name: categoryName,
        // Don't set shop for shop users, let backend handle it based on auth
      };

      await axios.post(
        CATEGORY_URL,
        JSON.stringify(payload),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setMessage(`Category "${categoryName}" created successfully!`);
      setCategoryName('');
      fetchCategories();
    } catch (err) {
      // Handle specific error message for duplicate category
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create category. Please check the form data.');
      }
      console.error(err);
    }
  };

  const confirmDelete = (id) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await axios.delete(`${CATEGORY_URL}/${categoryToDelete}`, {
        withCredentials: true,
      });
      setMessage('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category.');
      console.error(err);
    } finally {
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
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
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
          {isProductBilling ? 'View Categories' : 'Add Category'}
        </h3>
        {!isProductBilling && (
          <button
            onClick={() => setShowAccountModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Create Account
          </button>
        )}
      </div>
      {!isProductBilling && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryName">
              Category Name
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Create Category
          </button>
        </form>
      )}
      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800"></h3>
        {categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category._id} className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-gray-900">
                  {category.name} <span className="text-sm text-gray-500">({category.products.length} products)</span>
                </p>
                <div className="w-full flex justify-end sm:w-auto">
                  {!isProductBilling && (
                    <button
                      onClick={() => confirmDelete(category._id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center transform transition-all">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Category</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={cancelDelete}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Account Creation Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-red-600 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Create Product-Billing Account</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-white hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreateProductBillingAccountModal
              onClose={() => setShowAccountModal(false)}
              onAccountCreated={() => { }}
              isShop={isShop}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AddCategory;
