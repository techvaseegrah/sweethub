import * as XLSX from 'xlsx';
import { formatDateToDDMMYYYY, formatDateTime } from './unitConversion'; // Assuming these exist, otherwise use standard Date

export const generateBillExcel = (bills, fromDate, toDate) => {
    // invalid dates check
    if (!fromDate || !toDate) {
        alert("Please select both From and To dates.");
        return;
    }

    const start = new Date(fromDate).setHours(0, 0, 0, 0);
    const end = new Date(toDate).setHours(23, 59, 59, 999);

    const filteredBills = bills.filter(bill => {
        // Check both billDate and createdAt
        const billDate = bill.billDate ? new Date(bill.billDate) : new Date(bill.createdAt);
        const time = billDate.getTime();
        return time >= start && time <= end && !bill.isDeleted; // Exclude deleted bills if needed
    });

    if (filteredBills.length === 0) {
        alert("No bills found for the selected date range.");
        return;
    }

    const data = filteredBills.map(bill => ({
        "Date": bill.billDate ? formatDateTime(bill.billDate).date : formatDateTime(bill.createdAt).date,
        "Customer Name": bill.customerName || "N/A",
        "Mobile Number": bill.customerMobileNumber || "N/A",
        // Add more fields if requested, but user asked specifically for these
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");

    // Generate filename
    const filename = `Bills_Report_${fromDate}_to_${toDate}.xlsx`;

    XLSX.writeFile(workbook, filename);
};
