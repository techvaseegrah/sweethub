import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import axios from '../../api/axios';
import {
  LuLayoutDashboard,
  LuUsers,
  LuBuilding,
  LuBoxes,
  LuFileText,
  LuChevronRight,
  LuReceipt,
  LuPackage,
  LuUserCheck,
  LuLogOut,
  LuRefreshCw,
  LuSettings
} from 'react-icons/lu';
import { AuthContext } from '../../context/AuthContext';
import LogoutConfirmationModal from '../LogoutConfirmationModal';

// Sweet SVG components
const CakeSVG = ({ size = "w-8 h-8", color = "pink" }) => (
  <svg viewBox="0 0 100 100" className={`${size} opacity-20`}>
    {/* Cake base */}
    <rect x="20" y="60" width="60" height="30" rx="5" fill={color === "pink" ? "#ff85a2" : "#ffd166"} />
    {/* Cake middle */}
    <rect x="25" y="45" width="50" height="20" rx="3" fill={color === "pink" ? "#ff6b9c" : "#ffc44d"} />
    {/* Cake top */}
    <rect x="30" y="35" width="40" height="15" rx="2" fill={color === "pink" ? "#ff5286" : "#ffb734"} />
    {/* Candle */}
    <rect x="48" y="25" width="4" height="15" fill="#4ade80" />
    {/* Flame */}
    <path d="M50 20 Q52 15 50 10 Q48 15 50 20" fill="#fbbf24" />
  </svg>
);

const CookieSVG = ({ size = "w-6 h-6", color = "yellow" }) => (
  <svg viewBox="0 0 100 100" className={`${size} opacity-20`}>
    {/* Cookie base */}
    <circle cx="50" cy="50" r="40" fill={color === "yellow" ? "#ffd166" : "#c968ff"} />
    {/* Chocolate chips */}
    <circle cx="40" cy="40" r="4" fill="#78350f" />
    <circle cx="60" cy="35" r="3" fill="#78350f" />
    <circle cx="50" cy="60" r="3.5" fill="#78350f" />
  </svg>
);

const DonutSVG = ({ size = "w-7 h-7", color = "pink" }) => (
  <svg viewBox="0 0 100 100" className={`${size} opacity-20`}>
    {/* Donut outer ring */}
    <circle cx="50" cy="50" r="40" fill={color === "pink" ? "#ff85a2" : "#6dcff6"} />
    {/* Donut hole */}
    <circle cx="50" cy="50" r="15" fill="#f0f0f0" />
    {/* Sprinkles */}
    <circle cx="50" cy="15" r="3" fill="#fbbf24" />
    <circle cx="75" cy="35" r="2.5" fill="#34d399" />
  </svg>
);

const IceCreamSVG = ({ size = "w-6 h-6", color = "pink" }) => (
  <svg viewBox="0 0 100 100" className={`${size} opacity-20`}>
    {/* Cone */}
    <path d="M50 70 L35 90 L65 90 Z" fill="#f59e0b" />
    {/* Ice cream scoop */}
    <circle cx="50" cy="50" r="25" fill={color === "pink" ? "#ff85a2" : "#6dcff6"} />
  </svg>
);

const CandySVG = ({ size = "w-5 h-5", color = "purple" }) => (
  <svg viewBox="0 0 100 100" className={`${size} opacity-20`}>
    {/* Candy wrapper */}
    <path d="M20 30 Q50 10 80 30 L70 70 Q50 90 30 70 Z" fill={color === "purple" ? "#c968ff" : "#ff85a2"} />
    {/* Candy center */}
    <ellipse cx="50" cy="50" rx="20" ry="15" fill="#f0f0f0" />
  </svg>
);

