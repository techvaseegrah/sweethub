import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LuMenu } from 'react-icons/lu';
import Sidebar from '../components/admin/Sidebar';
import useAttendanceOnlyProtection from '../hooks/useAttendanceOnlyProtection';
import AdminDashboard from '../components/admin/AdminDashboard';
import AddWorker from '../components/admin/worker/AddWorker';
import ViewWorkers from '../components/admin/worker/ViewWorkers';
import AttendanceTracking from '../components/admin/worker/AttendanceTracking';
import SalaryReport from '../components/admin/worker/SalaryReport';
import HolidayManagement from '../components/admin/worker/HolidayManagement';
import FaceEnrollment from '../components/admin/worker/FaceEnrollment';
import CreateDepartment from '../components/admin/department/CreateDepartment';
import ViewDepartments from '../components/admin/department/ViewDepartments';
import AddCategory from '../components/admin/product/AddCategory';
import AddProduct from '../components/admin/product/AddProduct';
import ViewProducts from '../components/admin/product/ViewProducts';
import ExpiredProducts from '../components/admin/product/ExpiredProducts';
import ProductHistoryPage from '../components/admin/product/ProductHistoryPage';
import TrackStock from '../components/admin/warehouse/TrackStock';
import StockAlerts from '../components/admin/warehouse/StockAlerts';
import AddShop from '../components/admin/shop/AddShop';
import ViewShops from '../components/admin/shop/ViewShops';
import AdminCreateBill from '../components/admin/billing/AdminCreateBill';
import AdminViewBills from '../components/admin/billing/AdminViewBills';
import DailyTasks from '../components/admin/tasks/DailyTasks';
import TaskCompleted from '../components/admin/tasks/TaskCompleted';
import StoreRoom from '../components/admin/warehouse/StoreRoom';
import Manufacturing from '../components/admin/warehouse/Manufacturing';
import DailySchedule from '../components/admin/warehouse/DailySchedule';
import OutgoingMaterials from '../components/admin/warehouse/OutgoingMaterials';
import BeforePacking from '../components/admin/warehouse/BeforePacking';
import AfterPacking from '../components/admin/warehouse/AfterPacking';
import BeforePackingPendingItems from '../components/admin/warehouse/BeforePackingPendingItems';
import BeforePackingCompletedItems from '../components/admin/warehouse/BeforePackingCompletedItems';
import AfterPackingPendingItems from '../components/admin/warehouse/AfterPackingPendingItems';
import AfterPackingCompletedItems from '../components/admin/warehouse/AfterPackingCompletedItems';
import AfterPackingAddToStock from '../components/admin/warehouse/AfterPackingAddToStock';
import MaterialStockAlerts from '../components/admin/warehouse/MaterialStockAlerts';
import AlertPackingMaterials from '../components/admin/warehouse/AlertPackingMaterials';
import OutgoingPackingMaterials from '../components/admin/warehouse/OutgoingPackingMaterials';
import ReturnProductsPage from './ReturnProductsPage';
import ReturnProductsHistory from '../components/admin/warehouse/ReturnProductsHistory';
import PackingMaterials from '../components/admin/warehouse/PackingMaterials';
import RawMaterials from '../components/admin/warehouse/RawMaterials';
import ExpiredMaterials from '../components/admin/warehouse/ExpiredMaterials';
// Removed FaceServiceDiagnostic import
import InvoiceHistory from '../components/admin/invoice/InvoiceHistory';
import ProfitLossPage from './ProfitLossPage';
import ProductionSchedules from '../components/admin/warehouse/ProductionSchedules'; // Add this import
import Settings from '../components/admin/settings/Settings';
// Expense module imports
import ExpenseDashboard from '../components/admin/expense/ExpenseDashboard';
import AddExpense from '../components/admin/expense/AddExpense';
import ExpenseHistory from '../components/admin/expense/ExpenseHistory';
import EditExpense from '../components/admin/expense/EditExpense'; // Add this import
// E-Way bill module imports
import CreateEWayBill from '../components/admin/eway-bills/CreateEWayBill';
import EWayBillsHistory from '../components/admin/eway-bills/EWayBillsHistory';
import ViewEWayBill from '../components/admin/eway-bills/ViewEWayBill';
import OrderManagement from '../components/admin/OrderManagement';
import { useFullScreenBill } from '../context/FullScreenBillContext';

// Report module imports
import SalesReport from '../components/admin/reports/SalesReport';
import PurchaseReport from '../components/admin/reports/PurchaseReport';
import ProductionReport from '../components/admin/reports/ProductionReport';
import StockReport from '../components/admin/reports/StockReport';
import ExpiryBatchReport from '../components/admin/reports/ExpiryBatchReport';
import GSTReport from '../components/admin/reports/GSTReport';

