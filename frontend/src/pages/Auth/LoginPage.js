import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from '../../api/axios';

const LOGIN_URL = '/auth/login';

function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const loginContainerRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ username, password }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const { token, role } = response.data;
      login(token, role);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      if (!err?.response) {
        setError('No Server Response');
      } else if (err.response?.status === 400) {
        setError('Missing Username or Password');
      } else if (err.response?.status === 401) {
        setError('Unauthorized');
      } else {
        setError('Login Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-white via-red-50 to-white px-4 py-6">
      {/* Static background without animations */}
      <div className="absolute inset-0 z-0">
        {/* Removed animated sweet elements */}
      </div>
      
      <div 
        ref={loginContainerRef}
        className="relative z-10 bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            <img 
              src="/sweethub-logo.png" 
              alt="Sweet Hub Logo" 
              className="h-16 sm:h-20 w-auto animate-cottonCandy"
            />
            {/* Orbiting dots */}
            <div className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full animate-[orbit_4s_linear_infinite]">
              <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full"></span>
              <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-accent-cyan rounded-full"></span>
              <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-accent-green rounded-full"></span>
              <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent-orange rounded-full"></span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-600 mb-2">Sign In</h2>
        <p className="text-center text-gray-600 mb-6">to access your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition duration-200 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="relative flex justify-center items-center mr-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Forgot your password?{' '}
          <Link to="/forgot-password" className="text-red-500 hover:underline">
            Reset it here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;