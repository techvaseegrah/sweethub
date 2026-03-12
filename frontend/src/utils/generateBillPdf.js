import html2pdf from 'html2pdf.js';
import { formatDateToDDMMYYYY } from './unitConversion';

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
  const billDate = billData?.billDate ? formatDateToDDMMYYYY(billData.billDate) : formatDateToDDMMYYYY(new Date().toISOString());
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

  // Display GST: Extract GST from subtotal (since prices are GST-inclusive)
  // This ensures the math adds up: displayBase + displayCGST + displaySGST = subtotal
  const displayBaseOfSubtotal = gstPercentage > 0 ? subtotal / (1 + gstPercentage / 100) : subtotal;
  const displayGstOfSubtotal = subtotal - displayBaseOfSubtotal;
  const displayCgst = displayGstOfSubtotal / 2;
  const displaySgst = displayGstOfSubtotal / 2;

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
  // CHANGED: border-bottom style to dotted - only important lines
  const itemsHtml = billData.items.map((item, index) => {
    const itemDisplayTotal = item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0);
    return `
    <tr style="font-size: 12px;">
      <td style="padding: 2px 3px; text-align: center;">${index + 1}</td>
      <td style="padding: 2px 3px; text-align: left;">${item.productName || item.product?.name || item.name || 'Item'}</td>
      <td style="padding: 2px 3px; text-align: center;">${item.quantity || 0}${item.unit ? ' ' + item.unit : ''}</td>
      <td style="padding: 2px 3px; text-align: right;">₹${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 2px 3px; text-align: right;">₹${itemDisplayTotal.toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  // Generate the complete HTML for the PDF with compact POS layout
  const billHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bill - ${billId}</title>
      <style>
        @page {
          size: 58mm ${shouldPrint ? 'auto' : '150mm'};
          margin: 5mm 2mm;
        }
        * {
          color: #000;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
        }
        .bill-container {
          max-width: 54mm;
          margin: 0 auto;
          padding: 5mm;
          border: 0;
          box-shadow: none;
        }
        .header {
          text-align: center;
          margin-bottom: 8px;
          padding-bottom: 5px;
        }
        .shop-name {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 2px 0;
          color: #000;
        }
        .shop-details {
          font-size: 11px;
          font-weight: 600;
          margin: 2px 0;
          color: #000;
        }
        .bill-title {
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          margin: 8px 0;
          color: #000;
        }
        .bill-info {
          margin: 5px 0;
          font-size: 12px;
          color: #000;
          font-weight: 600;
        }
        .bill-info-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          color: #000;
        }
        .from-to-info {
          margin: 8px 0;
          font-size: 12px;
          padding: 5px 0;
          color: #000;
          font-weight: 600;
        }
        .from-to-section {
          margin-bottom: 5px;
          color: #000;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 12px;
        }
        .items-table th {
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          padding: 2px 3px;
          background-color: #fff;
          color: #000;
        }
        .items-table td {
          padding: 2px 3px;
          font-size: 12px;
          color: #000;
          font-weight: 500;
        }
        .summary-row {
          font-weight: 700;
          font-size: 12px;
          color: #000;
        }
        .summary-row td {
          padding: 2px 3px;
          color: #000;
        }
        .total-row {
          font-size: 14px;
          font-weight: 800;
          color: #000;
        }
        .total-row td {
          padding: 4px 4px;
          color: #000;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 11px;
          color: #000;
          font-weight: 600;
          padding-top: 5px;
        }
        @media print {
          /* Force pure black on everything for crisp thermal/paper printing */
          * {
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-size: 12px;
            line-height: 1.2;
            color: #000000;
          }
          .bill-container {
            max-width: 54mm;
            margin: 0 auto;
            padding: 5mm;
          }
          /* Bold headings for better print visibility */
          .shop-name {
            font-size: 17px;
            font-weight: 800;
            color: #000000;
          }
          .bill-title {
            font-size: 17px;
            font-weight: 800;
            color: #000000;
          }
          .shop-details {
            font-size: 11px;
            font-weight: 600;
            color: #000000;
          }
          .bill-info {
            font-size: 12px;
            font-weight: 600;
            color: #000000;
          }
          /* Table header — semi-bold and black */
          .items-table th {
            font-size: 11px;
            font-weight: 700;
            color: #000000;
          }
          .items-table td {
            font-size: 12px;
            font-weight: 500;
            padding: 2px 3px;
            color: #000000;
          }
          /* Summary rows — bold labels */
          .summary-row {
            font-size: 12px;
            font-weight: 700;
            color: #000000;
          }
          .summary-row td {
            color: #000000;
          }
          /* Grand total row — extra bold */
          .total-row {
            font-size: 14px;
            font-weight: 800;
            color: #000000;
          }
          .total-row td {
            color: #000000;
          }
          /* Strong tags — ensure black */
          strong {
            font-weight: 700;
            color: #000000;
          }
          /* Footer */
          .footer {
            color: #000000;
            font-weight: 600;
          }
          /* FROM / TO section labels */
          .from-to-info,
          .from-to-section {
            color: #000000;
            font-weight: 600;
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
          <div style="margin-top: 5px; border-top: 1px dotted #000;"></div>
        </div>
        
        <div class="bill-title">BILL</div>
        
        <!-- Bill Details -->
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #000; margin: 5px 0;">
          <div style="text-align: left;">
            <div><strong>Bill ID:</strong> ${billId}</div>
            <div><strong>Date:</strong> ${billDate}</div>
            <div><strong>Customer:</strong> ${customerName}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Mobile:</strong></div>
            <div>${customerMobile}</div>
            <div style="margin-top: 4px;"><strong>Payment:</strong></div>
            <div>${paymentMethod}</div>
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
        <div style="margin: 6px 0; border-top: 1px dotted #000;"></div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">Subtotal</td>
              <td style="text-align: right; padding: 2px 3px;">₹${displayBaseOfSubtotal.toFixed(2)}</td>
            </tr>
            ${gstPercentage > 0 ? `
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">CGST@${(gstPercentage / 2).toFixed(1)}%</td>
              <td style="text-align: right; padding: 2px 3px;">₹${displayCgst.toFixed(2)}</td>
            </tr>
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">SGST@${(gstPercentage / 2).toFixed(1)}%</td>
              <td style="text-align: right; padding: 2px 3px;">₹${displaySgst.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${discountAmount > 0 ? `
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">
                Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}:
              </td>
              <td style="text-align: right; padding: 2px 3px;">₹${discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="summary-row total-row">
              <td colspan="4" style="text-align: right; padding: 3px 3px;">Total Amount</td>
              <td style="text-align: right; padding: 3px 3px;">₹${totalAmount.toFixed(2)}</td>
            </tr>
            ${amountPaid > 0 ? `
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">Amount Paid</td>
              <td style="text-align: right; padding: 2px 3px;">₹${amountPaid.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${balance > 0 ? `
            <tr class="summary-row">
              <td colspan="4" style="text-align: right; padding: 2px 3px;">Balance</td>
              <td style="text-align: right; padding: 2px 3px;">₹${balance.toFixed(2)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        ${gstPercentage > 0 ? `
        <div style="margin-top: 6px; border-top: 1px dotted #000; padding-top: 5px; font-size: 12px; font-weight: 600;">
          <div style="font-weight: 700; margin-bottom: 3px;">Tax Details:</div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <div>CGST@${(gstPercentage / 2).toFixed(1)}% on ₹${displayBaseOfSubtotal.toFixed(2)}</div>
            <div>₹${displayCgst.toFixed(2)}</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <div>SGST@${(gstPercentage / 2).toFixed(1)}% on ₹${displayBaseOfSubtotal.toFixed(2)}</div>
            <div>₹${displaySgst.toFixed(2)}</div>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <div>Thank you for your purchase with SweetHub!</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const opt = {
    margin: shouldPrint ? [2, 2, 2, 2] : 5, // smaller margins for 58mm format
    filename: `bill_${billId}_${billDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: shouldPrint ? [58, 150] : 'a4', orientation: 'portrait' }, // 58mm format for thermal printers
  };

  if (shouldPrint) {
    // Create a temporary iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '58mm';
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