const AdminDashboardPage = () => {
    console.log('Sidebar:', Sidebar);
    console.log('AdminDashboard:', AdminDashboard);
    console.log('AddWorker:', AddWorker);
    console.log('ViewWorkers:', ViewWorkers);
    console.log('AttendanceTracking:', AttendanceTracking);
    console.log('SalaryReport:', SalaryReport);
    console.log('HolidayManagement:', HolidayManagement);
    console.log('FaceEnrollment:', FaceEnrollment);
    console.log('CreateDepartment:', CreateDepartment);
    console.log('ViewDepartments:', ViewDepartments);
    console.log('AddCategory:', AddCategory);
    console.log('AddProduct:', AddProduct);
    console.log('ViewProducts:', ViewProducts);
    console.log('ExpiredProducts:', ExpiredProducts);
    console.log('ProductHistoryPage:', ProductHistoryPage);
    console.log('TrackStock:', TrackStock);
    console.log('StockAlerts:', StockAlerts);
    console.log('AddShop:', AddShop);
    console.log('ViewShops:', ViewShops);
    console.log('AdminCreateBill:', AdminCreateBill);
    console.log('AdminViewBills:', AdminViewBills);
    console.log('DailyTasks:', DailyTasks);
    console.log('TaskCompleted:', TaskCompleted);
    console.log('StoreRoom:', StoreRoom);
    console.log('Manufacturing:', Manufacturing);
    console.log('DailySchedule:', DailySchedule);
    console.log('OutgoingMaterials:', OutgoingMaterials);
    console.log('BeforePacking:', BeforePacking);
    console.log('AfterPacking:', AfterPacking);
    console.log('BeforePackingPendingItems:', BeforePackingPendingItems);
    console.log('BeforePackingCompletedItems:', BeforePackingCompletedItems);
    console.log('AfterPackingPendingItems:', AfterPackingPendingItems);
    console.log('AfterPackingCompletedItems:', AfterPackingCompletedItems);
    console.log('AfterPackingAddToStock:', AfterPackingAddToStock);
    console.log('MaterialStockAlerts:', MaterialStockAlerts);
    console.log('AlertPackingMaterials:', AlertPackingMaterials);
    console.log('OutgoingPackingMaterials:', OutgoingPackingMaterials);
    console.log('ReturnProductsPage:', ReturnProductsPage);
    console.log('ReturnProductsHistory:', ReturnProductsHistory);
    console.log('PackingMaterials:', PackingMaterials);
    console.log('RawMaterials:', RawMaterials);
    console.log('ExpiredMaterials:', ExpiredMaterials);
    console.log('InvoiceHistory:', InvoiceHistory);
    console.log('ProfitLossPage:', ProfitLossPage);
    console.log('ProductionSchedules:', ProductionSchedules);
    console.log('Settings:', Settings);
    console.log('ExpenseDashboard:', ExpenseDashboard);
    console.log('AddExpense:', AddExpense);
    console.log('ExpenseHistory:', ExpenseHistory);
    console.log('EditExpense:', EditExpense);
    console.log('CreateEWayBill:', CreateEWayBill);
    console.log('EWayBillsHistory:', EWayBillsHistory);
    console.log('ViewEWayBill:', ViewEWayBill);
    console.log('OrderManagement:', OrderManagement);
    console.log('SalesReport:', SalesReport);
    console.log('PurchaseReport:', PurchaseReport);
    console.log('ProductionReport:', ProductionReport);
    console.log('StockReport:', StockReport);
    console.log('ExpiryBatchReport:', ExpiryBatchReport);
    console.log('GSTReport:', GSTReport);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isFullScreenBill } = useFullScreenBill();

    // Apply attendance-only protection
    useAttendanceOnlyProtection();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Close sidebar when close-sidebar event is dispatched
    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };

        window.addEventListener('close-sidebar', handleCloseSidebar);

        return () => {
            window.removeEventListener('close-sidebar', handleCloseSidebar);
        };
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- MODIFIED: Sidebar layout for responsiveness --- */}
            {/* Overlay for mobile */}
            {isSidebarOpen && !isFullScreenBill && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar - only show if not in full screen bill mode */}
            {!isFullScreenBill && (
                <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                                 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
                    <Sidebar />
                </div>
            )}

            {/* --- MODIFIED: Main content area for responsiveness --- */}
            <div className={`flex-1 flex flex-col overflow-hidden ${isFullScreenBill ? 'w-full' : ''}`}>
                {/* Mobile and Tablet header - only show if not in full screen bill mode */}
                {!isFullScreenBill && (
                    <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none">
                            <LuMenu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                    </header>
                )}

                <main className={`flex-1 overflow-x-hidden ${isFullScreenBill ? 'overflow-hidden p-0 m-0' : 'overflow-y-auto p-4 md:p-6'}`}>
                    <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="workers/add" element={<AddWorker />} />
                        <Route path="workers/view" element={<ViewWorkers />} />
                        <Route path="workers/attendance" element={<AttendanceTracking />} />
                        <Route path="workers/salary" element={<SalaryReport />} />
                        <Route path="workers/holidays" element={<HolidayManagement />} />
                        <Route path="workers/face-enrollment" element={<FaceEnrollment />} />
                        {/* Removed FaceServiceDiagnostic route */}
                        <Route path="departments/create" element={<CreateDepartment />} />
                        <Route path="departments/view" element={<ViewDepartments />} />
                        <Route path="products/add-category" element={<AddCategory />} />
                        <Route path="products/add" element={<AddProduct />} />
                        <Route path="products/view" element={<ViewProducts />} />
                        <Route path="products/expired" element={<ExpiredProducts />} />
                        <Route path="products/history" element={<ProductHistoryPage />} />
                        <Route path="warehouse/track-stock" element={<TrackStock />} />
                        <Route path="warehouse/stock-alerts" element={<StockAlerts />} />
                        <Route path="warehouse/store-room" element={<StoreRoom />} />
                        <Route path="warehouse/manufacturing" element={<Manufacturing />} />
                        <Route path="warehouse/daily-schedule" element={<DailySchedule />} />
                        <Route path="warehouse/outgoing-materials" element={<OutgoingMaterials />} />
                        <Route path="warehouse/before-packing" element={<BeforePacking />} />
                        <Route path="warehouse/before-packing/pending-items" element={<BeforePackingPendingItems />} />
                        <Route path="warehouse/before-packing/completed-items" element={<BeforePackingCompletedItems />} />
                        <Route path="warehouse/after-packing" element={<AfterPacking />} />
                        <Route path="warehouse/after-packing/pending-items" element={<AfterPackingPendingItems />} />
                        <Route path="warehouse/after-packing/completed-items" element={<AfterPackingCompletedItems />} />
                        <Route path="warehouse/after-packing/add-to-stock" element={<AfterPackingAddToStock />} />
                        <Route path="warehouse/expired-materials" element={<ExpiredMaterials />} />
                        <Route path="warehouse/production-schedules" element={<ProductionSchedules />} /> {/* Add this route */}
                        <Route path="warehouse/material-stock-alerts" element={<MaterialStockAlerts />} />
                        <Route path="warehouse/packing-materials/alerts" element={<AlertPackingMaterials />} />
                        <Route path="warehouse/packing-materials/outgoing" element={<OutgoingPackingMaterials />} />
                        <Route path="warehouse/return-products" element={<ReturnProductsPage />} />
                        <Route path="warehouse/return-products/history" element={<ReturnProductsHistory />} />
                        <Route path="warehouse/packing-materials/view" element={<PackingMaterials />} />
                        <Route path="warehouse/raw-materials" element={<RawMaterials />} />
                        <Route path="shops/add" element={<AddShop />} />
                        <Route path="shops/view" element={<ViewShops />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="tasks/daily" element={<DailyTasks />} />
                        <Route path="tasks/completed" element={<TaskCompleted />} />
                        <Route path="bills/create" element={<AdminCreateBill />} />
                        <Route path="bills/view" element={<AdminViewBills />} />
                        <Route path="invoices/history" element={<InvoiceHistory />} />
                        <Route path="orders" element={<OrderManagement />} />
                        {/* Expense module routes */}
                        <Route path="expenses" element={<ExpenseDashboard />} />
                        <Route path="expenses/add" element={<AddExpense />} />
                        <Route path="expenses/edit/:id" element={<EditExpense />} /> {/* Add this route */}
                        <Route path="expenses/history" element={<ExpenseHistory />} />
                        {/* E-Way bill module routes */}
                        <Route path="eway-bills/create" element={<CreateEWayBill />} />
                        <Route path="eway-bills/history" element={<EWayBillsHistory />} />
                        <Route path="eway-bills/view/:id" element={<ViewEWayBill />} />

                        {/* Report module routes */}
                        <Route path="reports/sales" element={<SalesReport />} />
                        <Route path="reports/purchase" element={<PurchaseReport />} />
                        <Route path="reports/production" element={<ProductionReport />} />
                        <Route path="reports/stock" element={<StockReport />} />
                        <Route path="reports/expiry-batch" element={<ExpiryBatchReport />} />
                        <Route path="reports/gst" element={<GSTReport />} />
                        <Route path="reports/profit-loss" element={<ProfitLossPage />} />

                        <Route path="*" element={<Navigate to="dashboard" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;