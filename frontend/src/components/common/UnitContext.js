import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

// Create the context
const UnitContext = createContext();

// Custom hook to use the unit context
export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};

// Unit Provider component
export const UnitProvider = ({ children }) => {
  const [units, setUnits] = useState([]);
  const [defaultUnits] = useState(['piece', 'kg', 'gram', 'box']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useContext(AuthContext);

  // Use a ref to prevent redundant/overlapping fetches
  const fetchingRef = useRef(false);

  // Helper to determine base URL based on role - Defined here so all functions can use it
  const getBaseUrl = useCallback(() => {
    if (authState?.role === 'shop') {
      return '/shop';
    } else if (
      authState?.role === 'attendance-only' ||
      authState?.role === 'raw-materials-only' ||
      authState?.role === 'before-packing-only' ||
      authState?.role === 'after-packing-only'
    ) {
      return '/shop';
    } else {
      return '/admin';
    }
  }, [authState?.role]);

  // Fetch units from the backend
  const fetchUnits = useCallback(async () => {
    if (fetchingRef.current) return;

    const skipFetchRoles = ['attendance-only', 'raw-materials-only', 'before-packing-only', 'after-packing-only'];
    if (!authState.token || !authState?.role || skipFetchRoles.includes(authState.role)) {
      setUnits(defaultUnits);
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      const baseUrl = getBaseUrl();
      const response = await axios.get(`${baseUrl}/products/units`, { withCredentials: true });

      if (response.data && Array.isArray(response.data)) {
        const allUnits = [...new Set([...defaultUnits, ...response.data])];
        setUnits(prev => {
          if (JSON.stringify(prev) === JSON.stringify(allUnits)) return prev;
          return allUnits;
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUnits(defaultUnits);
      } else {
        setError('Failed to fetch units');
        setUnits(defaultUnits);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [defaultUnits, authState.token, authState?.role, getBaseUrl]);

  // Add a new unit
  const addUnit = async (unitName) => {
    if (!unitName.trim()) throw new Error('Unit name cannot be empty');
    if (units.includes(unitName.trim())) throw new Error('Unit already exists');

    try {
      const updatedUnits = [...units, unitName.trim()];
      setUnits(updatedUnits);
      return unitName.trim();
    } catch (err) {
      throw new Error('Failed to add unit');
    }
  };

  // Delete a unit
  const deleteUnit = async (unitName) => {
    if (defaultUnits.includes(unitName)) throw new Error('Cannot remove default units');

    try {
      const updatedUnits = units.filter(unit => unit !== unitName);
      setUnits(updatedUnits);
      return true;
    } catch (err) {
      throw new Error('Failed to delete unit');
    }
  };

  // Check if a unit is in use
  const isUnitInUse = async (unitName) => {
    if (!authState.token || !authState?.role) return false;

    try {
      const baseUrl = getBaseUrl(); // This now works because getBaseUrl is in scope
      const response = await axios.get(`${baseUrl}/products/units/in-use/${unitName}`, { withCredentials: true });
      return response.data.inUse;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) return false;
      console.error('Error checking if unit is in use:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return (
    <UnitContext.Provider value={{
      units,
      defaultUnits,
      loading,
      error,
      addUnit,
      deleteUnit,
      isUnitInUse,
      fetchUnits
    }}>
      {children}
    </UnitContext.Provider>
  );
};