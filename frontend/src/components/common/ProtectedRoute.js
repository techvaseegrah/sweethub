import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], fallbackPath = "/", requiredRole = null }) => {
  const { authState } = useContext(AuthContext);

  // If no user is authenticated, redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Special handling for attendance-only users - restrict to attendance module only
  if (authState?.role === 'attendance-only') {
    // Check if we're trying to access a route that's NOT the attendance module
    const currentPath = window.location.pathname;

    // Check if the current path is for attendance
    const isAdminAttendancePath = currentPath.startsWith('/admin/workers/attendance');
    const isShopAttendancePath = currentPath.startsWith('/shop/workers/attendance');

    // If user is shop attendance-only but trying to access admin routes, redirect to shop attendance
    if (authState.userType === 'shop' && currentPath.startsWith('/admin') && !isAdminAttendancePath) {
      return <Navigate to="/shop/workers/attendance" replace />;
    }

    // If user is admin attendance-only but trying to access shop routes, redirect to admin attendance
    if (authState.userType !== 'shop' && currentPath.startsWith('/shop') && !isShopAttendancePath) {
      return <Navigate to="/admin/workers/attendance" replace />;
    }

    // If user is shop attendance-only and accessing shop section but not attendance
    if (authState.userType === 'shop' && currentPath.startsWith('/shop/') && !isShopAttendancePath) {
      return <Navigate to="/shop/workers/attendance" replace />;
    }

    // If user is admin attendance-only and accessing admin section but not attendance
    if (authState.userType !== 'shop' && currentPath.startsWith('/admin/') && !isAdminAttendancePath) {
      return <Navigate to="/admin/workers/attendance" replace />;
    }
  }

  // Special handling for before-packing-only users - restrict to before packing modules only
  if (authState?.role === 'before-packing-only') {
    const currentPath = window.location.pathname;

    // Define allowed paths for before-packing-only users
    const isBeforePackingPath = currentPath.startsWith('/admin/warehouse/before-packing');
    const isDashboardPath = currentPath === '/admin/dashboard';

    // If accessing unauthorized paths, redirect to before packing module
    if (!isBeforePackingPath && !isDashboardPath) {
      return <Navigate to="/admin/warehouse/before-packing" replace />;
    }
  }

  // Special handling for after-packing-only users - restrict to after packing modules only
  if (authState?.role === 'after-packing-only') {
    const currentPath = window.location.pathname;

    // Define allowed paths for after-packing-only users
    const isAfterPackingPath = currentPath.startsWith('/admin/warehouse/after-packing');
    const isDashboardPath = currentPath === '/admin/dashboard';

    // If accessing unauthorized paths, redirect to after packing module
    if (!isAfterPackingPath && !isDashboardPath) {
      return <Navigate to="/admin/warehouse/after-packing" replace />;
    }
  }

  // Special handling for warehouse-only users
  if (authState?.role === 'warehouse-only' || authState?.role === 'raw-materials') {
    const currentPath = window.location.pathname;
    const isWarehousePath = currentPath.startsWith('/admin/warehouse');
    const isDashboardPath = currentPath === '/admin/dashboard';

    if (!isWarehousePath && !isDashboardPath) {
      return <Navigate to="/admin/dashboard" replace />;
    }
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
