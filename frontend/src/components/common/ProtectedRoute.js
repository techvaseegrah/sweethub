import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], fallbackPath = "/", requiredRole = null }) => {
  const { authState } = useContext(AuthContext);

  // If no user is authenticated, redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(authState?.role)) {
      // If user doesn't have required role, redirect based on their role
      if (authState?.role === 'attendance-only') {
        // Attendance-only users should be redirected to attendance page
        if (authState.userType === 'shop') {
          return <Navigate to="/shop/workers/attendance" replace />;
        } else {
          // Default to admin attendance if userType is not specified
          return <Navigate to="/admin/workers/attendance" replace />;
        }
      }
      // For other unauthorized access, redirect to fallback path
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Additional check for specific role requirements
  if (requiredRole && authState?.role !== requiredRole) {
    // If user doesn't have the required specific role, redirect
    if (authState?.role === 'attendance-only') {
      if (authState.userType === 'shop') {
        return <Navigate to="/shop/workers/attendance" replace />;
      } else {
        return <Navigate to="/admin/workers/attendance" replace />;
      }
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;