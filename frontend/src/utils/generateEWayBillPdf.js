import html2pdf from 'html2pdf.js';

export const generateEWayBillPdf = (ewayBillData) => {
  // Check if required data exists before processing
  if (!ewayBillData) {
    console.error('Invalid E-Way bill data:', ewayBillData);
    alert('Unable to generate PDF: Invalid E-Way bill data');
    return;
  }

  // Generate goods details HTML to match ViewEWayBill exactly with compressed format
  const goodsHtml = (ewayBillData.goodsDetails || []).map((item, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.productName || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.hsnCode || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${item.quantity || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.unit || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right;">${item.taxableValue || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${item.cgstRate ? `${item.cgstRate}%` : ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${item.sgstRate ? `${item.sgstRate}%` : ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${item.igstRate ? `${item.igstRate}%` : ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right;">${item.cgstAmount || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right;">${item.sgstAmount || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right;">${item.igstAmount || ''}</td>
      <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right;">${item.totalAmount || ''}</td>
    </tr>
  `).join('');

  // Generate the complete HTML for the PDF to match ViewEWayBill exactly with compressed format
  const billHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Way Bill - ${ewayBillData.ewbNumber || 'N/A'}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        
        .header h1 {
          color: #000;
          margin: 0;
          font-size: 20px;
        }
        
        .header p {
          color: #000;
          font-size: 12px;
          margin: 3px 0;
        }
        
        .section {
          margin-bottom: 15px;
          border: 1px solid #000;
          padding: 10px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 14px;
          margin: 0 0 8px 0;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          font-weight: bold;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .field {
          margin-bottom: 6px;
        }
        
        .field-label {
          font-size: 11px;
          margin: 0 0 2px 0;
          font-weight: bold;
        }
        
        .field-value {
          font-size: 11px;
          margin: 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-top: 8px;
          table-layout: fixed;
        }
        
        th {
          background-color: #f2f2f2;
          padding: 6px 4px;
          border: 1px solid #000;
          text-align: left;
          font-weight: bold;
        }
        
        td {
          padding: 4px;
          border: 1px solid #000;
          word-wrap: break-word;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        
        .summary-item {
          padding: 8px 6px;
          border: 1px solid #000;
        }
        
        .summary-label {
          font-size: 10px;
          margin: 0 0 3px 0;
          font-weight: bold;
        }
        
        .summary-value {
          font-size: 12px;
          margin: 0;
          font-weight: bold;
        }
        
        .notes {
          font-size: 10px;
          padding-left: 15px;
          margin: 0;
        }
        
        .notes li {
          margin-bottom: 3px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>E-Way Bill</h1>
          <p>Generated in accordance with the Central Goods and Services Tax Act, 2017</p>
        </div>
        
        <!-- E-Way Bill Header -->
        <div class="section">
          <div class="grid">
            <div class="field">
              <p class="field-label">E-Way Bill Number:</p>
              <p class="field-value">${ewayBillData.ewbNumber || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Generated By:</p>
              <p class="field-value">${ewayBillData.generatedBy || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Generated Date:</p>
              <p class="field-value">${ewayBillData.generatedDate || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Valid From:</p>
              <p class="field-value">${ewayBillData.validFrom || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Valid To:</p>
              <p class="field-value">${ewayBillData.validTo || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Supply Type:</p>
              <p class="field-value">${ewayBillData.supplyType || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Sub Type:</p>
              <p class="field-value">${ewayBillData.subType || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Document Type:</p>
              <p class="field-value">${ewayBillData.documentType || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Document Number:</p>
              <p class="field-value">${ewayBillData.documentNumber || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Document Date:</p>
              <p class="field-value">${ewayBillData.documentDate || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- PART-A: Sender Information -->
        <div class="section">
          <h3 class="section-title">PART-A: Sender (From) Information</h3>
          <div class="grid grid-2">
            <div class="field">
              <p class="field-label">GSTIN:</p>
              <p class="field-value">${ewayBillData.senderGstin || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Legal Name:</p>
              <p class="field-value">${ewayBillData.senderLegalName || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Trade Name:</p>
              <p class="field-value">${ewayBillData.senderTradeName || 'N/A'}</p>
            </div>
            
            <div class="field" style="grid-column: span 2;">
              <p class="field-label">Address:</p>
              <p class="field-value">${ewayBillData.senderAddress || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Place:</p>
              <p class="field-value">${ewayBillData.senderPlace || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Pincode:</p>
              <p class="field-value">${ewayBillData.senderPincode || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">State:</p>
              <p class="field-value">${ewayBillData.senderState || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">State Code:</p>
              <p class="field-value">${ewayBillData.senderStateCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- PART-A: Receiver Information -->
        <div class="section">
          <h3 class="section-title">PART-A: Receiver (To) Information</h3>
          <div class="grid grid-2">
            <div class="field">
              <p class="field-label">GSTIN:</p>
              <p class="field-value">${ewayBillData.receiverGstin || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Legal Name:</p>
              <p class="field-value">${ewayBillData.receiverLegalName || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Trade Name:</p>
              <p class="field-value">${ewayBillData.receiverTradeName || 'N/A'}</p>
            </div>
            
            <div class="field" style="grid-column: span 2;">
              <p class="field-label">Address:</p>
              <p class="field-value">${ewayBillData.receiverAddress || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Place:</p>
              <p class="field-value">${ewayBillData.receiverPlace || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Pincode:</p>
              <p class="field-value">${ewayBillData.receiverPincode || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">State:</p>
              <p class="field-value">${ewayBillData.receiverState || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">State Code:</p>
              <p class="field-value">${ewayBillData.receiverStateCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- PART-A: Goods Details -->
        <div class="section">
          <h3 class="section-title">PART-A: Goods Details</h3>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Product Name</th>
                  <th style="width: 8%;">HSN Code</th>
                  <th style="width: 6%;" class="text-center">Qty</th>
                  <th style="width: 6%;">Unit</th>
                  <th style="width: 10%;" class="text-right">Taxable Value</th>
                  <th style="width: 6%;" class="text-center">CGST Rate</th>
                  <th style="width: 6%;" class="text-center">SGST Rate</th>
                  <th style="width: 6%;" class="text-center">IGST Rate</th>
                  <th style="width: 10%;" class="text-right">CGST Amt</th>
                  <th style="width: 10%;" class="text-right">SGST Amt</th>
                  <th style="width: 10%;" class="text-right">IGST Amt</th>
                  <th style="width: 12%;" class="text-right">Total Amt</th>
                </tr>
              </thead>
              <tbody>
                ${goodsHtml || '<tr><td colspan="12" style="text-align: center; padding: 15px;">No goods details available</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- PART-B: Transport Details -->
        <div class="section">
          <h3 class="section-title">PART-B: Transport Details</h3>
          <div class="grid">
            <div class="field">
              <p class="field-label">Transport Mode:</p>
              <p class="field-value">${ewayBillData.transportMode || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Approx Distance (KM):</p>
              <p class="field-value">${ewayBillData.approxDistance || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Transporter ID:</p>
              <p class="field-value">${ewayBillData.transporterId || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Transporter Name:</p>
              <p class="field-value">${ewayBillData.transporterName || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Transporter Document Number:</p>
              <p class="field-value">${ewayBillData.transporterDocNumber || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Transporter Document Date:</p>
              <p class="field-value">${ewayBillData.transporterDocDate || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Vehicle Number:</p>
              <p class="field-value">${ewayBillData.vehicleNumber || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Vehicle Type:</p>
              <p class="field-value">${ewayBillData.vehicleType || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">Place of Dispatch:</p>
              <p class="field-value">${ewayBillData.dispatchPlace || 'N/A'}</p>
            </div>
            
            <div class="field">
              <p class="field-label">State:</p>
              <p class="field-value">${ewayBillData.dispatchState || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- Total Summary Section -->
        <div class="section">
          <h3 class="section-title">Total Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <p class="summary-label">Total Taxable Amount:</p>
              <p class="summary-value">₹${ewayBillData.totalTaxableAmount || '0.00'}</p>
            </div>
            
            <div class="summary-item">
              <p class="summary-label">Total CGST:</p>
              <p class="summary-value">₹${ewayBillData.totalCgst || '0.00'}</p>
            </div>
            
            <div class="summary-item">
              <p class="summary-label">Total SGST:</p>
              <p class="summary-value">₹${ewayBillData.totalSgst || '0.00'}</p>
            </div>
            
            <div class="summary-item">
              <p class="summary-label">Total IGST:</p>
              <p class="summary-value">₹${ewayBillData.totalIgst || '0.00'}</p>
            </div>
            
            <div class="summary-item">
              <p class="summary-label">Total Invoice Value:</p>
              <p class="summary-value">₹${ewayBillData.totalInvoiceValue || '0.00'}</p>
            </div>
          </div>
        </div>
        
        <!-- Notes Section -->
        <div class="section">
          <h3 class="section-title">Notes</h3>
          <ul class="notes">
            ${(ewayBillData.notes || [
              'Validity depends on distance',
              'E-Way Bill needs to be carried during transportation'
            ]).map(note => `<li>${note}</li>`).join('')}
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  const billNumber = ewayBillData.ewbNumber || 'EWayBill';
  const billDate = ewayBillData.generatedDate || new Date().toISOString().split('T')[0];

  const opt = {
    margin: 8,
    filename: `eway_bill_${billNumber}_${billDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(billHtml).set(opt).save();
};