function ShopSidebar() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [shopName, setShopName] = useState('');
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sweetItems, setSweetItems] = useState([]);
  // Removed sweet items to eliminate emoji elements
  // useEffect(() => {
  //   const initialItems = [];
  //   const types = ['cake', 'cookie', 'donut', 'icecream', 'candy'];
  //   const colors = ['pink', 'yellow', 'purple', 'blue'];
  //   
  //   // Create fewer items for sidebar (8 instead of 15)
  //   for (let i = 0; i < 8; i++) {
  //     initialItems.push({
  //       id: i + 1,
  //       type: types[Math.floor(Math.random() * types.length)],
  //       x: `${Math.random() * 100}%`,
  //       y: `${Math.random() * 100}%`,
  //       color: colors[Math.floor(Math.random() * colors.length)],
  //       vx: (Math.random() - 0.5) * 0.3,
  //       vy: (Math.random() - 0.5) * 0.3,
  //       rotation: Math.random() * 360,
  //       rotationSpeed: (Math.random() - 0.5) * 1
  //     });
  //   }
  //   
  //   setSweetItems(initialItems);
  // }, []);

  // Removed sweet items initialization to eliminate emoji elements
  // useEffect(() => {
  //   const initialItems = [];
  //   const types = ['cake', 'cookie', 'donut', 'icecream', 'candy'];
  //   const colors = ['pink', 'yellow', 'purple', 'blue'];
  //   
  //   // Create fewer items for sidebar (8 instead of 15)
  //   for (let i = 0; i < 8; i++) {
  //     initialItems.push({
  //       id: i + 1,
  //       type: types[Math.floor(Math.random() * types.length)],
  //       x: `${Math.random() * 100}%`,
  //       y: `${Math.random() * 100}%`,
  //       color: colors[Math.floor(Math.random() * colors.length)],
  //       vx: (Math.random() - 0.5) * 0.3,
  //       vy: (Math.random() - 0.5) * 0.3,
  //       rotation: Math.random() * 360,
  //       rotationSpeed: (Math.random() - 0.5) * 1
  //     });
  //   }
  //   
  //   setSweetItems(initialItems);
  // }, []);

  // Removed animation effect for sweet items
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setSweetItems(prevItems => 
  //       prevItems.map(item => {
  //         // Update position
  //         let newX = parseFloat(item.x) + item.vx;
  //         let newY = parseFloat(item.y) + item.vy;
  //       className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`})
  //         // Bounce off edges
  //         let newVx = item.vx;
  //         let newVy = item.vy;
  //       className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`})
  //         if (newX <= 0 || newX >= 100) {
  //           newVx = -newVx;
  //           newX = newX <= 0 ? 0 : 100;
  //         }
  //       className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`})
  //         if (newY <= 0 || newY >= 100) {
  //           newVy = -newVy;
  //           newY = newY <= 0 ? 0 : 100;
  //         }
  //       className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`})
  //         // Update rotation
  //         const newRotation = item.rotation + item.rotationSpeed;
  //       className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`})
  //         return {
  //           ...item,
  //           x: `${newX}%`,
  //           y: `${newY}%`,
  //           vx: newVx,
  //           vy: newVy,
  //           rotation: newRotation
  //         };
  //       })
  //     );
  //   }, 50);

  //   return () => clearInterval(interval);
  // }, []);

  const { logout, authState } = useContext(AuthContext);

  // Don't render if authState is not properly initialized yet
  if (!authState || authState.isAuthenticated === undefined) {
    return (
      <div className="h-screen w-64 bg-white flex items-center justify-center border-r border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  useEffect(() => {
    const checkPendingInvoice = async () => {
      try {
        // Only fetch if not an attendance-only user
        if (authState?.role !== 'attendance-only') {
          const response = await axios.get('/shop/invoices/pending');
          setHasPendingInvoice(!!response.data);
        }
      } catch (err) {
        console.error('Failed to check for pending invoices:', err);
      }
    };

    const fetchLowStockCount = async () => {
      try {
        // Only fetch if not an attendance-only user
        if (authState?.role !== 'attendance-only') {
          const response = await axios.get('/shop/products');
          const lowStock = response.data.filter(
            (product) => product.stockLevel <= (product.stockAlertThreshold || 0)
          );
          setLowStockCount(lowStock.length);
        }
      } catch (err) {
        console.error('Failed to fetch low stock count:', err);
      }
    };

    const fetchShopDetails = async () => {
      try {
        // Only fetch if not an attendance-only user
        if (authState?.role !== 'attendance-only') {
          const response = await axios.get('/shop/details');
          setShopName(response.data.name);
        }
      } catch (err) {
        console.error('Failed to fetch shop name:', err);
      }
    };
    
    checkPendingInvoice();
    fetchLowStockCount();
    fetchShopDetails();
  }, [authState?.role]);

  const toggleProductMenu = () => {
    setIsProductMenuOpen(!isProductMenuOpen);
  };

  const sidebarBg = 'bg-white';
  const textPrimary = 'text-gray-700';
  const textSecondary = 'text-gray-500';
  const textAccent = 'text-gray-800';
  const borderColor = 'border-gray-200';
  const hoverBg = 'hover:bg-gray-50';
  const activeRed = 'bg-red-500 text-white shadow-sm';
  const iconColor = 'text-gray-400';
  const iconActive = 'text-white';
  const alertBadge = 'bg-yellow-400 text-gray-800';
  const notificationBadge = 'bg-green-500 text-white';

  return (
    <div className={`h-screen w-64 ${sidebarBg} ${textPrimary} flex flex-col border-r ${borderColor} overflow-hidden shadow-sm relative`}>
      {/* Removed Animated Sweet Elements Background to eliminate emoji elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Sweet elements removed */}
      </div>
      
      <div className="p-6 border-b border-gray-100 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="relative flex items-center justify-center">
              <img
                src="/sweethub-logo.png"
                alt="Sweet Hub Logo"
                className="h-16 w-auto animate-cottonCandy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="absolute h-20 w-20 rounded-full animate-[orbit_4s_linear_infinite]">
                <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full"></span>
                <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-accent-cyan rounded-full"></span>
                <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-accent-green rounded-full"></span>
                <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent-orange rounded-full"></span>
              </div>
            </div>
            <div className="hidden bg-red-500 text-white px-4 py-2 rounded-lg transform rotate-12 shadow-lg">
              <div className="flex items-center">
                <span className="text-green-400 font-bold text-lg mr-1">H</span>
                <div>
                  <div className="text-sm font-bold leading-tight">THE</div>
                  <div className="text-lg font-bold leading-tight">SWEET</div>
                  <div className="text-lg font-bold leading-tight">HUB</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-left">
              <div className={`${textAccent} font-bold text-lg leading-tight`}>Sweet Hub</div>
              <div className={`${textSecondary} text-sm`}>Shop Panel</div>
            </div>
          </div>
          {shopName && (
            <div className={`${textSecondary} font-bold text-red-600 text-lg font-large`}>{shopName}</div>
          )}
        </div>
        
        {/* Close button for mobile - only visible on mobile */}
        <button 
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => window.dispatchEvent(new CustomEvent('close-sidebar'))}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10 overflow-y-auto">
        {authState?.role !== 'attendance-only' && (
        <NavLink
          to="/shop/dashboard"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg ${
              isActive ? activeRed : `${textPrimary} ${hoverBg}`
            }`
          }
          onClick={() => {
            // Close sidebar on mobile when link is clicked
            if (window.innerWidth < 1024) {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
            }
          }}
        >
          {({ isActive }) => (
            <>
              <LuLayoutDashboard className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
              <span className="font-medium">Dashboard</span>
            </>
          )}
        </NavLink>
        )}

        {authState?.role !== 'attendance-only' && (
        <details className="group">
          <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
            <div className="flex items-center">
              <LuUsers className={`mr-3 text-lg ${iconColor}`} />
              <span className="font-medium">Workers</span>
            </div>
            <LuChevronRight className="w-4 h-4 text-gray-400" />
          </summary>
           <nav className="mt-1 ml-6 space-y-1">
             <NavLink to="/shop/workers/add" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Add Worker</span>
              </NavLink>
              <NavLink to="/shop/workers/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">View Workers</span>
              </NavLink>
              <NavLink to="/shop/workers/attendance" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Attendance Tracking</span>
              </NavLink>
              <NavLink to="/shop/workers/salary-report" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Salary Report</span>
              </NavLink>
              <NavLink to="/shop/workers/holidays" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Holidays</span>
              </NavLink>
              <NavLink to="/shop/face-enrollment" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Face Enrollment</span>
              </NavLink>
           </nav>
        </details>
        )}

        {authState?.role !== 'attendance-only' && (
        <details className="group">
          <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
            <div className="flex items-center">
              <LuBuilding className={`mr-3 text-lg ${iconColor}`} />
              <span className="font-medium">Departments</span>
            </div>
            <LuChevronRight className="w-4 h-4 text-gray-400" />
          </summary>
          <nav className="mt-1 ml-6 space-y-1">
             <NavLink to="/shop/departments/create" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Create Department</span>
              </NavLink>
              <NavLink to="/shop/departments/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">View Departments</span>
              </NavLink>
          </nav>
        </details>
        )}

        {authState?.role !== 'attendance-only' && (
        <details className="group" open={isProductMenuOpen} onToggle={toggleProductMenu}>
          <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
            <div className="flex items-center">
              <LuBoxes className={`mr-3 text-lg ${iconColor}`} />
              <span className="font-medium">Products</span>
            </div>
            <div className="flex items-center space-x-2">
              {!isProductMenuOpen && lowStockCount > 0 && (
                <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                  {lowStockCount}
                </span>
              )}
              <LuChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </summary>
          <nav className="mt-1 ml-6 space-y-1">
            <NavLink to="/shop/products/category" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}` }`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">Add Category</span>
            </NavLink>
            <NavLink to="/shop/products/add" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}` }`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">Add Product</span>
            </NavLink>
            <NavLink to="/shop/products/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}` }`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">View Products</span>
            </NavLink>
            <NavLink to="/shop/warehouse/stock" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}` }`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">Track Stock</span>
            </NavLink>
            <NavLink to="/shop/warehouse/alerts" className={({ isActive }) => `flex items-center justify-between px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}` }`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">Stock Alerts</span>
              {isProductMenuOpen && lowStockCount > 0 && (
                <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                  {lowStockCount}
                </span>
              )}
            </NavLink>
          </nav>
        </details>
        )}

        {authState?.role !== 'attendance-only' && (
        <NavLink
          to="/shop/invoice/view"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-lg ${
              isActive ? activeRed : `${textPrimary} ${hoverBg}`
            }`
          }
          onClick={() => {
            // Close sidebar on mobile when link is clicked
            if (window.innerWidth < 1024) {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
            }
          }}
        >
          <div className="flex items-center">
            <LuFileText className={`mr-3 text-lg ${iconColor}`} />
            <span className="font-medium">View Invoice</span>
          </div>
          {hasPendingInvoice && (
            <span className={`${notificationBadge} text-xs font-bold px-2 py-1 rounded-full animate-pulse`}>
              New
            </span>
          )}
        </NavLink>
        )}

        {authState?.role !== 'attendance-only' && (
        <details className="group">
          <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
            <div className="flex items-center">
              <LuReceipt className={`mr-3 text-lg ${iconColor}`} />
              <span className="font-medium">Billing & Invoices</span>
            </div>
            <LuChevronRight className="w-4 h-4 text-gray-400" />
          </summary>
          <nav className="mt-1 ml-6 space-y-1">
            <NavLink to="/shop/billing/create" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">Create Bill</span>
            </NavLink>
            <NavLink to="/shop/billing/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${ isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
              <span className="font-medium">View Bills</span>
            </NavLink>
          </nav>
        </details>
        )}
        
        {/* Expenses Module */}
        {authState?.role !== 'attendance-only' && (
        <NavLink
          to="/shop/expenses"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg ${
              isActive ? activeRed : `${textPrimary} ${hoverBg}`
            }`
          }
          onClick={() => {
            // Close sidebar on mobile when link is clicked
            if (window.innerWidth < 1024) {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
            }
          }}
        >
          {({ isActive }) => (
            <>
              <LuReceipt className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
              <span className="font-medium">Expenses</span>
            </>
          )}
        </NavLink>
        )}
        
        {/* Return Products Module */}
        {authState?.role !== 'attendance-only' && (
        <NavLink
          to="/shop/return-products"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg ${
              isActive ? activeRed : `${textPrimary} ${hoverBg}`
            }`
          }
          onClick={() => {
            // Close sidebar on mobile when link is clicked
            if (window.innerWidth < 1024) {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
            }
          }}
        >
          {({ isActive }) => (
            <>
              <LuRefreshCw className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
              <span className="font-medium">Return Products</span>
            </>
          )}
        </NavLink>
        )}
        
        {/* Settings Link - Moved to be right after Return Products */}
        {authState?.role !== 'attendance-only' && (
        <NavLink
          to="/shop/settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg ${
              isActive ? activeRed : `${textPrimary} ${hoverBg}`
            }`
          }
          onClick={() => {
            // Close sidebar on mobile when link is clicked
            if (window.innerWidth < 1024) {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
            }
          }}
        >
          {({ isActive }) => (
            <>
              <LuSettings className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
              <span className="font-medium">Settings</span>
            </>
          )}
        </NavLink>
        )}
      </nav>
      
      {/* Logout Button */}
      <div className="px-4 py-6 border-t border-gray-200 relative z-10">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2.5 rounded-lg ${textPrimary} ${hoverBg} font-medium`}
        >
          <LuLogOut className={`mr-3 text-lg ${iconColor}`} />
          <span>Logout</span>
        </button>
      </div>
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default ShopSidebar;