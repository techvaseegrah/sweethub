// frontend/src/components/admin/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
    LuChevronRight,
    LuFileClock,
    LuChartBar,
    LuLogOut,
    LuSettings,
    LuReceipt,
    LuTruck,
    LuShoppingCart,
    LuPackage
} from 'react-icons/lu';
import axios from '../../api/axios';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import LogoutConfirmationModal from '../LogoutConfirmationModal';

// SVG components removed as they were not being used

const Sidebar = () => {
    const location = useLocation();
    const [totalStockAlerts, setTotalStockAlerts] = useState(0);
    const [openMenu, setOpenMenu] = useState(null);
    const [isPackingMaterialsOpen, setIsPackingMaterialsOpen] = useState(false);
    const [isRawMaterialsOpen, setIsRawMaterialsOpen] = useState(false);
    const [isManufacturingOpen, setIsManufacturingOpen] = useState(false);
    const [materialStockAlerts, setMaterialStockAlerts] = useState(0);
    const [unviewedOrdersCount, setUnviewedOrdersCount] = useState(0);

    const { authState, logout } = useContext(AuthContext);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const isProductBilling = authState?.role === 'product-billing-admin';

    useEffect(() => {
        const fetchTotalStockAlerts = async () => {
            try {
                // Only fetch if not an attendance-only or raw-materials-only user
                if (authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only') {
                    const response = await axios.get('/admin/products/stock-alerts/count');
                    setTotalStockAlerts(response.data.totalCount);
                }
            } catch (err) {
                console.error('Failed to fetch total stock alert count:', err);
            }
        };
        fetchTotalStockAlerts();
    }, [authState?.role]);

    useEffect(() => {
        const fetchMaterialStockAlerts = async () => {
            try {
                // Only fetch if not an attendance-only user
                if (authState?.role !== 'attendance-only') {
                    const response = await axios.get('/admin/warehouse/material-stock-alerts');
                    setMaterialStockAlerts(response.data.length);
                }
            } catch (err) {
                console.error('Failed to fetch material stock alert count:', err);
            }
        };
        fetchMaterialStockAlerts();
    }, [authState?.role]);

    useEffect(() => {
        const fetchUnviewedOrdersCount = async () => {
            try {
                if (authState?.role === 'admin') {
                    const response = await axios.get('/admin/orders/unviewed-count');
                    setUnviewedOrdersCount(response.data.count);
                }
            } catch (err) {
                console.error('Failed to fetch unviewed order count:', err);
            }
        };
        fetchUnviewedOrdersCount();

        // Polling for new orders every 30 seconds
        const interval = setInterval(fetchUnviewedOrdersCount, 30000);
        return () => clearInterval(interval);
    }, [authState?.role]);

    const toggleMenu = (menuName) => {
        if (openMenu === menuName) {
            setOpenMenu(null);
        } else {
            setOpenMenu(menuName);
            // Reset sub-menus when switching main menu
            setIsPackingMaterialsOpen(false);
            setIsRawMaterialsOpen(false);
            setIsManufacturingOpen(false);
        }
    };

    const togglePackingMaterials = () => {
        // Close other toggles and open this one (accordion behavior)
        setIsRawMaterialsOpen(false);
        setIsManufacturingOpen(false);
        setIsPackingMaterialsOpen(!isPackingMaterialsOpen);
    };

    const toggleRawMaterials = () => {
        // Close other toggles and open this one (accordion behavior)
        setIsPackingMaterialsOpen(false);
        setIsManufacturingOpen(false);
        setIsRawMaterialsOpen(!isRawMaterialsOpen);
    };

    const toggleManufacturing = () => {
        // Close other toggles and open this one (accordion behavior)
        setIsPackingMaterialsOpen(false);
        setIsRawMaterialsOpen(false);
        setIsManufacturingOpen(!isManufacturingOpen);
    };

    const toggleBeforePacking = () => {
        toggleMenu('beforePacking');
    };

    const toggleAfterPacking = () => {
        toggleMenu('afterPacking');
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

            {/* Header */}
            <div className="p-6 pt-8 border-b border-gray-100 relative z-10">
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
                            {/* Orbiting dots (unchanged) */}
                            <div className="absolute h-20 w-20 rounded-full animate-[orbit_4s_linear_infinite] orbit-dots">
                                <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full"></span>
                                <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-accent-cyan rounded-full"></span>
                                <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-accent-green rounded-full"></span>
                                <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent-orange rounded-full"></span>
                            </div>
                        </div>

                        {/* Fallback text logo */}
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
                {/* Dashboard - Hide for packing-only and raw-materials-only users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'warehouse-only' && authState?.role !== 'raw-materials' && !isProductBilling && (
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg ${isActive
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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

                {/* Raw Materials and Manufacturing - For raw-materials-only users */}
                {authState?.role === 'raw-materials-only' && (
                    <>
                        {/* Raw Materials Toggle */}
                        <div className="space-y-1">
                            <div
                                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer ${textSecondary} ${hoverBg}`}
                                onClick={toggleRawMaterials}
                            >
                                <div className="flex items-center">
                                    <LuPackage className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">Raw Materials</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${isRawMaterialsOpen ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </div>
                            {isRawMaterialsOpen && (
                                <nav className="mt-1 ml-4 space-y-1">
                                    <NavLink
                                        to="/admin/warehouse/raw-materials"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Raw Materials</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/store-room"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Store Room</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/expired-materials"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Expire Materials</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/outgoing-materials"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Outgoing Materials</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/material-stock-alerts"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Material Stock Alerts</span>
                                    </NavLink>
                                </nav>
                            )}
                        </div>

                        {/* Manufacturing Toggle */}
                        <div className="space-y-1">
                            <div
                                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer ${textSecondary} ${hoverBg}`}
                                onClick={toggleManufacturing}
                            >
                                <div className="flex items-center">
                                    <LuRefreshCw className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">Manufacturing</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${isManufacturingOpen ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </div>
                            {isManufacturingOpen && (
                                <nav className="mt-1 ml-4 space-y-1">
                                    <NavLink
                                        to="/admin/warehouse/manufacturing"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Manufacturing</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/daily-schedule"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Daily Schedule</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/production-schedules"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="mr-2">+</span>
                                        <span className="font-medium">Production Schedules</span>
                                    </NavLink>
                                </nav>
                            )}
                        </div>
                    </>
                )}
                {/* End of Raw Materials and Manufacturing for raw-materials-only users */}

                {/* Worker Management - Hide for packing-only and product-billing users */}
                {authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
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
                                <NavLink
                                    to="/admin/workers/add"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                            )}
                            {authState?.role !== 'attendance-only' && (
                                <NavLink
                                    to="/admin/workers/view"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                            )}
                            <NavLink
                                to="/admin/workers/attendance"
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                            {authState?.role !== 'attendance-only' && (
                                <NavLink
                                    to="/admin/workers/salary"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                            )}
                            {authState?.role !== 'attendance-only' && (
                                <NavLink
                                    to="/admin/workers/holidays"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                            )}

                        </nav>
                    </details>
                )}

                {/* Department Management - Hide for packing-only and product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <>
                        {/* Department Management - Hide for packing-only users */}
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
                                <NavLink
                                    to="/admin/departments/create"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && (
                    <>
                        {/* Product Management - Hide for packing-only users */}
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
                                    {openMenu !== 'products' && totalStockAlerts > 0 && (
                                        <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                            {totalStockAlerts}
                                        </span>
                                    )}
                                    <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'products' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                </div>
                            </summary>
                            <nav className="mt-1 ml-6 space-y-1">
                                <NavLink
                                    to="/admin/products/add-category"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                    to="/admin/products/expired"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        // Close sidebar on mobile when link is clicked
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Expire Materials</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/warehouse/track-stock"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center justify-between px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                    {openMenu === 'products' && totalStockAlerts > 0 && (
                                        <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                            {totalStockAlerts}
                                        </span>
                                    )}
                                </NavLink>
                            </nav>
                        </details>
                    </>
                )}

                {/* Warehouse Management - Hide for product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'warehouse-only' && authState?.role !== 'raw-materials' && !isProductBilling && (
                    <>
                        {/* Warehouse Management - Hide for packing-only users (they see their specific modules below) */}
                        {(authState?.role === 'admin' || authState?.role === 'raw-materials-only' || authState?.role === 'warehouse-only' || authState?.role === 'raw-materials') && (
                            <details className="group" open={openMenu === 'warehouse'} onToggle={(e) => {
                                if (e.target.open) toggleMenu('warehouse');
                                else if (openMenu === 'warehouse') setOpenMenu(null);
                            }}>
                                <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                    <div className="flex items-center">
                                        <LuArchive className={`mr-3 text-lg ${iconColor}`} />
                                        <span className="font-medium">Warehouse</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {openMenu !== 'warehouse' && materialStockAlerts > 0 && (
                                            <span className={`${alertBadge} text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                                {materialStockAlerts}
                                            </span>
                                        )}
                                        <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'warehouse' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                    </div>
                                </summary>
                                <nav className="mt-1 ml-6 space-y-1">
                                    {/* Packing Materials Toggle - Only for admin and raw-materials-only */}
                                    {(authState?.role === 'admin' || authState?.role === 'raw-materials-only') && (
                                        <div className="space-y-1">
                                            <div
                                                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer ${textSecondary} ${hoverBg}`}
                                                onClick={togglePackingMaterials}
                                            >
                                                <span className="font-medium">Packing Materials</span>
                                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${isPackingMaterialsOpen ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                            </div>
                                            {isPackingMaterialsOpen && (
                                                <nav className="mt-1 ml-4 space-y-1">
                                                    <NavLink
                                                        to="/admin/warehouse/packing-materials/view"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">View Materials</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/packing-materials/outgoing"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Outgoing Materials</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/packing-materials/alerts"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Alert Materials</span>
                                                    </NavLink>
                                                </nav>
                                            )}
                                        </div>
                                    )}

                                    {/* Raw Materials Toggle - Hide for packing-only users */}
                                    {authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && (
                                        <div className="space-y-1">
                                            <div
                                                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer ${textSecondary} ${hoverBg}`}
                                                onClick={toggleRawMaterials}
                                            >
                                                <span className="font-medium">Raw Materials</span>
                                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${isRawMaterialsOpen ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                            </div>
                                            {isRawMaterialsOpen && (
                                                <nav className="mt-1 ml-4 space-y-1">
                                                    <NavLink
                                                        to="/admin/warehouse/raw-materials"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Raw Materials</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/store-room"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Store Room</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/expired-materials"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Expire Materials</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/outgoing-materials"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Outgoing Materials</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/material-stock-alerts"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Material Stock Alerts</span>
                                                    </NavLink>
                                                </nav>
                                            )}
                                        </div>
                                    )}

                                    {/* Manufacturing Toggle - Hide for packing-only users */}
                                    {authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && (
                                        <div className="space-y-1">
                                            <div
                                                className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer ${textSecondary} ${hoverBg}`}
                                                onClick={toggleManufacturing}
                                            >
                                                <span className="font-medium">Manufacturing</span>
                                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${isManufacturingOpen ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                            </div>
                                            {isManufacturingOpen && (
                                                <nav className="mt-1 ml-4 space-y-1">
                                                    <NavLink
                                                        to="/admin/warehouse/manufacturing"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Manufacturing</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/daily-schedule"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Daily Schedule</span>
                                                    </NavLink>
                                                    <NavLink
                                                        to="/admin/warehouse/production-schedules"
                                                        className={({ isActive }) =>
                                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                                            }`
                                                        }
                                                        onClick={() => {
                                                            // Close sidebar on mobile when link is clicked
                                                            if (window.innerWidth < 1024) {
                                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                                            }
                                                        }}
                                                    >
                                                        <span className="mr-2">+</span>
                                                        <span className="font-medium">Production Schedules</span>
                                                    </NavLink>
                                                </nav>
                                            )}
                                        </div>
                                    )}


                                </nav>
                            </details>
                        )}
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && (
                    <>
                        {/* Before Packing Toggle - Hide for product-billing users */}
                        {(authState?.role === 'admin' || authState?.role === 'before-packing-only' || authState?.role === 'warehouse-only' || authState?.role === 'raw-materials') && !isProductBilling && (
                            <details className="group" open={openMenu === 'beforePacking'} onToggle={(e) => {
                                if (e.target.open) toggleMenu('beforePacking');
                                else if (openMenu === 'beforePacking') setOpenMenu(null);
                            }}>
                                <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                    <div className="flex items-center">
                                        <LuPackage className={`mr-3 text-lg ${iconColor}`} />
                                        <span className="font-medium">Before Packing</span>
                                    </div>
                                    <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'beforePacking' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                </summary>
                                <nav className="mt-1 ml-6 space-y-1">
                                    <NavLink
                                        to="/admin/warehouse/before-packing"
                                        className={({ isActive }) => {
                                            const isExactMatch = location.pathname === '/admin/warehouse/before-packing';
                                            return `flex items-center px-3 py-2 text-sm rounded-lg ${isExactMatch ? activeRed : `${textSecondary} ${hoverBg}`
                                                }`;
                                        }}
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">All Products</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/before-packing/pending-items"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">Pending Items</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/before-packing/completed-items"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">Completed Items</span>
                                    </NavLink>
                                </nav>
                            </details>
                        )}

                        {/* After Packing Toggle - Hide for product-billing users */}
                        {(authState?.role === 'admin' || authState?.role === 'after-packing-only' || authState?.role === 'warehouse-only' || authState?.role === 'raw-materials') && !isProductBilling && (
                            <details className="group" open={openMenu === 'afterPacking'} onToggle={(e) => {
                                if (e.target.open) toggleMenu('afterPacking');
                                else if (openMenu === 'afterPacking') setOpenMenu(null);
                            }}>
                                <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                    <div className="flex items-center">
                                        <LuPackage className={`mr-3 text-lg ${iconColor}`} />
                                        <span className="font-medium">After Packing</span>
                                    </div>
                                    <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'afterPacking' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                </summary>
                                <nav className="mt-1 ml-6 space-y-1">
                                    <NavLink
                                        to="/admin/warehouse/after-packing"
                                        className={({ isActive }) => {
                                            const isExactMatch = location.pathname === '/admin/warehouse/after-packing';
                                            return `flex items-center px-3 py-2 text-sm rounded-lg ${isExactMatch ? activeRed : `${textSecondary} ${hoverBg}`
                                                }`;
                                        }}
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">All Products</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/after-packing/pending-items"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">Pending Items</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/after-packing/completed-items"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">Completed Items</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warehouse/after-packing/add-to-stock"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                            }`
                                        }
                                        onClick={() => {
                                            // Close sidebar on mobile when link is clicked
                                            if (window.innerWidth < 1024) {
                                                window.dispatchEvent(new CustomEvent('close-sidebar'));
                                            }
                                        }}
                                    >
                                        <span className="font-medium">Add to Stock</span>
                                    </NavLink>
                                </nav>
                            </details>
                        )}

                        {/* Shop Management - Hide for product-billing users */}
                        {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                            <details className="group" open={openMenu === 'shops'} onToggle={(e) => {
                                if (e.target.open) toggleMenu('shops');
                                else if (openMenu === 'shops') setOpenMenu(null);
                            }}>
                                <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                    <div className="flex items-center">
                                        <LuStore className={`mr-3 text-lg ${iconColor}`} />
                                        <span className="font-medium">Shops</span>
                                    </div>
                                    <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'shops' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                                </summary>
                                <nav className="mt-1 ml-6 space-y-1">
                                    <NavLink
                                        to="/admin/shops/add"
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                            `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                        )}
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <>
                        {/* Task Management */}
                        <details className="group" open={openMenu === 'tasks'} onToggle={(e) => {
                            if (e.target.open) toggleMenu('tasks');
                            else if (openMenu === 'tasks') setOpenMenu(null);
                        }}>
                            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                <div className="flex items-center">
                                    <LuClipboardCheck className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">Tasks</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'tasks' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </summary>
                            <nav className="mt-1 ml-6 space-y-1">
                                <NavLink
                                    to="/admin/tasks/daily"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && (
                    <>
                        {/* Billing Management */}
                        <details className="group" open={openMenu === 'billing'} onToggle={(e) => {
                            if (e.target.open) toggleMenu('billing');
                            else if (openMenu === 'billing') setOpenMenu(null);
                        }}>
                            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                <div className="flex items-center">
                                    <LuFileText className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">Billing</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'billing' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </summary>
                            <nav className="mt-1 ml-6 space-y-1">
                                <NavLink
                                    to="/admin/bills/create"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <>
                        {/* Reports Management */}
                        <details className="group" open={openMenu === 'reports'} onToggle={(e) => {
                            if (e.target.open) toggleMenu('reports');
                            else if (openMenu === 'reports') setOpenMenu(null);
                        }}>
                            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                <div className="flex items-center">
                                    <LuFileClock className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">Reports</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'reports' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </summary>
                            <nav className="mt-1 ml-6 space-y-1">
                                <NavLink
                                    to="/admin/reports/sales"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Sales report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/purchase"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Purchase report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/production"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Production report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/stock"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Stock report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/expiry-batch"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Expiry / batch report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/gst"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">GST report</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/profit-loss"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
                                        }`
                                    }
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            window.dispatchEvent(new CustomEvent('close-sidebar'));
                                        }
                                    }}
                                >
                                    <span className="font-medium">Profit & loss</span>
                                </NavLink>
                            </nav>
                        </details>
                    </>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <>
                        {/* E-Way Bill Management */}
                        <details className="group" open={openMenu === 'ewayBills'} onToggle={(e) => {
                            if (e.target.open) toggleMenu('ewayBills');
                            else if (openMenu === 'ewayBills') setOpenMenu(null);
                        }}>
                            <summary className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer ${hoverBg} ${textPrimary} list-none`}>
                                <div className="flex items-center">
                                    <LuTruck className={`mr-3 text-lg ${iconColor}`} />
                                    <span className="font-medium">E-Way Bills</span>
                                </div>
                                <LuChevronRight className={`w-4 h-4 transition-transform duration-200 ${openMenu === 'ewayBills' ? 'rotate-90 text-blue-500' : 'text-red-500'}`} />
                            </summary>
                            <nav className="mt-1 ml-6 space-y-1">
                                <NavLink
                                    to="/admin/eway-bills/create"
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                                        `flex items-center px-3 py-2 text-sm rounded-lg ${isActive ? activeRed : `${textSecondary} ${hoverBg}`
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
                    </>
                )}

                {/* Invoice History - Hide for product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <NavLink
                        to="/admin/invoices/history"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg ${isActive
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                                <LuFileText className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                                <span className="font-medium">Invoice History</span>
                            </>
                        )}
                    </NavLink>
                )}

                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && (
                    <NavLink
                        to="/admin/orders"
                        className={({ isActive }) =>
                            `flex items-center justify-between px-3 py-2.5 rounded-lg ${isActive
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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
                                <div className="flex items-center">
                                    <LuShoppingCart className={`mr-3 text-lg ${isActive ? iconActive : iconColor}`} />
                                    <span className="font-medium">Shop Orders</span>
                                </div>
                                {unviewedOrdersCount > 0 && (
                                    <span className={`${alertBadge} text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm`}>
                                        {unviewedOrdersCount}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                )}

                {/* Return Products - Hide for product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <NavLink
                        to="/admin/warehouse/return-products"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg ${isActive
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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

                {/* Expenses Module - Hide for product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <NavLink
                        to="/admin/expenses"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg ${isActive
                                ? activeRed
                                : `${textPrimary} ${hoverBg}`
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

                {/* Settings Module - Hide for product-billing users */}
                {authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && authState?.role !== 'before-packing-only' && authState?.role !== 'after-packing-only' && !isProductBilling && (
                    <>
                        <NavLink
                            to="/admin/settings"
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-lg ${isActive
                                    ? activeRed
                                    : `${textPrimary} ${hoverBg}`
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
                    </>
                )}
            </nav>

            {/* Logout Button */}
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
        </div>
        </>
    );
};

export default Sidebar;
