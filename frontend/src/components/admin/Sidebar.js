// frontend/src/components/admin/Sidebar.js
import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuBuilding, 
  LuBoxes, 
  LuStore, 
  LuClipboardCheck, 
  LuFileText, 
  LuArchive, 
  LuRefreshCw,
  LuChevronDown,
  LuChevronRight,
  LuScanFace,
  LuFileClock,
  LuChartBar,
  LuLogOut,
  LuSettings,
  LuReceipt,
  LuTruck
} from 'react-icons/lu';
import axios from '../../api/axios';
import { useContext } from 'react';
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

const Sidebar = () => {
    const [totalStockAlerts, setTotalStockAlerts] = useState(0);
    const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
    const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);
    const [materialStockAlerts, setMaterialStockAlerts] = useState(0);
    const [sweetItems, setSweetItems] = useState([]);

    useEffect(() => {
        const fetchTotalStockAlerts = async () => {
            try {
                const response = await axios.get('/admin/products/stock-alerts/count');
                setTotalStockAlerts(response.data.totalCount);
            } catch (err) {
                console.error('Failed to fetch total stock alert count:', err);
            }
        };
        fetchTotalStockAlerts();
    }, []);

    useEffect(() => {
        const fetchMaterialStockAlerts = async () => {
            try {
                const response = await axios.get('/admin/warehouse/material-stock-alerts');
                setMaterialStockAlerts(response.data.length);
            } catch (err) {
                console.error('Failed to fetch material stock alert count:', err);
            }
        };
        fetchMaterialStockAlerts();
    }, []);

    const toggleProductMenu = () => {
        setIsProductMenuOpen(!isProductMenuOpen);
    };

    const toggleWarehouseMenu = () => {
        setIsWarehouseMenuOpen(!isWarehouseMenuOpen);
    };

    // Sweet Hub inspired color palette
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

    const { logout } = useContext(AuthContext);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

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

    return (
        <div className={`h-screen w-64 ${sidebarBg} ${textPrimary} flex flex-col border-r ${borderColor} overflow-hidden shadow-sm relative`}>
            {/* Removed Animated Sweet Elements Background to eliminate emoji elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Sweet elements removed */}
            </div>
            
            {/* Header */}
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
                            {/* Orbiting dots (unchanged) */}
                            <div className="absolute h-20 w-20 rounded-full animate-[orbit_4s_linear_infinite]">
                                <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full"></span>
                                <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-accent-cyan rounded-full"></span>
                                <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-accent-green rounded-full"></span>
                                <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent-orange rounded-full"></span>
                            </div>
                        </div>

                        {/* Fallback text logo */}
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
                            <div className={`${textSecondary} text-sm`}>Admin Panel</div>
                        </div>
                    </div>
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
                {/* Dashboard */}
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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

                {/* Worker Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuUsers className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Workers</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/workers/add"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Add Worker</span>
                        </NavLink>
                        <NavLink
                            to="/admin/workers/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">View Workers</span>
                        </NavLink>
                        <NavLink
                            to="/admin/workers/attendance"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Attendance</span>
                        </NavLink>
                        <NavLink
                            to="/admin/workers/salary"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Salary Report</span>
                        </NavLink>
                        <NavLink
                            to="/admin/workers/holidays"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Holidays</span>
                        </NavLink>

                    </nav>
                </details>

                {/* Department Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuBuilding className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Departments</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/departments/create"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Create Department</span>
                        </NavLink>
                        <NavLink
                            to="/admin/departments/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">View Departments</span>
                        </NavLink>
                    </nav>
                </details>

                {/* Product Management */}
                <details className="group" open={isProductMenuOpen} onToggle={toggleProductMenu}>
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuBoxes className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Products</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isProductMenuOpen && totalStockAlerts > 0 && (
                                <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                    {totalStockAlerts}
                                </span>
                            )}
                            <LuChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                    <NavLink
                        to="/admin/products/add-category"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-lg ${
                                isActive ? activeRed : `${textSecondary} ${hoverBg}`
                            }`
                        }
                        onClick={() => {
                            // Close sidebar on mobile when link is clicked
                            if (window.innerWidth < 1024) {
                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                            }
                        }}
                    >
                        <span className="font-medium">Add Category</span>
                    </NavLink>
                        <NavLink
                            to="/admin/products/add"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Add Product</span>
                        </NavLink>
                        <NavLink
                            to="/admin/products/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">View Products</span>
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/track-stock"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Track Stock</span>
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/stock-alerts"
                            className={({ isActive }) =>
                                `flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Stock Alerts</span>
                            {isProductMenuOpen && totalStockAlerts > 0 && (
                                <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                    {totalStockAlerts}
                                </span>
                            )}
                        </NavLink>
                    </nav>
                </details>

                {/* Warehouse Management */}
                <details className="group" open={isWarehouseMenuOpen} onToggle={toggleWarehouseMenu}>
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuArchive className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Warehouse</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isWarehouseMenuOpen && materialStockAlerts > 0 && (
                                <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                    {materialStockAlerts}
                                </span>
                            )}
                            <LuChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/warehouse/store-room"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Store Room</span>
                        </NavLink>
                        
                        <div className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                            Packing Materials
                        </div>
                        
                        <NavLink
                            to="/admin/warehouse/packing-materials/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                } ml-4`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">- View Materials</span>
                        </NavLink>

                        <NavLink
                            to="/admin/warehouse/packing-materials/outgoing"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                } ml-4`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">- Outgoing Materials</span>
                        </NavLink>
                        
                        <NavLink
                            to="/admin/warehouse/packing-materials/alerts"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                } ml-4`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">- Alert Materials</span>
                        </NavLink>

                        <NavLink
                            to="/admin/warehouse/raw-materials"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Raw Materials</span>
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/manufacturing"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Manufacturing</span>
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/daily-schedule"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                    <LuFileClock className={`mr-2 text-lg ${isActive ? iconActive : iconColor}`} />
                                    <span className="font-medium">Daily Schedule</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/outgoing-materials"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Outgoing Materials</span>
                        </NavLink>
                        <NavLink
                            to="/admin/warehouse/material-stock-alerts"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Material Stock Alerts</span>
                        </NavLink>
                    </nav>
                </details>

                {/* Shop Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuStore className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Shops</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/shops/add"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Add Shop</span>
                        </NavLink>
                        <NavLink
                            to="/admin/shops/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">View Shops</span>
                        </NavLink>
                    </nav>
                </details>

                {/* Task Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuClipboardCheck className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Tasks</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/tasks/daily"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Daily Tasks</span>
                        </NavLink>
                        <NavLink
                            to="/admin/tasks/completed"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Completed Tasks</span>
                        </NavLink>
                    </nav>
                </details>

                {/* Billing Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuFileText className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">Billing</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/bills/create"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Create Bill</span>
                        </NavLink>
                        <NavLink
                            to="/admin/bills/view"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">View Bills</span>
                        </NavLink>
                    </nav>
                </details>

                {/* E-Way Bill Management */}
                <details className="group">
                    <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                        <div className="flex items-center">
                            <LuTruck className={`mr-3 text-lg ${iconColor}`} />
                            <span className="font-medium">E-Way Bills</span>
                        </div>
                        <LuChevronRight className="w-4 h-4 text-gray-400" />
                    </summary>
                    <nav className="mt-1 ml-6 space-y-1">
                        <NavLink
                            to="/admin/eway-bills/create"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">Create E-Way Bill</span>
                        </NavLink>
                        <NavLink
                            to="/admin/eway-bills/history"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 text-sm rounded-lg ${
                                    isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                }`
                            }
                            onClick={() => {
                                // Close sidebar on mobile when link is clicked
                                if (window.innerWidth < 1024) {
                                    window.dispatchEvent(new CustomEvent('close-sidebar'));
                                }
                            }}
                        >
                            <span className="font-medium">E-Way Bills History</span>
                        </NavLink>
                    </nav>
                </details>

                {/* Invoice Management */}
                <NavLink
                    to="/admin/invoices/history"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                            <LuFileText className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                            <span className="font-medium">Invoice History</span>
                        </>
                    )}
                </NavLink>
                
                {/* Return Products */}
                <NavLink
                    to="/admin/warehouse/return-products"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                
                {/* Expenses Module */}
                <NavLink
                    to="/admin/expenses"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                
                {/* Removed Face Service Diagnostic */}
                
                {/* Profit & Loss */}
                <NavLink
                    to="/admin/profit-loss"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                            <LuChartBar className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                            <span className="font-medium">Profit & Loss</span>
                        </>
                    )}
                </NavLink>
                
                {/* Settings */}
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg ${
                            isActive 
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
};

export default Sidebar;