import * as XLSX from 'xlsx';

/**
 * Generates an Excel file for the Expiry / Batch Report
 * @param {Object} stockData - The stock data with expiry info
 * @param {string} viewName - The name of the view (Global, Admin, or Shop Name)
 */
export const generateExpiryBatchReportExcel = (stockData, viewName = 'Global') => {
    const workbook = XLSX.utils.book_new();

    const getExpiryStatus = (item) => {
        const dateStr = item.expiryDate || item.usedByDate;
        if (!dateStr) return { status: 'No Expiry', days: null };

        const expDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'Expired', days: diffDays };
        if (diffDays <= 7) return { status: 'Expiring ≤ 7 Days', days: diffDays };
        if (diffDays <= 30) return { status: 'Expiring ≤ 30 Days', days: diffDays };
        
        return { status: 'Valid', days: diffDays };
    };

    const formatItem = (item) => {
        const expiryInfo = getExpiryStatus(item);
        const expiryDate = item.expiryDate || item.usedByDate;
        
        return {
            "Item Name": item.name,
            "Category": item.category?.name || 'Uncategorized',
            "Stock Level": item.stockLevel || item.quantity || 0,
            "Expiry Date": expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A',
            "Status": expiryInfo.status,
            "Days Left": expiryInfo.days !== null ? expiryInfo.days : 'N/A'
        };
    };

    // 1. Admin Products
    if (stockData.adminStock.products.length > 0) {
        const sheetData = stockData.adminStock.products.map(formatItem);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetData), "Admin Products");
    }

    // 2. Admin Raw Materials
    if (stockData.adminStock.rawMaterials.length > 0) {
        const sheetData = stockData.adminStock.rawMaterials.map(formatItem);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetData), "Admin Raw Materials");
    }

    // 3. Admin Packing Materials
    if (stockData.adminStock.packingMaterials.length > 0) {
        const sheetData = stockData.adminStock.packingMaterials.map(formatItem);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetData), "Admin Packing Materials");
    }

    // 4. Shop Stock
    stockData.shopStock.forEach(shop => {
        if (shop.items.length > 0) {
            const sheetData = shop.items.map(formatItem);
            const sheetName = `${shop.shopName.substring(0, 20)} Expiry`;
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetData), sheetName);
        }
    });

    const filename = `Expiry_Report_${viewName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
};
