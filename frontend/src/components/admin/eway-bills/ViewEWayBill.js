import React, { useState, useContext } from 'react';
import { LuArrowLeft, LuPrinter, LuDownload } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { useEWayBills } from '../../../context/EWayBillContext';
import { generateEWayBillPdf } from '../../../utils/generateEWayBillPdf';

const ViewEWayBill = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ewayBills } = useEWayBills();
  
  // Find the E-Way bill by ID
  const ewayBillData = ewayBills.find(bill => bill.id == id) || {};

  const handlePrint = () => {
    // Add a small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = () => {
    // Generate and download the E-Way Bill PDF
    generateEWayBillPdf(ewayBillData);
  };

  // Show a message if the bill is not found
  if (!ewayBillData.id) {
    return (
      <div className="space-y-6 print:p-0">
        <div className="flex items-center gap-4 print:hidden">
          <button 
            onClick={() => navigate('/admin/eway-bills/history')}
            className="p-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md"
          >
            <LuArrowLeft className="text-gray-600 text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">E-Way Bill Not Found</h1>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600">The E-Way bill you are looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0 print:max-w-none print:w-full">
      {/* Print-specific styles - matching the PDF styling */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .print-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          
          .print-header h1 {
            color: #000;
            margin: 0;
            font-size: 24px;
          }
          
          .print-header p {
            color: #000;
            font-size: 14px;
            margin: 5px 0;
          }
          
          .print-section {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 15px;
            page-break-inside: avoid;
          }
          
          .print-section-title {
            font-size: 16px;
            margin: 0 0 10px 0;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            font-weight: bold;
          }
          
          .print-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          
          .print-grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .print-grid-5 {
            grid-template-columns: repeat(5, 1fr);
          }
          
          .print-field {
            margin-bottom: 8px;
          }
          
          .print-field-label {
            font-size: 12px;
            margin: 0 0 3px 0;
            font-weight: bold;
          }
          
          .print-field-value {
            font-size: 13px;
            margin: 0;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 10px;
          }
          
          .print-th {
            background-color: #f2f2f2;
            padding: 8px;
            border: 1px solid #000;
            text-align: left;
            font-weight: bold;
          }
          
          .print-td {
            padding: 8px;
            border: 1px solid #000;
          }
          
          .print-text-center {
            text-align: center;
          }
          
          .print-text-right {
            text-align: right;
          }
          
          .print-summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
          }
          
          .print-summary-item {
            padding: 10px;
            border: 1px solid #000;
          }
          
          .print-summary-label {
            font-size: 12px;
            margin: 0 0 5px 0;
            font-weight: bold;
          }
          
          .print-summary-value {
            font-size: 14px;
            margin: 0;
            font-weight: bold;
          }
          
          .print-notes {
            font-size: 12px;
            padding-left: 20px;
            margin: 0;
          }
          
          .print-notes li {
            margin-bottom: 5px;
          }
          
          /* Existing print styles */
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          .print\\:px-1 {
            padding-left: 0.25rem !important;
            padding-right: 0.25rem !important;
          }
          .print\\:py-1 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }
          .print\\:gap-3 {
            gap: 0.75rem !important;
          }
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .print\\:pl-4 {
            padding-left: 1rem !important;
          }
          .print\\:font-normal {
            font-weight: normal !important;
          }
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          .print\\:break-after {
            page-break-after: always;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
      {/* Header - Hidden when printing */}
      <div className="flex items-center gap-4 print:hidden">
        <button 
          onClick={() => navigate('/admin/eway-bills/history')}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md"
        >
          <LuArrowLeft className="text-gray-600 text-xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">E-Way Bill Details</h1>
          <p className="text-gray-600">View E-Way Bill #{ewayBillData.ewbNumber || 'N/A'}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LuPrinter className="text-lg" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <LuDownload className="text-lg" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Print Header - Visible only when printing */}
      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold">E-Way Bill</h1>
        <p className="text-sm">Generated in accordance with the Central Goods and Services Tax Act, 2017</p>
        <div className="border-b-2 border-black my-4"></div>
      </div>

      {/* E-Way Bill Content - Styled for both screen and print */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:p-0 print:border-none print:shadow-none print:rounded-none print:border-0 print-container">
        {/* E-Way Bill Header */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <div className="text-center mb-4 print:mb-3 print-header">
            <h2 className="text-xl font-bold print:text-xl">E-Way Bill</h2>
            <p className="text-sm print:text-xs">Generated in accordance with the Central Goods and Services Tax Act, 2017</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print-grid">
            <div className="print-field">
              <p className="text-sm font-medium print:text-xs print:font-normal print-field-label">E-Way Bill Number:</p>
              <p className="font-bold print:text-sm print-field-value">{ewayBillData.ewbNumber || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Generated By:</p>
              <p className="print-field-value">{ewayBillData.generatedBy || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Generated Date:</p>
              <p className="print-field-value">{ewayBillData.generatedDate || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Valid From:</p>
              <p className="print-field-value">{ewayBillData.validFrom || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Valid To:</p>
              <p className="print-field-value">{ewayBillData.validTo || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Supply Type:</p>
              <p className="print-field-value">{ewayBillData.supplyType || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Sub Type:</p>
              <p className="print-field-value">{ewayBillData.subType || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Document Type:</p>
              <p className="print-field-value">{ewayBillData.documentType || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Document Number:</p>
              <p className="print-field-value">{ewayBillData.documentNumber || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Document Date:</p>
              <p className="print-field-value">{ewayBillData.documentDate || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* PART-A: Sender Information */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-3 print:text-lg print:mb-2 print-section-title">PART-A: Sender (From) Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print-grid print-grid-2">
            <div className="print-field">
              <p className="text-sm font-medium print:text-xs print:font-normal print-field-label">GSTIN:</p>
              <p className="print:text-sm print-field-value">{ewayBillData.senderGstin || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Legal Name:</p>
              <p className="print-field-value">{ewayBillData.senderLegalName || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Trade Name:</p>
              <p className="print-field-value">{ewayBillData.senderTradeName || 'N/A'}</p>
            </div>
            
            <div className="md:col-span-2 print:col-span-2">
              <p className="text-sm font-medium print-field-label">Address:</p>
              <p className="print-field-value">{ewayBillData.senderAddress || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Place:</p>
              <p className="print-field-value">{ewayBillData.senderPlace || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Pincode:</p>
              <p className="print-field-value">{ewayBillData.senderPincode || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">State:</p>
              <p className="print-field-value">{ewayBillData.senderState || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">State Code:</p>
              <p className="print-field-value">{ewayBillData.senderStateCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* PART-A: Receiver Information */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-3 print:text-lg print:mb-2 print-section-title">PART-A: Receiver (To) Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print-grid print-grid-2">
            <div className="print-field">
              <p className="text-sm font-medium print:text-xs print:font-normal print-field-label">GSTIN:</p>
              <p className="print:text-sm print-field-value">{ewayBillData.receiverGstin || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Legal Name:</p>
              <p className="print-field-value">{ewayBillData.receiverLegalName || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Trade Name:</p>
              <p className="print-field-value">{ewayBillData.receiverTradeName || 'N/A'}</p>
            </div>
            
            <div className="md:col-span-2 print:col-span-2">
              <p className="text-sm font-medium print-field-label">Address:</p>
              <p className="print-field-value">{ewayBillData.receiverAddress || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Place:</p>
              <p className="print-field-value">{ewayBillData.receiverPlace || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Pincode:</p>
              <p className="print-field-value">{ewayBillData.receiverPincode || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">State:</p>
              <p className="print-field-value">{ewayBillData.receiverState || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">State Code:</p>
              <p className="print-field-value">{ewayBillData.receiverStateCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* PART-A: Goods Details */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-3 print:text-lg print:mb-2 print-section-title">PART-A: Goods Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 print:border-black print:text-xs print-table">
              <thead>
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th">Product Name</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th">HSN Code</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-center">Qty</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-right">Taxable Value</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-center">CGST Rate</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-center">SGST Rate</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-center">IGST Rate</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-right">CGST Amt</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-right">SGST Amt</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-right">IGST Amt</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs print:border-black print:px-1 print:py-1 print-th print-text-right">Total Amt</th>
                </tr>
              </thead>
              <tbody>
                {(ewayBillData.goodsDetails || []).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td">{item.productName || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td">{item.hsnCode || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-center">{item.quantity || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td">{item.unit || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-right">{item.taxableValue || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-center">{item.cgstRate ? `${item.cgstRate}%` : ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-center">{item.sgstRate ? `${item.sgstRate}%` : ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-center">{item.igstRate ? `${item.igstRate}%` : ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-right">{item.cgstAmount || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-right">{item.sgstAmount || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-right">{item.igstAmount || ''}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs print:border-black print:px-1 print:py-1 print-td print-text-right">{item.totalAmount || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* PART-B: Transport Details */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-3 print:text-lg print:mb-2 print-section-title">PART-B: Transport Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print-grid">
            <div className="print-field">
              <p className="text-sm font-medium print:text-xs print:font-normal print-field-label">Transport Mode:</p>
              <p className="print:text-sm print-field-value">{ewayBillData.transportMode || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Approx Distance (KM):</p>
              <p className="print-field-value">{ewayBillData.approxDistance || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Transporter ID:</p>
              <p className="print-field-value">{ewayBillData.transporterId || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Transporter Name:</p>
              <p className="print-field-value">{ewayBillData.transporterName || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Transporter Document Number:</p>
              <p className="print-field-value">{ewayBillData.transporterDocNumber || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Transporter Document Date:</p>
              <p className="print-field-value">{ewayBillData.transporterDocDate || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Vehicle Number:</p>
              <p className="print-field-value">{ewayBillData.vehicleNumber || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Vehicle Type:</p>
              <p className="print-field-value">{ewayBillData.vehicleType || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">Place of Dispatch:</p>
              <p className="print-field-value">{ewayBillData.dispatchPlace || 'N/A'}</p>
            </div>
            
            <div className="print-field">
              <p className="text-sm font-medium print-field-label">State:</p>
              <p className="print-field-value">{ewayBillData.dispatchState || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Total Summary Section */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-3 print:text-lg print:mb-2 print-section-title">Total Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 print:grid-cols-5 print:gap-4 print-grid print-grid-5">
            <div className="print-summary-item">
              <p className="text-sm font-medium print:text-xs print:font-normal print-summary-label">Total Taxable Amount:</p>
              <p className="font-bold print:text-sm print-summary-value">₹{ewayBillData.totalTaxableAmount || '0.00'}</p>
            </div>
            
            <div className="print-summary-item">
              <p className="text-sm font-medium print-summary-label">Total CGST:</p>
              <p className="font-bold print-summary-value">₹{ewayBillData.totalCgst || '0.00'}</p>
            </div>
            
            <div className="print-summary-item">
              <p className="text-sm font-medium print-summary-label">Total SGST:</p>
              <p className="font-bold print-summary-value">₹{ewayBillData.totalSgst || '0.00'}</p>
            </div>
            
            <div className="print-summary-item">
              <p className="text-sm font-medium print-summary-label">Total IGST:</p>
              <p className="font-bold print-summary-value">₹{ewayBillData.totalIgst || '0.00'}</p>
            </div>
            
            <div className="print-summary-item">
              <p className="text-sm font-medium print-summary-label">Total Invoice Value:</p>
              <p className="font-bold print-summary-value">₹{ewayBillData.totalInvoiceValue || '0.00'}</p>
            </div>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="border border-gray-300 rounded-lg p-4 print:border-black print:rounded-none print:border print:p-4 print:print-section">
          <h3 className="text-md font-semibold mb-2 print:text-lg print:mb-2 print-section-title">Notes</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm print:text-xs print:pl-4 print-notes">
            {(ewayBillData.notes || [
              'Validity depends on distance',
              'E-Way Bill needs to be carried during transportation'
            ]).map((note, index) => (
              <li key={index} className="print:text-xs">{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ViewEWayBill;