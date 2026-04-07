import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    role: null,
    userType: null, // 'admin' or 'shop'
    isAuthenticated: false,
    allowedCategories: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    const allowedCategories = JSON.parse(localStorage.getItem('allowedCategories') || '[]');
    if (token && role) {
      setAuthState({ token, role, userType, allowedCategories, isAuthenticated: true });
    }
  }, []);

  const login = (token, role, userType = null, allowedCategories = []) => {
    console.log('Logging in with token, role, and userType:', { token, role, userType });
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (userType) {
      localStorage.setItem('userType', userType);
    }
    localStorage.setItem('allowedCategories', JSON.stringify(allowedCategories));
    setAuthState({ token, role, userType, allowedCategories, isAuthenticated: true });
  };

  const logout = () => {
    console.log('Logging out - clearing localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    localStorage.removeItem('allowedCategories');
    setAuthState({ token: null, role: null, userType: null, allowedCategories: [], isAuthenticated: false });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};