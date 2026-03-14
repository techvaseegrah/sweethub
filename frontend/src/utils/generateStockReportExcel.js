import * as XLSX from 'xlsx';

/**
 * Generates an Excel file for the Stock Report
 * @param {Object} stockData - The stock data fetched from the API
 * @param {Object} dateRange - The selected date range { startDate, endDate }
 * @param {string} viewName - The name of the view (Global, Admin, or Shop Name)
 */
export const generateStockReportExcel = (stockData, dateRange, viewName = 'Global') => {
    const workbook = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
        { "Metric": "Report Date", "Value": new Date().toLocaleDateString() },
        { "Metric": "View", "Value": viewName },
        { "Metric": "Admin Items", "Value": stockData.summary.totalAdminItems },
        { "Metric": "Shop Items", "Value": stockData.summary.totalShopItems },
        { "Metric": "Low Stock Items", "Value": stockData.summary.lowStockCount },
        { "Metric": "Total Variations", "Value": stockData.summary.totalAdminItems + stockData.summary.totalShopItems }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Overview");

    // 2. Admin Products Sheet
    if (stockData.adminStock.products.length > 0) {
        const adminProducts = stockData.adminStock.products.map(item => ({
            "Item Name": item.name,
            "Category": item.category?.name || 'Uncategorized',
            "Stock Level": item.stockLevel || item.quantity || 0,
            "Unit": item.prices && item.prices.length > 0 ? item.prices[0].unit : (item.unit || 'unit'),
            "Threshold": item.stockAlertThreshold || 0,
            "Status": (item.stockLevel || item.quantity || 0) <= (item.stockAlertThreshold || 0) ? 'Low Stock' : 'In Stock'
        }));
        const adminProductsSheet = XLSX.utils.json_to_sheet(adminProducts);
        XLSX.utils.book_append_sheet(workbook, adminProductsSheet, "Admin Products");
    }

    // 3. Admin Raw Materials Sheet
    if (stockData.adminStock.rawMaterials.length > 0) {
        const rawMaterials = stockData.adminStock.rawMaterials.map(item => ({
            "Item Name": item.name,
            "Category": item.category?.name || 'Raw Materials',
            "Stock Level": item.stockLevel || item.quantity || 0,
            "Unit": item.unit || 'kg',
            "Threshold": item.stockAlertThreshold || 0,
            "Status": (item.stockLevel || item.quantity || 0) <= (item.stockAlertThreshold || 0) ? 'Low Stock' : 'In Stock'
        }));
        const rawMaterialsSheet = XLSX.utils.json_to_sheet(rawMaterials);
        XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, "Admin Raw Materials");
    }

    // 4. Admin Packing Materials Sheet
    if (stockData.adminStock.packingMaterials.length > 0) {
        const packingMaterials = stockData.adminStock.packingMaterials.map(item => ({
            "Item Name": item.name,
            "Category": item.category?.name || 'Packing Materials',
            "Stock Level": item.stockLevel || item.quantity || 0,
            "Unit": item.unit || 'unit',
            "Threshold": item.stockAlertThreshold || 0,
            "Status": (item.stockLevel || item.quantity || 0) <= (item.stockAlertThreshold || 0) ? 'Low Stock' : 'In Stock'
        }));
        const packingMaterialsSheet = XLSX.utils.json_to_sheet(packingMaterials);
        XLSX.utils.book_append_sheet(workbook, packingMaterialsSheet, "Admin Packing Materials");
    }

    // 5. Shop Stock Sheets
    stockData.shopStock.forEach(shop => {
        if (shop.items.length > 0) {
            const shopItems = shop.items.map(item => ({
                "Item Name": item.name,
                "Category": item.category?.name || 'Uncategorized',
                "Stock Level": item.stockLevel || item.quantity || 0,
                "Unit": item.prices && item.prices.length > 0 ? item.prices[0].unit : (item.unit || 'unit'),
                "Threshold": item.stockAlertThreshold || 0,
                "Status": (item.stockLevel || item.quantity || 0) <= (item.stockAlertThreshold || 0) ? 'Low Stock' : 'In Stock'
            }));
            const shopSheet = XLSX.utils.json_to_sheet(shopItems);
            // Sheet names have a 31 character limit
            const sheetName = `${shop.shopName.substring(0, 25)} Stock`;
            XLSX.utils.book_append_sheet(workbook, shopSheet, sheetName);
        }
    });

    // Generate filename
    const filename = `Stock_Report_${viewName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
