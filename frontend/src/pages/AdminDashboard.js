import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/admin/Sidebar';
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
import MaterialStockAlerts from '../components/admin/warehouse/MaterialStockAlerts';
import AlertPackingMaterials from '../components/admin/warehouse/AlertPackingMaterials';
import OutgoingPackingMaterials from '../components/admin/warehouse/OutgoingPackingMaterials';
import ReturnProductsPage from './ReturnProductsPage';
import ReturnProductsHistory from '../components/admin/warehouse/ReturnProductsHistory';
import PackingMaterials from '../components/admin/warehouse/PackingMaterials';
import RawMaterials from '../components/admin/warehouse/RawMaterials';
// Removed FaceServiceDiagnostic import
import InvoiceHistory from '../components/admin/invoice/InvoiceHistory';
import ProfitLossPage from './ProfitLossPage';
import Settings from '../components/admin/settings/Settings';
// Expense module imports
import ExpenseDashboard from '../components/admin/expense/ExpenseDashboard';
import AddExpense from '../components/admin/expense/AddExpense';
import ExpenseHistory from '../components/admin/expense/ExpenseHistory';
// E-Way bill module imports
import CreateEWayBill from '../components/admin/eway-bills/CreateEWayBill';
import EWayBillsHistory from '../components/admin/eway-bills/EWayBillsHistory';
import ViewEWayBill from '../components/admin/eway-bills/ViewEWayBill';

const AdminDashboardPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                             lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
                <AdminSidebar />
            </div>

            {/* --- MODIFIED: Main content area for responsiveness --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile and Tablet header */}
                <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                    <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
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
                        <Route path="products/history" element={<ProductHistoryPage />} />
                        <Route path="warehouse/track-stock" element={<TrackStock />} />
                        <Route path="warehouse/stock-alerts" element={<StockAlerts />} />
                        <Route path="warehouse/store-room" element={<StoreRoom />} />
                        <Route path="warehouse/manufacturing" element={<Manufacturing />} />
                        <Route path="warehouse/daily-schedule" element={<DailySchedule />} />
                        <Route path="warehouse/outgoing-materials" element={<OutgoingMaterials />} />
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
                        <Route path="billing/create" element={<AdminCreateBill />} />
                        <Route path="billing/view" element={<AdminViewBills />} />
                        <Route path="invoices/history" element={<InvoiceHistory />} />
                        <Route path="profit-loss" element={<ProfitLossPage />} />
                        {/* Expense module routes */}
                        <Route path="expenses" element={<ExpenseDashboard />} />
                        <Route path="expenses/add" element={<AddExpense />} />
                        <Route path="expenses/history" element={<ExpenseHistory />} />
                        {/* E-Way bill module routes */}
                        <Route path="eway-bills/create" element={<CreateEWayBill />} />
                        <Route path="eway-bills/history" element={<EWayBillsHistory />} />
                        <Route path="eway-bills/view/:id" element={<ViewEWayBill />} />
                        <Route path="*" element={<Navigate to="dashboard" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;