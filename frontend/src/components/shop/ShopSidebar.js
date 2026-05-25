import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
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
  LuSettings,
  LuShoppingCart,
  LuTrendingUp,
  LuChartBar,
  LuInfo,
  LuX
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
  const [openMenu, setOpenMenu] = useState(null);
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showShopInfo, setShowShopInfo] = useState(false);
  const [fullShopDetails, setFullShopDetails] = useState(null);
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
  const isProductBilling = authState?.role === 'product-billing-shop';

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
          const response = await axios.get('/shop/products/stock-alerts');
          setLowStockCount(response.data.length);
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
          setFullShopDetails(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch shop name:', err);
      }
    };

    if (authState && authState.isAuthenticated !== undefined) {
      checkPendingInvoice();
      fetchLowStockCount();
      fetchShopDetails();
    }
  }, [authState?.role]);

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

  const toggleMenu = (menuName) => {
    setOpenMenu(prev => prev === menuName ? null : menuName);
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
    <>
      <style>{`
          .sidebar-container nav span,
          .sidebar-container summary span,
          .sidebar-container .logout-text,
          .sidebar-container .panel-text-container {
              white-space: nowrap;
              transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
          }
          @media (min-width: 1024px) {
              .sidebar-container:not(:hover) nav span,
              .sidebar-container:not(:hover) summary span,
              .sidebar-container:not(:hover) .alertBadge,
              .sidebar-container:not(:hover) summary svg.w-4,
              .sidebar-container:not(:hover) nav svg.w-4,
              .sidebar-container:not(:hover) .panel-text-container,
              .sidebar-container:not(:hover) .logout-text {
                  opacity: 0;
                  visibility: hidden;
              }
              .sidebar-container:not(:hover) nav nav {
                  display: none !important;
              }
          }
          .sidebar-container svg {
              flex-shrink: 0;
          }
          .sidebar-container .logo-image {
              transition: transform 0.3s ease;
              transform-origin: center;
          }
          .sidebar-container .orbit-dots {
              transition: opacity 0.3s ease;
          }
          @media (min-width: 1024px) {
              .sidebar-container:not(:hover) .logo-image {
                  transform: scale(0.9);
              }
              .sidebar-container:not(:hover) .orbit-dots {
                  opacity: 0;
                  visibility: hidden;
              }
          }
          /* Hide scrollbar for Chrome, Safari and Opera */
          .sidebar-container nav::-webkit-scrollbar {
              display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          .sidebar-container nav {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
              overflow-x: hidden;
          }
      `}</style>
      <div className={`sidebar-container h-screen w-64 lg:w-20 lg:hover:w-64 group transition-all duration-300 ease-in-out ${sidebarBg} ${textPrimary} flex flex-col border-r ${borderColor} overflow-x-hidden shadow-sm relative z-50`}>
      {/* Removed Animated Sweet Elements Background to eliminate emoji elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Sweet elements removed */}
      </div>

      <div className="p-6 pt-10 border-b border-gray-100 relative z-10">
        {/* Shop Info Toggle */}
        <button
          onClick={() => setShowShopInfo(true)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 z-20 group"
          title="Shop Information"
        >
          <LuInfo className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex flex-col items-center justify-center space-y-3 mt-2">
          <div className="relative">
            <div className="relative flex items-center justify-center mt-2">
              <img
                src="/sweethub-logo.png"
                alt="Sweet Hub Logo"
                className="h-16 w-auto object-contain logo-image relative z-10"
                onError={(e) => {
                  e.target.parentElement.style.display = 'none';
                  e.target.parentElement.nextElementSibling.classList.remove('hidden');
                  e.target.parentElement.nextElementSibling.classList.add('flex');
                }}
              />
              <div className="absolute h-20 w-20 rounded-full animate-[orbit_4s_linear_infinite] orbit-dots">
                <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full"></span>
                <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-accent-cyan rounded-full"></span>
                <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-accent-green rounded-full"></span>
                <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent-orange rounded-full"></span>
              </div>
            </div>
            <div className="hidden bg-red-500 text-white px-4 py-2 rounded-lg transform rotate-12 shadow-lg logo-image">
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
          <div className="flex items-center space-x-3 panel-text-container">
            <div className="text-left">
              <div className={`${textAccent} font-bold text-lg leading-tight`}>Sweet Hub</div>
              <div className={`${textSecondary} text-sm`}>Shop Panel</div>
            </div>
          </div>
          {shopName && (
            <div className={`${textSecondary} font-bold text-red-600 text-lg font-large panel-text-container`}>{shopName}</div>
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
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/dashboard"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
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

        {/* Workers Module - Hide for product-billing users */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <details className="group" open={openMenu === 'workers'} onToggle={(e) => {
            if (e.target.open) toggleMenu('workers');
            else if (openMenu === 'workers') setOpenMenu(null);
          }}>
            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
              <div className="flex items-center">
                <LuUsers className={`mr-3 text-lg ${iconColor}`} />
                <span className="font-medium">Workers</span>
              </div>
              <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'workers' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
            </summary>
            <nav className="mt-1 ml-6 space-y-1">
              {authState?.role !== 'attendance-only' && (
                <NavLink to="/shop/workers/add" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                  <span className="font-medium">Add Worker</span>
                </NavLink>
              )}
              {authState?.role !== 'attendance-only' && (
                <NavLink to="/shop/workers/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                  <span className="font-medium">View Workers</span>
                </NavLink>
              )}
              <NavLink to="/shop/workers/attendance" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Attendance Tracking</span>
              </NavLink>
              {authState?.role !== 'attendance-only' && (
                <NavLink to="/shop/workers/salary-report" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                  <span className="font-medium">Salary Report</span>
                </NavLink>
              )}
              {authState?.role !== 'attendance-only' && (
                <NavLink to="/shop/workers/holidays" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                  <span className="font-medium">Holidays</span>
                </NavLink>
              )}
              {authState?.role !== 'attendance-only' && (
                <NavLink to="/shop/face-enrollment" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                  <span className="font-medium">Face Enrollment</span>
                </NavLink>
              )}
            </nav>
          </details>
        )}

        {/* Departments Module - Hide for product-billing users */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <details className="group" open={openMenu === 'departments'} onToggle={(e) => {
            if (e.target.open) toggleMenu('departments');
            else if (openMenu === 'departments') setOpenMenu(null);
          }}>
            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
              <div className="flex items-center">
                <LuBuilding className={`mr-3 text-lg ${iconColor}`} />
                <span className="font-medium">Departments</span>
              </div>
              <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'departments' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
            </summary>
            <nav className="mt-1 ml-6 space-y-1">
              <NavLink to="/shop/departments/create" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Create Department</span>
              </NavLink>
              <NavLink to="/shop/departments/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">View Departments</span>
              </NavLink>
            </nav>
          </details>
        )}

        {authState?.role !== 'attendance-only' && (
          <details className="group" open={openMenu === 'products'} onToggle={(e) => {
            if (e.target.open) toggleMenu('products');
            else if (openMenu === 'products') setOpenMenu(null);
          }}>
            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
              <div className="flex items-center">
                <LuBoxes className={`mr-3 text-lg ${iconColor}`} />
                <span className="font-medium">Products</span>
              </div>
              <div className="flex items-center space-x-2">
                {openMenu !== 'products' && lowStockCount > 0 && (
                  <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                    {lowStockCount}
                  </span>
                )}
                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'products' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
              </div>
            </summary>
            <nav className="mt-1 ml-6 space-y-1">
              {(fullShopDetails?.canEditProducts !== false) && (
                <>
                  <NavLink to="/shop/products/category" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                    <span className="font-medium">Add Category</span>
                  </NavLink>
                  <NavLink to="/shop/products/add" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                    <span className="font-medium">Add Product</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/shop/products/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">View Products</span>
              </NavLink>
              <NavLink to="/shop/products/expired" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Expire Materials</span>
              </NavLink>
              <NavLink to="/shop/warehouse/stock" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Track Stock</span>
              </NavLink>
              <NavLink to="/shop/warehouse/alerts" className={({ isActive }) => `flex items-center justify-between px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Stock Alerts</span>
                {openMenu === 'products' && lowStockCount > 0 && (
                  <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                    {lowStockCount}
                  </span>
                )}
              </NavLink>
            </nav>
          </details>
        )}

        {/* Manufacturing - Hide for product-billing users */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/manufacturing"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
              if (window.innerWidth < 1024) {
                window.dispatchEvent(new CustomEvent('close-sidebar'));
              }
            }}
          >
            {({ isActive }) => (
              <>
                <LuBoxes className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                <span className="font-medium">Manufacturing</span>
              </>
            )}
          </NavLink>
        )}

        {/* View Invoice - Hide for product-billing users */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/invoice/view"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
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
          <details className="group" open={openMenu === 'billing'} onToggle={(e) => {
            if (e.target.open) toggleMenu('billing');
            else if (openMenu === 'billing') setOpenMenu(null);
          }}>
            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
              <div className="flex items-center">
                <LuReceipt className={`mr-3 text-lg ${iconColor}`} />
                <span className="font-medium">Billing & Invoices</span>
              </div>
              <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'billing' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
            </summary>
            <nav className="mt-1 ml-6 space-y-1">
              <NavLink to="/shop/billing/create" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Create Bill</span>
              </NavLink>
              <NavLink to="/shop/billing/view" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">View Bills</span>
              </NavLink>
            </nav>
          </details>
        )}

        {authState?.role !== 'attendance-only' && (
          <NavLink
            to="/shop/orders"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
              // Close sidebar on mobile when link is clicked
              if (window.innerWidth < 1024) {
                window.dispatchEvent(new CustomEvent('close-sidebar'));
              }
            }}
          >
            {({ isActive }) => (
              <>
                <LuShoppingCart className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                <span className="font-medium">Order Management</span>
              </>
            )}
          </NavLink>
        )}

        {/* Expenses Module - Hide for product-billing users */}
        {/* Expenses Module */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/expenses"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
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

        {/* Return Products Module - Hide for product-billing users */}
        {/* Return Products Module */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/return-products"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
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

        {/* Reports Module - Hide for product-billing users */}
        {/* Reports Module */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <details className="group" open={openMenu === 'reports'} onToggle={(e) => {
            if (e.target.open) toggleMenu('reports');
            else if (openMenu === 'reports') setOpenMenu(null);
          }}>
            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
              <div className="flex items-center">
                <LuChartBar className={`mr-3 text-lg ${iconColor}`} />
                <span className="font-medium">Reports</span>
              </div>
              <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'reports' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
            </summary>
            <nav className="mt-1 ml-6 space-y-1">
              <NavLink to="/shop/reports/sales" className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`}`} onClick={() => { if (window.innerWidth < 1024) { window.dispatchEvent(new CustomEvent('close-sidebar')); } }}>
                <span className="font-medium">Sales Report</span>
              </NavLink>
            </nav>
          </details>
        )}

        {/* Settings Link - Hide for product-billing users */}
        {/* Settings Link - Moved to be right after Return Products */}
        {authState?.role !== 'attendance-only' && !isProductBilling && (
          <NavLink
            to="/shop/settings"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg ${isActive ? activeRed : `${textPrimary} ${hoverBg}`
              }`
            }
            onClick={() => {
              setOpenMenu(null);
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

      <div className="px-4 py-6 border-t border-gray-200 relative z-10">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2.5 rounded-lg ${textPrimary} ${hoverBg} font-medium`}
        >
          <LuLogOut className={`mr-3 text-lg ${iconColor} flex-shrink-0`} />
          <span className="logout-text">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />

      {showShopInfo && fullShopDetails && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200">
            {/* Professional Header - Styled like ShopSettings */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xl shadow-sm">
                  {fullShopDetails.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Business Profile</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Administrative Records</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-md">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Locked by Admin</span>
                </div>
                <button
                  onClick={() => setShowShopInfo(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Professionally Structured */}
            <div className="p-8 bg-[#fafafa]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Primary Identity & Contact */}
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Entity Name</label>
                    <p className="text-xl font-bold text-gray-900">{fullShopDetails.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contact Details</label>
                    <p className="text-xl font-bold text-gray-900">{fullShopDetails.shopPhoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Shop Code</label>
                    <p className="text-md font-bold text-gray-600 uppercase tracking-wide">{fullShopDetails.shopCode || 'STANDARD-STRE'}</p>
                  </div>
                </div>

                {/* Location & Compliance */}
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Registered Location</label>
                    <p className="text-lg font-bold text-gray-900 leading-snug">{fullShopDetails.location}</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">GST Identification</label>
                      <p className="text-md font-bold text-gray-900 font-mono tracking-wider">{fullShopDetails.gstNumber || 'UNSET'}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">FSSAI Number</label>
                      <p className="text-md font-bold text-gray-900 font-mono tracking-wider">{fullShopDetails.fssaiNumber || 'UNSET'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    <div className={`w-2 h-2 rounded-full ${fullShopDetails.hasTaxInvoiceAccess ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                      {fullShopDetails.hasTaxInvoiceAccess ? 'Authorized for Tax Billing' : 'Standard Billing Only'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowShopInfo(false)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  Close Administrative View
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}

export default ShopSidebar;