import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAttendanceOnlyProtection = () => {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Only apply this protection for attendance-only users
    if (authState?.role === 'attendance-only') {
      const currentPath = window.location.pathname;
      
      // Define attendance routes for both admin and shop
      const adminAttendanceRoutes = [
        '/admin/workers/attendance',
        '/admin/workers/attendance/'
      ];
      
      const shopAttendanceRoutes = [
        '/shop/workers/attendance',
        '/shop/workers/attendance/'
      ];
      
      // Check if current path is NOT an attendance route
      const isAdminAttendanceRoute = adminAttendanceRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );
      
      const isShopAttendanceRoute = shopAttendanceRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );
      
      // If accessing non-attendance routes, redirect to appropriate attendance page
      if (authState.userType === 'shop' && !isShopAttendanceRoute) {
        navigate('/shop/workers/attendance', { replace: true });
      } else if (authState.userType !== 'shop' && !isAdminAttendanceRoute) {
        navigate('/admin/workers/attendance', { replace: true });
      }
    }
  }, [authState, navigate]);
};

export default useAttendanceOnlyProtection;