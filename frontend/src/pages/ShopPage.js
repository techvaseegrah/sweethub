import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ShopSidebar from '../components/shop/ShopSidebar';
import ShopDashboard from '../components/shop/dashboard/ShopDashboard';

// Import Admin Components to reuse
import CreateDepartment from '../components/admin/department/CreateDepartment';
import ViewDepartments from '../components/admin/department/ViewDepartments';
import ShopAddWorker from '../components/shop/worker/AddWorker';
import ShopViewWorkers from '../components/shop/worker/ViewWorkers';
import ShopAttendanceTracking from '../components/shop/worker/AttendanceTracking';
import AddProduct from '../components/admin/product/AddProduct';
import AddCategory from '../components/admin/product/AddCategory';
import ViewProducts from '../components/admin/product/ViewProducts';
import TrackStock from '../components/admin/warehouse/TrackStock';
import StockAlerts from '../components/admin/warehouse/StockAlerts';

// Import the ViewInvoice component
import ViewInvoice from '../components/shop/invoice/ViewInvoice';

// Import shop billing components
import ShopCreateBill from '../components/shop/billing/ShopCreateBill';
import ShopViewBills from '../components/shop/billing/ShopViewBills';

// Face Enrollment component import removed as per user request
// import FaceEnrollment from '../components/shop/worker/FaceEnrollment';

// Expense module imports
import ExpenseDashboard from '../components/shop/expense/ExpenseDashboard';
import AddExpense from '../components/shop/expense/AddExpense';
import ExpenseHistory from '../components/shop/expense/ExpenseHistory';

// Import new worker components
import SalaryReport from '../components/shop/worker/SalaryReport';
import HolidayManagement from '../components/shop/worker/HolidayManagement';

// Removed packing materials import as per user request
// import ViewPackingMaterials from '../components/shop/warehouse/ViewPackingMaterials';

// Import return products components
import ReturnProductsPage from '../components/shop/returnproducts/ReturnProductsPage';

const ShopPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <ShopSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                    <button
                        onClick={toggleSidebar}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800">SweetHub</h1>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
                    <Routes>
                        {/* Dashboard Route */}
                        <Route path="dashboard" element={<ShopDashboard />} />

                        {/* Department Routes */}
                        <Route path="departments/create" element={<CreateDepartment baseUrl="/shop" />} />
                        <Route path="departments/view" element={<ViewDepartments baseUrl="/shop" />} />

                        {/* Worker Routes */}
                        <Route path="workers/add" element={<ShopAddWorker baseUrl="/shop" />} />
                        <Route path="workers/view" element={<ShopViewWorkers baseUrl="/shop" />} />
                        <Route path="workers/attendance" element={<ShopAttendanceTracking baseUrl="/shop" />} />
                        <Route path="workers/salary-report" element={<SalaryReport />} />
                        <Route path="workers/holidays" element={<HolidayManagement />} />
                        {/* Face enrollment route removed as per user request */}
                        {/* <Route path="face-enrollment" element={<FaceEnrollment />} /> */}

                        {/* Product Routes */}
                        <Route path="products/add" element={<AddProduct baseUrl="/shop" />} />
                        <Route path="products/category" element={<AddCategory baseUrl="/shop" />} />
                        <Route path="products/view" element={<ViewProducts baseUrl="/shop" />} />
                        <Route path="warehouse/stock" element={<TrackStock baseUrl="/shop" />} />
                        <Route path="warehouse/alerts" element={<StockAlerts baseUrl="/shop" />} />
                        {/* Removed packing materials route as per user request
                        <Route path="warehouse/packing-materials" element={<ViewPackingMaterials />} />
                        */}

                        {/* Invoice Route */}
                        <Route path="invoice/view" element={<ViewInvoice />} />

                        {/* Billing Routes */}
                        <Route path="billing/create" element={<ShopCreateBill />} />
                        <Route path="billing/view" element={<ShopViewBills />} />

                        {/* Expense Routes */}
                        <Route path="expenses" element={<ExpenseDashboard />} />
                        <Route path="expenses/add" element={<AddExpense />} />
                        <Route path="expenses/history" element={<ExpenseHistory />} />
                        
                        {/* Return Products Routes */}
                        <Route path="return-products" element={<ReturnProductsPage />} />

                        {/* Default Redirect */}
                        <Route index element={<Navigate to="dashboard" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default ShopPage;