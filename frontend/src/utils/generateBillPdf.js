import html2pdf from 'html2pdf.js';

export const generateBillPdf = (billData, shopData) => {
  return generateBillPdfInternal(billData, shopData, false);
};

export const printBill = (billData, shopData) => {
  return generateBillPdfInternal(billData, shopData, true);
};

const generateBillPdfInternal = (billData, shopData, shouldPrint) => {
  // Handle different bill data structures
  const shopName = shopData?.name || billData?.shop?.name || billData?.shopName || 'The Sweet Hub';
  const shopLocation = shopData?.address || billData?.shop?.address || billData?.shopAddress || '156, Dubai Main Road, Thanjavur, Tamil Nadu - 613006';
  const shopPhone = shopData?.phone || billData?.shop?.phone || billData?.shopPhone || '7339200636';
  const shopGstNumber = shopData?.gstNumber || billData?.shop?.gstNumber || billData?.shopGstNumber || null;
  const shopFssaiNumber = shopData?.fssaiNumber || billData?.shop?.fssaiNumber || billData?.shopFssaiNumber || null;
  
  // Extract bill details
  const billId = billData?.billId || (billData?._id ? billData._id.slice(-8) : 'N/A');
  const billDate = billData?.billDate ? new Date(billData.billDate).toLocaleDateString() : new Date().toLocaleDateString();
  const paymentMethod = billData?.paymentMethod || 'Cash';
  const customerName = billData?.customerName || 'Walk-in Customer';
  const customerMobile = billData?.customerMobileNumber || 'N/A';
  
  // Calculate totals if not provided
  const subtotal = billData?.subtotal || 
    (billData?.items ? 
      billData.items.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)), 0) : 
      0);
      
  const tax = billData?.tax || 0;
  const totalAmount = billData?.totalAmount || (subtotal + tax);
  const amountPaid = billData?.amountPaid || 0;
  const balance = billData?.balance || (totalAmount - amountPaid);
  
  // GST information
  const gstPercentage = billData?.gstPercentage || 0;
  const gstAmount = billData?.gstAmount || 0;
  const baseAmount = billData?.baseAmount || subtotal;
  
  // Discount information
  const discountType = billData?.discountType || 'none';
  const discountValue = billData?.discountValue || 0;
  const discountAmount = billData?.discountAmount || 0;

  // Check if required data exists before processing
  if (!billData || !billData.items) {
    console.error('Invalid bill data:', billData);
    alert('Unable to generate PDF: Invalid bill data');
    return;
  }

  // Generate items HTML
  const itemsHtml = billData.items.map(item => `
    <tr style="font-size: 10px;">
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: left;">${item.productName || item.product?.name || item.name || 'Item'}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  // Generate the complete HTML for the PDF with compact POS layout
  const billHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bill - ${billId}</title>
      <style>
        @page {
          size: 80mm ${shouldPrint ? 'auto' : '150mm'};
          margin: 8mm 5mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 10px;
          line-height: 1.2;
        }
        .bill-container {
          max-width: 76mm;
          margin: 0 auto;
          padding: 5mm;
          border: 0;
          box-shadow: none;
        }
        .header {
          text-align: center;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid #333;
        }
        .shop-name {
          font-size: 12px;
          font-weight: bold;
          margin: 0 0 2px 0;
          color: #333;
        }
        .shop-details {
          font-size: 8px;
          margin: 2px 0;
          color: #666;
        }
        .bill-title {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin: 8px 0;
          color: #333;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 9px;
        }
        .bill-info div {
          margin: 1px 0;
        }
        .from-to-info {
          margin: 8px 0;
          font-size: 9px;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          padding: 5px 0;
        }
        .from-to-section {
          margin-bottom: 5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 10px;
        }
        .items-table th {
          font-size: 9px;
          text-align: left;
          padding: 3px 4px;
          background-color: #f2f2f2;
          border-bottom: 2px solid #333;
        }
        .items-table td {
          padding: 3px 4px;
          border-bottom: 1px solid #ddd;
        }
        .summary-row {
          font-weight: bold;
          font-size: 10px;
        }
        .summary-row td {
          padding: 2px 4px;
        }
        .total-row {
          font-size: 11px;
          font-weight: bold;
          border-top: 1px solid #333;
          border-bottom: 1px solid #333;
        }
        .total-row td {
          padding: 4px 4px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 8px;
          color: #777;
          padding-top: 5px;
          border-top: 1px solid #eee;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 10px;
            line-height: 1.2;
          }
          .bill-container {
            max-width: 76mm;
            margin: 0 auto;
            padding: 5mm;
          }
          .items-table th {
            font-size: 9px;
          }
          .items-table td {
            font-size: 10px;
            padding: 3px 4px;
          }
          .summary-row {
            font-size: 10px;
          }
          .total-row {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <!-- Header with Shop Info -->
        <div class="header">
          <div class="shop-name">${shopName}</div>
          <div class="shop-details">${shopLocation}</div>
          ${shopGstNumber ? `<div class="shop-details">GSTIN: ${shopGstNumber}</div>` : ''}
          ${shopFssaiNumber ? `<div class="shop-details">FSSAI: ${shopFssaiNumber}</div>` : ''}
          <div class="shop-details">Phone: ${shopPhone}</div>
        </div>
        
        <div class="bill-title">BILL</div>
        
        <!-- Bill Details -->
        <div class="bill-info">
          <div>
            <div><strong>Bill ID:</strong> ${billId}</div>
            <div><strong>Date:</strong> ${billDate}</div>
            <div><strong>Customer:</strong> ${customerName}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Mobile:</strong> ${customerMobile}</div>
            <div><strong>Payment:</strong> ${paymentMethod}</div>
          </div>
        </div>
        
        <!-- Compressed FROM and TO Information -->
        ${(billData.fromInfo && Object.values(billData.fromInfo).some(val => val)) || (billData.toInfo && Object.values(billData.toInfo).some(val => val)) ? `
        <div class="from-to-info">
          <!-- FROM Information -->
          ${billData.fromInfo ? `
          <div class="from-to-section">
            <div style="font-weight: bold; margin-bottom: 2px;">FROM:</div>
            <div>${billData.fromInfo.name || ''}</div>
            <div>${billData.fromInfo.address || ''}</div>
            ${billData.fromInfo.gstin ? `<div>GSTIN: ${billData.fromInfo.gstin}</div>` : ''}
            ${billData.fromInfo.phone ? `<div>Phone: ${billData.fromInfo.phone}</div>` : ''}
          </div>
          ` : ''}
          
          <!-- TO Information -->
          ${billData.toInfo ? `
          <div class="from-to-section" style="margin-top: 5px;">
            <div style="font-weight: bold; margin-bottom: 2px;">TO:</div>
            <div>${billData.toInfo.name || ''}</div>
            <div>${billData.toInfo.address || ''}</div>
            ${billData.toInfo.gstin ? `<div>GSTIN: ${billData.toInfo.gstin}</div>` : ''}
            ${billData.toInfo.phone ? `<div>Phone: ${billData.toInfo.phone}</div>` : ''}
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">Subtotal</td>
              <td style="text-align: right; padding: 3px 4px;">₹${subtotal.toFixed(2)}</td>
            </tr>
            ${discountAmount > 0 ? `
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">
                Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}:
              </td>
              <td style="text-align: right; padding: 3px 4px;">-₹${discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">Net Amount</td>
              <td style="text-align: right; padding: 3px 4px;">₹${(subtotal - discountAmount).toFixed(2)}</td>
            </tr>
            ${gstPercentage > 0 ? `
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">GST (${gstPercentage}%)</td>
              <td style="text-align: right; padding: 3px 4px;">₹${gstAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="summary-row total-row">
              <td colspan="3" style="text-align: right; padding: 4px 4px;">Total Amount</td>
              <td style="text-align: right; padding: 4px 4px;">₹${totalAmount.toFixed(2)}</td>
            </tr>
            ${amountPaid > 0 ? `
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">Amount Paid</td>
              <td style="text-align: right; padding: 3px 4px;">₹${amountPaid.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${balance > 0 ? `
            <tr class="summary-row">
              <td colspan="3" style="text-align: right; padding: 3px 4px;">Balance</td>
              <td style="text-align: right; padding: 3px 4px;">₹${balance.toFixed(2)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <div style="margin-top: 8px; font-size: 9px;">
          <div><strong>Total Items:</strong> ${billData.items.length || 0}</div>
        </div>
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 3px; font-size: 7px;">This is a computer generated bill</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const opt = {
    margin: shouldPrint ? [5, 2, 5, 2] : 5, // smaller margins for compact layout
    filename: `bill_${billId}_${billDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: shouldPrint ? [80, 150] : 'a4', orientation: 'portrait' }, // compact format for printing
  };

  if (shouldPrint) {
    // Create a temporary iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '80mm';
    iframe.style.height = 'auto';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1';
    iframe.srcdoc = billHtml;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  } else {
    // Generate and download the PDF
    html2pdf().from(billHtml).set(opt).save();
  }
};