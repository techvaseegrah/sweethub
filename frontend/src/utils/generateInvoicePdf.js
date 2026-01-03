import html2pdf from 'html2pdf.js';

export const generateInvoicePdf = (invoiceData) => {
  return generateInvoicePdfInternal(invoiceData, false);
};

export const printInvoice = (invoiceData) => {
  return generateInvoicePdfInternal(invoiceData, true);
};

const generateInvoicePdfInternal = (invoiceData, shouldPrint) => {
  // Handle different invoice data structures
  const shopName = invoiceData?.shop?.name || invoiceData?.shopName || 'The Sweet Hub';
  const shopLocation = invoiceData?.shop?.address || invoiceData?.shopAddress || '156, Dubai Main Road, Thanjavur, Tamil Nadu - 613006';
  const shopPhone = invoiceData?.shop?.phone || invoiceData?.shopPhone || '7339200636';
  const shopGstNumber = invoiceData?.shop?.gstNumber || invoiceData?.shopGstNumber || null;
  const shopFssaiNumber = invoiceData?.shop?.fssaiNumber || invoiceData?.shopFssaiNumber || null;
  const adminName = invoiceData?.admin?.name || 'Admin';
  
  // Extract invoice details
  const invoiceNumber = invoiceData?.invoiceNumber || invoiceData?._id?.slice(-8) || 'N/A';
  const issueDate = invoiceData?.issueDate ? new Date(invoiceData.issueDate).toLocaleDateString() : 
                   invoiceData?.billDate ? new Date(invoiceData.billDate).toLocaleDateString() : new Date().toLocaleDateString();
  const status = invoiceData?.status || 'Active';
  
  // Check for GST information first, then fall back to old tax system
  const gstPercentage = invoiceData?.gstPercentage || 0;
  const gstAmount = invoiceData?.gstAmount || 0;
  const baseAmount = invoiceData?.baseAmount || 0;
  const tax = invoiceData?.tax || 0;
  const grandTotal = invoiceData?.grandTotal || invoiceData?.totalAmount || 0;
  const subtotal = invoiceData?.subtotal || baseAmount || 0;
  
  // Discount information
  const discountType = invoiceData?.discountType || 'none';
  const discountValue = invoiceData?.discountValue || 0;
  const discountAmount = invoiceData?.discountAmount || 0;

  // Check if required data exists before processing
  if (!invoiceData || !invoiceData.items) {
    console.error('Invalid invoice data:', invoiceData);
    alert('Unable to generate PDF: Invalid invoice data');
    return;
  }

  // Generate items HTML
  const itemsHtml = invoiceData.items.map(item => `
    <tr style="font-size: 10px;">
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: left;">${item.productName || item.product?.name || item.name || 'Item'}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 3px 4px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  // Generate the complete HTML for the PDF with compact POS layout
  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${invoiceNumber}</title>
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
        .invoice-container {
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
        .invoice-title {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin: 8px 0;
          color: #333;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 9px;
        }
        .invoice-info div {
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
          .invoice-container {
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
      <div class="invoice-container">
        <!-- FROM Information -->
        ${invoiceData.fromInfo ? `
        <div class="from-to-info">
          <div class="from-to-section">
            <div style="font-weight: bold; margin-bottom: 2px; font-size: 10px;">FROM (Sweet Production Factory)</div>
            <div>${invoiceData.fromInfo.name || ''}</div>
            <div>${invoiceData.fromInfo.address || ''}</div>
            ${invoiceData.fromInfo.gstin ? `<div>GSTIN: ${invoiceData.fromInfo.gstin}</div>` : ''}
            ${invoiceData.fromInfo.state ? `<div>State: ${invoiceData.fromInfo.state}</div>` : ''}
            ${invoiceData.fromInfo.stateCode ? `<div>State Code: ${invoiceData.fromInfo.stateCode}</div>` : ''}
            ${invoiceData.fromInfo.phone ? `<div>Phone: ${invoiceData.fromInfo.phone}</div>` : ''}
            ${invoiceData.fromInfo.email ? `<div>Email: ${invoiceData.fromInfo.email}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- TO Information -->
        ${invoiceData.toInfo ? `
        <div class="from-to-info">
          <div class="from-to-section">
            <div style="font-weight: bold; margin-bottom: 2px; font-size: 10px;">TO (Receiving Branch / Shop)</div>
            <div>${invoiceData.toInfo.name || ''}</div>
            <div>${invoiceData.toInfo.address || ''}</div>
            ${invoiceData.toInfo.gstin ? `<div>GSTIN: ${invoiceData.toInfo.gstin}</div>` : ''}
            ${invoiceData.toInfo.state ? `<div>State: ${invoiceData.toInfo.state}</div>` : ''}
            ${invoiceData.toInfo.stateCode ? `<div>State Code: ${invoiceData.toInfo.stateCode}</div>` : ''}
            ${invoiceData.toInfo.phone ? `<div>Phone: ${invoiceData.toInfo.phone}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Header with Shop Info -->
        <div class="header">
          <div class="shop-name">${shopName}</div>
          <div class="shop-details">${shopLocation}</div>
          ${shopGstNumber ? `<div class="shop-details">GSTIN: ${shopGstNumber}</div>` : ''}
          ${shopFssaiNumber ? `<div class="shop-details">FSSAI: ${shopFssaiNumber}</div>` : ''}
          <div class="shop-details">Phone: ${shopPhone}</div>
        </div>
        
        <div class="invoice-title">INVOICE</div>
        
        <div class="invoice-info">
          <div>
            <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
            <div><strong>Date:</strong> ${issueDate}</div>
            ${adminName && adminName !== 'Admin' ? `<div><strong>From:</strong> ${adminName}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div><strong>Status:</strong> ${status}</div>
          </div>
        </div>
        
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
              <td colspan="3" style="text-align: right; padding: 4px 4px;">Grand Total</td>
              <td style="text-align: right; padding: 4px 4px;">₹${grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 8px; font-size: 9px;">
          <div><strong>Total Items:</strong> ${invoiceData.items.length || 0}</div>
        </div>
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 3px; font-size: 7px;">This is a computer generated invoice</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const opt = {
    margin: shouldPrint ? [5, 2, 5, 2] : 5, // smaller margins for compact layout
    filename: `invoice_${invoiceNumber}_${issueDate.replace(/\//g, '-')}.pdf`,
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
    iframe.srcdoc = invoiceHtml;
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
    html2pdf().from(invoiceHtml).set(opt).save();
  }
};