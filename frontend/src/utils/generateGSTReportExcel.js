import * as XLSX from 'xlsx';

/**
 * Generates an Excel file for the GST Report
 * @param {Object} gstData - The GST data
 * @param {Object} dateRange - The selected date range
 */
export const generateGSTReportExcel = (gstData, dateRange) => {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        { "Section": "Report Info", "Metric": "Report Period", "Value": `${dateRange.startDate} to ${dateRange.endDate}` },
        { "Section": "Sales (Output)", "Metric": "Total Taxable Sales", "Value": gstData.totalTaxableSales || 0 },
        { "Section": "Sales (Output)", "Metric": "CGST Collected", "Value": gstData.cgstAmount || 0 },
        { "Section": "Sales (Output)", "Metric": "SGST Collected", "Value": gstData.sgstAmount || 0 },
        { "Section": "Sales (Output)", "Metric": "Total Tax Collected", "Value": gstData.totalTaxLiability || 0 },
        { "Section": "Purchases (ITC)", "Metric": "Total Taxable Purchases", "Value": gstData.totalTaxablePurchases || 0 },
        { "Section": "Purchases (ITC)", "Metric": "GST Paid (ITC)", "Value": gstData.totalPurchaseGST || 0 },
        { "Section": "Final", "Metric": "Net GST Payable", "Value": gstData.netGSTPayable || 0 }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "GST Summary");

    // Breakdown Sheet
    if (gstData.breakdown && gstData.breakdown.length > 0) {
        const breakdownData = gstData.breakdown.map(item => ({
            "Particulars": item.name,
            "Taxable Amount": item.taxableAmount,
            "GST Amount": item.gstAmount
        }));
        const breakdownSheet = XLSX.utils.json_to_sheet(breakdownData);
        XLSX.utils.book_append_sheet(workbook, breakdownSheet, "Detailed Breakdown");
    }

    const filename = `GST_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
};
