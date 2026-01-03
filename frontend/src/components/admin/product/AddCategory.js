import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function AddCategory({ baseUrl = '/admin' }) {
  const CATEGORY_URL = `${baseUrl}/categories`;
  const SHOPS_URL = `${baseUrl}/shops`;
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
      setError('Failed to create category. Please check the form data.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${CATEGORY_URL}/${id}`, {
        withCredentials: true,
      });
      setMessage('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category.');
      console.error(err);
    }
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
     <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800"></h3>
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
  <button
    onClick={() => handleDelete(category._id)}
    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
  >
    Delete
  </button>
</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AddCategory;