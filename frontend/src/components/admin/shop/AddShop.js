import React, { useState } from 'react';
import axios from '../../../api/axios';
import { Eye, EyeOff } from 'lucide-react';

const SHOPS_URL = '/admin/shops';

function AddShop() {
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopPhoneNumber, setShopPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post(
        SHOPS_URL,
        JSON.stringify({ name: shopName, location: shopLocation, shopPhoneNumber, username, password }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setMessage(`Shop "${shopName}" created successfully! The shop worker can log in with username: ${username}.`);
      setShopName('');
      setShopLocation('');
      setShopPhoneNumber('');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add shop. Please check the form data.');
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Add New Shop</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="shopName">
            Shop Name
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="shopPhoneNumber">
            Shop Phone Number
          </label>
          <input
            type="tel"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="shopPhoneNumber"
            value={shopPhoneNumber}
            onChange={(e) => setShopPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="shopLocation">
            Shop Location
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="shopLocation"
            value={shopLocation}
            onChange={(e) => setShopLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Shop Worker Username
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Shop Worker Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/1 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button
          type="submit"
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Shop
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default AddShop;