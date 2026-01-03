import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboardPage from './pages/AdminDashboard'; 
import ShopPage from './pages/ShopPage';
import LoginPage from './pages/Auth/LoginPage';
import NotFound from './pages/NotFound';
import { UnitProvider } from './components/common/UnitContext';
import { EWayBillProvider } from './context/EWayBillContext';
import { FullScreenBillProvider } from './context/FullScreenBillContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!appLoaded) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="relative flex justify-center items-center mb-6">
          <div className="w-20 h-20 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo" 
            alt="Sweet Hub Logo" 
            className="absolute w-14 h-14"
          />
        </div>
        <div className="text-red-500 font-medium">Loading Sweet Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <FullScreenBillProvider>
        <UnitProvider>
          <EWayBillProvider>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              
              {/* Admin routes - accessible by admin users, attendance-only users can only access attendance routes */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'attendance-only']} fallbackPath="/">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Shop routes - accessible by shop users, attendance-only users can only access attendance routes */}
              <Route 
                path="/shop/*" 
                element={
                  <ProtectedRoute allowedRoles={['shop', 'attendance-only']} fallbackPath="/">
                    <ShopPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </EWayBillProvider>
        </UnitProvider>
      </FullScreenBillProvider>
    </div>
  );
}

export default App;