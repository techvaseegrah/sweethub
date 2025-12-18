import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    role: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setAuthState({ token, role });
    }
  }, []);

  const login = (token, role) => {
    console.log('Logging in with token and role:', { token, role });
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setAuthState({ token, role });
  };

  const logout = () => {
    console.log('Logging out - clearing localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuthState({ token: null, role: null });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};