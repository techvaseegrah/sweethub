import * as XLSX from 'xlsx';

/**
 * Generates an Excel file for the Sales Report
 * @param {Object} reportData - The report data fetched from the API
 * @param {Object} dateRange - The selected date range { startDate, endDate }
 * @param {string} shopName - The name of the shop (or "All Shops")
 */
export const generateSalesReportExcel = (reportData, dateRange, shopName = 'All Shops') => {
    const { stats, productSales, customerSales } = reportData;

    // 1. Summary Sheet Data
    const summaryData = [
        { "Category": "Report Period", "Value": `${dateRange.startDate} to ${dateRange.endDate}` },
        { "Category": "Shop", "Value": shopName },
        { "Category": "Total Revenue", "Value": `₹${stats.totalRevenue.toLocaleString()}` },
        { "Category": "Total Transactions", "Value": stats.totalTransactions },
        { "Category": "Total Items Sold", "Value": stats.totalItemsSold },
        { "Category": "Total Customers", "Value": customerSales.length }
    ];

    // 2. Product Sales Sheet Data
    const productData = productSales.map(p => ({
        "Product Name": p.productName,
        "Quantity Sold": `${p.totalQuantity} ${p.unit || 'units'}`,
        "Revenue (₹)": p.totalRevenue,
        "Average Price (₹)": p.totalQuantity > 0 ? (p.totalRevenue / p.totalQuantity).toFixed(2) : 0
    }));

    // 3. Customer Sales Sheet Data
    const customerData = customerSales.map(c => ({
        "Customer Name": c.name,
        "Customer Mobile": c.mobile,
        "Total Orders": c.totalBills,
        "Total Spent (₹)": c.totalSpent
    }));

    // Create workbook and add sheets
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const productSheet = XLSX.utils.json_to_sheet(productData);
    const customerSheet = XLSX.utils.json_to_sheet(customerData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, productSheet, "Product Sales");
    XLSX.utils.book_append_sheet(workbook, customerSheet, "Customer Sales");

    // Generate filename
    const filename = `Sales_Report_${shopName.replace(/\s+/g, '_')}_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
