import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Determine the base URL based on user role
  const getBaseUrl = () => {
    return authState.role === 'shop' ? '/shop' : '/admin';
  };

  // Fetch units from the backend
  const fetchUnits = useCallback(async () => {
    // Only fetch units if user is authenticated and has a role
    if (!authState.token || !authState.role) {
      console.log('No authenticated user, using default units');
      setUnits(defaultUnits);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const baseUrl = getBaseUrl();
      const response = await axios.get(`${baseUrl}/products/units`, { withCredentials: true });
      // Ensure default units are always present and the list is unique
      const allUnits = [...new Set([...defaultUnits, ...response.data])];
      setUnits(allUnits);
    } catch (err) {
      // Handle 401 errors gracefully (user not authenticated)
      if (err.response?.status === 401) {
        // Don't set error for 401, as this is expected when not logged in
        // Just use default units
        console.log('401 error fetching units - using default units');
        setUnits(defaultUnits);
      } else if (err.response?.status === 403) {
        // Handle 403 errors (Forbidden) - likely a role mismatch
        console.log('403 error fetching units - using default units');
        setUnits(defaultUnits);
      } else {
        setError('Failed to fetch units');
        console.error('Error fetching units:', err);
        // Still set default units as fallback
        setUnits(defaultUnits);
      }
    } finally {
      setLoading(false);
    }
  }, [defaultUnits, authState.token, authState.role]);

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
    if (!authState.token || !authState.role) {
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