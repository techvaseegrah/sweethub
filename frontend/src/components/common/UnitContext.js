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

  // Fetch units from the backend
  const fetchUnits = useCallback(async () => {
    // Prevent simultaneous fetches
    if (fetchingRef.current) return;

    // Determine the base URL based on user role
    const getBaseUrl = () => {
      if (authState?.role === 'shop') {
        return '/shop';
      } else if (authState?.role === 'attendance-only' || authState?.role === 'raw-materials-only' || authState?.role === 'before-packing-only' || authState?.role === 'after-packing-only') {
        // Attendance-only and raw-materials-only users should not need units, return shop as default to avoid 403
        return '/shop';
      } else {
        return '/admin';
      }
    };

    // Only fetch units if user is authenticated and has a role
    // Attendance-only, raw-materials-only, and packing users don't need units, so skip fetching for them
    const skipFetchRoles = ['attendance-only', 'raw-materials-only', 'before-packing-only', 'after-packing-only'];
    if (!authState.token || !authState?.role || skipFetchRoles.includes(authState.role)) {
      console.log('Skipping units fetch for ' + (authState?.role || 'unauthenticated') + ' user, using default units');
      setUnits(defaultUnits);
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      const baseUrl = getBaseUrl();
      const response = await axios.get(`${baseUrl}/products/units`, { withCredentials: true });

      // Only update if data actually arrived
      if (response.data && Array.isArray(response.data)) {
        // Ensure default units are always present and the list is unique
        const allUnits = [...new Set([...defaultUnits, ...response.data])];

        // Simple comparison to prevent unnecessary state updates
        setUnits(prev => {
          if (JSON.stringify(prev) === JSON.stringify(allUnits)) return prev;
          return allUnits;
        });
      }
    } catch (err) {
      // Handle 401/403 errors gracefully
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log(`${err.response.status} error fetching units - using default units`);
        setUnits(defaultUnits);
      } else {
        setError('Failed to fetch units');
        console.error('Error fetching units:', err);
        setUnits(defaultUnits);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [defaultUnits, authState.token, authState?.role]);

  // Add a new unit
  const addUnit = async (unitName) => {
    if (!unitName.trim()) {
      throw new Error('Unit name cannot be empty');
    }

    if (units.includes(unitName.trim())) {
      throw new Error('Unit already exists');
    }

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
    // Don't allow removal of default units
    if (defaultUnits.includes(unitName)) {
      throw new Error('Cannot remove default units');
    }

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
    // Only check if user is authenticated
    if (!authState.token || !authState?.role) {
      return false;
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await axios.get(`${baseUrl}/products/units/in-use/${unitName}`, { withCredentials: true });
      return response.data.inUse;
    } catch (err) {
      // Handle 401 errors gracefully
      if (err.response?.status === 401) {
        return false; // Assume not in use if not authenticated
      }
      if (err.response?.status === 403) {
        return false; // Assume not in use if forbidden
      }
      console.error('Error checking if unit is in use:', err);
      return false;
    }
  };

  // Initialize units on component mount and when auth state changes
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