import html2pdf from 'html2pdf.js';
import { formatDateToDDMMYYYY } from './unitConversion';

// Existing 58mm POS receipt generator
export const generateBillPdf = (billData, shopData) => {
  return generateBillPdfInternal(billData, shopData, false, 'pos');
};

export const printBill = (billData, shopData) => {
  return generateBillPdfInternal(billData, shopData, true, 'pos');
};

// NEW: A4 Tax Invoice generator
export const generateTaxInvoicePdf = (billData, shopData, shouldPrint) => {
  return generateBillPdfInternal(billData, shopData, shouldPrint, 'tax');
};

const generateBillPdfInternal = (billData, shopData, shouldPrint, formatType) => {
  // Handle different bill data structures
  const shopName = shopData?.name || billData?.shop?.name || billData?.shopName || 'The Sweet Hub';
  const shopAddress = shopData?.address || billData?.shop?.address || billData?.shopAddress || '156, Dubai Main Road, Thanjavur, Tamil Nadu - 613006';
  const shopPhone = shopData?.phone || billData?.shop?.phone || billData?.shopPhone || '7339200636';
  const shopGstNumber = shopData?.gstNumber || billData?.shop?.gstNumber || billData?.shopGstNumber || null;
  const shopFssaiNumber = shopData?.fssaiNumber || billData?.shop?.fssaiNumber || billData?.shopFssaiNumber || null;

  // Extract bill details
  const billId = billData?.toInfo?.invoiceNo || billData?.billId || (billData?._id ? billData._id.slice(-8) : 'N/A');
  const billDate = billData?.billDate ? formatDateToDDMMYYYY(billData.billDate) : formatDateToDDMMYYYY(new Date().toISOString());
  const billTime = new Date(billData?.billDate || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const customerName = billData?.toInfo?.name || billData?.customerName || 'Walk-in Customer';
  const customerAddress = billData?.toInfo?.address || '';
  const customerGstin = billData?.toInfo?.gstin || '';
  const customerState = billData?.toInfo?.state || '';
  const customerStateCode = billData?.toInfo?.stateCode || '';
  const customerMobile = billData?.customerMobileNumber || 'N/A';

  // Calculate totals if not provided
  const subtotal = billData?.subtotal ||
    (billData?.items ?
      billData.items.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)), 0) :
      0);

  // Discount information
  const discountAmount = billData?.discountAmount || 0;
  const netAmountBeforeTax = subtotal - discountAmount;

  // GST information
  const gstPercentage = billData?.gstPercentage || 0;
  // Recalculate base and tax for display if needed
  const displayBaseOfNet = gstPercentage > 0 ? netAmountBeforeTax / (1 + gstPercentage / 100) : netAmountBeforeTax;
  const displayGstOfNet = netAmountBeforeTax - displayBaseOfNet;
  const displayCgst = displayGstOfNet / 2;
  const displaySgst = displayGstOfNet / 2;


  const totalAmount = billData?.totalAmount || netAmountBeforeTax; // If gstPercentage is 0, totalAmount = netAmountBeforeTax
  const amountPaid = billData?.amountPaid || 0;
  const balance = billData?.balance || (totalAmount - amountPaid);

  // Check if required data exists before processing
  if (!billData || !billData.items) {
    console.error('Invalid bill data:', billData);
    alert('Unable to generate PDF: Invalid bill data');
    return;
  }

  let htmlContent;
  let filenameSuffix;
  let pdfOptions;

  if (formatType === 'pos') {
    filenameSuffix = `bill_${billId}_${billDate.replace(/\//g, '-')}.pdf`;
    pdfOptions = {
      margin: shouldPrint ? [2, 2, 2, 2] : 5, // smaller margins for 58mm format
      filename: filenameSuffix,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: shouldPrint ? [58, 150] : [58, 200], orientation: 'portrait' }, // 58mm format for thermal printers
    };

    // Generate items HTML for POS
    const itemsHtml = billData.items.map((item, index) => {
      const itemDisplayTotal = (item.quantity || 0) * (item.price || 0); // Calculate per-item total from quantity and price
      return `
      <tr style="font-size: 12px;">
        <td style="padding: 2px 3px; text-align: left;">${item.productName || 'Item'}</td>
        <td style="padding: 2px 3px; text-align: center;">${item.quantity || 0}${item.unit ? ' ' + item.unit : ''}</td>
        <td style="padding: 2px 3px; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 2px 3px; text-align: right;">₹${itemDisplayTotal.toFixed(2)}</td>
      </tr>
    `;
    }).join('');

    // POS HTML structure
    htmlContent = `
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
            max-width: 48mm;
            margin: 0 auto;
            padding: 2mm;
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
            font-weight: 900;
            text-align: center;
            padding: 2px 3px;
            background-color: #fff;
            color: #000;
            border-bottom: 1px solid #000;
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
              max-width: 48mm;
              margin: 0 auto;
              padding: 2mm;
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
              font-weight: 900;
              color: #000000;
              text-align: center;
              border-bottom: 1px solid #000;
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
            <div class="shop-details">${shopAddress}</div>
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
              <div>${billData.paymentMethod}</div>
            </div>
          </div>
          
          <!-- Compressed TO Information -->
          ${billData.toInfo && Object.values(billData.toInfo).some(val => val) ? `
          <div class="from-to-info">
            <div class="from-to-section">
              <div style="font-weight: bold; margin-bottom: 2px;">TO:</div>
              <div>${billData.toInfo.name || ''}</div>
              <div>${billData.toInfo.address || ''}</div>
              ${billData.toInfo.gstin ? `<div>GSTIN: ${billData.toInfo.gstin}</div>` : ''}
              ${billData.toInfo.phone ? `<div>Phone: ${billData.toInfo.phone}</div>` : ''}
            </div>
          </div>
          ` : ''}
          
          <!-- Items Table -->
          <div style="margin: 6px 0; border-top: 1px dotted #000;"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 46%; text-align: left;">Item</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 19%; text-align: right;">Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">Subtotal</td>
                <td style="text-align: right; padding: 2px 3px;">₹${displayBaseOfNet.toFixed(2)}</td>
              </tr>
              ${gstPercentage > 0 ? `
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">CGST@${(gstPercentage / 2).toFixed(1)}%</td>
                <td style="text-align: right; padding: 2px 3px;">₹${displayCgst.toFixed(2)}</td>
              </tr>
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">SGST@${(gstPercentage / 2).toFixed(1)}%</td>
                <td style="text-align: right; padding: 2px 3px;">₹${displaySgst.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${discountAmount > 0 ? `
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">Discount:</td>
                <td style="text-align: right; padding: 2px 3px;">₹${discountAmount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="summary-row total-row">
                <td colspan="3" style="text-align: right; padding: 3px 3px;">Total Amount</td>
                <td style="text-align: right; padding: 3px 3px;">₹${totalAmount.toFixed(2)}</td>
              </tr>
              ${amountPaid > 0 ? `
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">Amount Paid</td>
                <td style="text-align: right; padding: 2px 3px;">₹${amountPaid.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${balance > 0 ? `
              <tr class="summary-row">
                <td colspan="3" style="text-align: right; padding: 2px 3px;">Balance</td>
                <td style="text-align: right; padding: 2px 3px;">₹${balance.toFixed(2)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          ${gstPercentage > 0 ? `
          <div style="margin-top: 6px; border-top: 1px dotted #000; padding-top: 5px; font-size: 12px; font-weight: 600;">
            <div style="font-weight: 700; margin-bottom: 3px;">Tax Details:</div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <div>CGST@${(gstPercentage / 2).toFixed(1)}% on ₹${displayBaseOfNet.toFixed(2)}</div>
              <div>₹${displayCgst.toFixed(2)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <div>SGST@${(gstPercentage / 2).toFixed(1)}% on ₹${displayBaseOfNet.toFixed(2)}</div>
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

  } else if (formatType === 'tax') {
    // A4 Tax Invoice specific logic
    filenameSuffix = `tax_invoice_${billId}_${billDate.replace(/\//g, '-')}.pdf`;
    pdfOptions = {
      margin: [0, 0, 0, 0],
      filename: filenameSuffix,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 1000
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // Calculate itemized totals for the table
    let totalQty = 0;
    let totalTaxAmount = 0;

    // Generate items HTML for A4 Tax Invoice
    const taxInvoiceItemsHtml = billData.items.map((item, index) => {
      const itemQty = parseFloat(item.quantity) || 0;
      const itemTotal = itemQty * (item.price || 0);

      // Calculate tax and base from the total
      const itemTaxAmount = gstPercentage > 0 ? itemTotal - (itemTotal / (1 + gstPercentage / 100)) : 0;
      const itemBaseAmount = itemTotal - itemTaxAmount;
      const pricePerUnit = itemBaseAmount / (itemQty || 1);

      totalQty += itemQty;
      totalTaxAmount += itemTaxAmount;

      return `
        <tr style="text-align: center; border-bottom: 1px solid #eee;">
          <td style="padding: 10px 5px; border-right: 1px solid #eee;">${index + 1}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee; text-align: left; font-weight: 700;">${(item.productName || 'Item').toUpperCase()}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee;">${item.hsn || item.sku || '-'}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee;">${itemQty}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee;">${item.unit || '-'}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee; text-align: right;">₹ ${pricePerUnit.toFixed(2)}</td>
          <td style="padding: 10px 5px; border-right: 1px solid #eee; text-align: right;">₹ ${itemTaxAmount.toFixed(2)} (${gstPercentage}%)</td>
          <td style="padding: 10px 5px; text-align: right; font-weight: 700;">₹ ${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const invoiceWords = numberToWords(totalAmount);
    const placeOfSupply = billData?.toInfo?.placeOfSupply || billData?.placeOfSupply || '33-Tamil Nadu';

    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 0mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.3; background: #fff; }
          .page { 
            width: 210mm; 
            min-height: 297mm;
            background: white; 
            padding: 10mm; 
            margin: 0 auto; 
            box-sizing: border-box; 
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { margin: 0 0 8px 0; font-size: 24px; color: #000; font-weight: 900; }
          .header p { margin: 4px 0; font-size: 11px; color: #000; font-weight: 700; }
          
          .invoice-type { 
            text-align: center; 
            font-size: 18px; 
            font-weight: 900; 
            margin: 8px 0; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            color: #000;
          }
          
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 15px; }
          .details-box h3 { margin: 0 0 8px 0; font-size: 14px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 2px; }
          .details-box p { margin: 3px 0; font-size: 11px; color: #111; font-weight: 600; line-height: 1.4; }
          .val { font-weight: 800; color: #000; }

          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1.5px solid #000; }
          .items-table th { background: #4472c4; color: white; padding: 10px 5px; font-size: 11px; font-weight: 800; border: 1px solid #000; }
          .items-table td { font-size: 11px; padding: 8px 5px; border: 1px solid #000; }
          .total-row { background: #f9f9f9; font-weight: 800; border-top: 2.5px solid #000; }
          
          .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 20px; page-break-inside: avoid; break-inside: avoid; }
          .tax-info { border: 1px solid #000; border-radius: 4px; overflow: hidden; }
          .tax-header { background: #4472c4; color: white; padding: 6px 10px; font-size: 11px; font-weight: 700; }
          .tax-row { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #000; font-size: 10px; color: #000; }
          
          .words-section { margin-top: 15px; border: 1px solid #000; padding: 10px; border-radius: 4px; }
          .words-label { font-size: 10px; color: #333; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
          .words-content { font-size: 12px; font-weight: 800; color: #000; text-transform: capitalize; }

          .amounts-box { border: 1px solid #000; border-radius: 4px; overflow: hidden; }
          .amount-row { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid #000; font-size: 12px; font-weight: 600; color: #000; }
          .grand-total { background: #f0f4ff; font-weight: 900; font-size: 14px; border-top: 2px solid #000; border-bottom: 2px solid #000; }
          
          .signature-section { margin-top: 40px; text-align: right; }
          .signature-box { display: inline-block; text-align: right; }
          .signature-box p { margin: 0; font-size: 12px; font-weight: 700; }
          .signature-space { height: 60px; }
          .authorized { font-weight: 800; border-top: 1.5px solid #000; padding-top: 5px; margin-top: 5px; }

          .acknowledgement { margin-top: 50px; border-top: 2px dashed #000; padding-top: 30px; page-break-inside: avoid; break-inside: avoid; }
          .ack-title { text-align: center; font-size: 18px; font-weight: 900; margin-bottom: 20px; color: #000; text-transform: uppercase; letter-spacing: 1px; }
          
          .ack-container { display: flex; flex-direction: column; gap: 20px; }
          .ack-top { text-align: center; }
          .ack-middle { display: flex; justify-content: space-between; align-items: flex-start; }
          .ack-bottom { display: flex; justify-content: flex-end; margin-top: 40px; }
          .seal-sign-box { border-top: 1px dotted #888; width: 180px; text-align: center; font-size: 11px; padding-top: 8px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Page 1 Header -->
          <div class="header">
            <h1>${shopName}</h1>
            <p>${shopAddress}</p>
            <p>TRICHY(DT)-621010</p>
            <p>7530023960, Ph. no.: 7530023960</p>
            <p>GSTIN: ${shopGstNumber || 'N/A'}, State: 33-Tamil Nadu</p>
          </div>
          <div style="border-top: 2px solid #000; width: 100%; margin: 10px 0;"></div>
          <div class="invoice-type">Tax Invoice</div>
          
          <div class="details-grid">
            <div class="details-box">
              <h3>Bill To</h3>
              <p class="val" style="font-size: 13px;">${customerName.toUpperCase()}</p>
              <p>${customerAddress || 'No Address Provided'}</p>
              <p>Contact No. : <span class="val">${customerMobile}</span></p>
              <p>GSTIN : <span class="val">${customerGstin || 'N/A'}</span></p>
              <p>State: <span class="val">${customerState || '33-Tamil Nadu'}</span></p>
            </div>
            <div class="details-box" style="text-align: right;">
              <h3>Invoice Details</h3>
              <p>Invoice No. : <span class="val">${billId}</span></p>
              <p>Date : <span class="val">${billDate}</span></p>
              <p>Time : <span class="val">${billTime}</span></p>
              <p>Place of supply: <span class="val">${placeOfSupply}</span></p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="text-align: left; width: 35%">Item name</th>
                <th style="width: 12%">HSN/ SAC</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 8%">Unit</th>
                <th style="width: 10%">Price/Unit</th>
                <th style="width: 10%">GST</th>
                <th style="width: 12%">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${taxInvoiceItemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-right: 20px;">Total</td>
                <td style="text-align: center;">${totalQty}</td>
                <td colspan="2"></td>
                <td style="text-align: right;">₹ ${totalTaxAmount.toFixed(2)}</td>
                <td style="text-align: right;">₹ ${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer-grid">
            <div class="left-col">
              <div class="tax-info">
                <div class="tax-header">Tax Details</div>
                <div class="tax-row">
                  <span>SGST @ ${(gstPercentage / 2).toFixed(1)}% on ₹ ${displayBaseOfNet.toFixed(2)}</span>
                  <span class="val">₹ ${displaySgst.toFixed(2)}</span>
                </div>
                <div class="tax-row">
                  <span>CGST @ ${(gstPercentage / 2).toFixed(1)}% on ₹ ${displayBaseOfNet.toFixed(2)}</span>
                  <span class="val">₹ ${displayCgst.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="words-section">
                <div class="words-label">Invoice Amount in Words</div>
                <div class="words-content">${invoiceWords} Rupees Only</div>
              </div>
              
              <div class="details-box" style="margin-top: 10px;">
                <p><strong>Payment mode:</strong> <span class="val">${billData.paymentMethod || 'Credit'}</span></p>
                <p><strong>Terms and Conditions:</strong></p>
                <p style="font-size: 10px; color: #666;">Thank you for your purchase with us. All items are subject to availability.</p>
              </div>
            </div>
            
            <div class="right-col">
              <div class="amounts-box">
                <div class="tax-header">Summary</div>
                <div class="amount-row">
                  <span>Sub Total</span>
                  <span class="val">₹ ${subtotal.toFixed(2)}</span>
                </div>
                ${discountAmount > 0 ? `
                <div class="amount-row">
                  <span>Discount</span>
                  <span class="val">- ₹ ${discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="amount-row grand-total">
                  <span>Total</span>
                  <span class="val">₹ ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                  <span>Received</span>
                  <span class="val">₹ ${amountPaid.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                  <span>Balance</span>
                  <span class="val">₹ ${balance.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <p>For : ${shopName.toUpperCase()}</p>
                  <div class="signature-space"></div>
                  <div class="authorized">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Acknowledgement Section -->
          <div class="acknowledgement">
            <!-- Repeated Header for Acknowledgement -->
            <div class="header">
              <h1>${shopName}</h1>
              <p>${shopAddress}</p>
              <p>TRICHY(DT)-621010</p>
              <p>7530023960, Ph. no.: 7530023960</p>
              <p>GSTIN: ${shopGstNumber || 'N/A'}, State: 33-Tamil Nadu</p>
            </div>
            <div style="border-top: 2px solid #000; width: 100%; margin: 10px 0;"></div>
            <div class="ack-title">Acknowledgement</div>
            
            <div class="ack-container">
              <div class="ack-top">
                <h2 style="margin: 0; color: #4472c4;">${shopName.toUpperCase()}</h2>
              </div>
              
              <div class="ack-middle">
                <div class="details-box">
                  <h3>Invoice To</h3>
                  <p class="val" style="font-size: 13px;">${customerName.toUpperCase()}</p>
                  <p>${customerAddress || 'No Address Provided'}</p>
                  <p>Contact No. : <span class="val">${customerMobile}</span></p>
                </div>
                <div class="details-box" style="text-align: right;">
                  <h3>Invoice Details</h3>
                  <p>Invoice No. : <span class="val">${billId}</span></p>
                  <p>Invoice Date : <span class="val">${billDate}</span></p>
                  <p>Invoice Amount : <span class="val">₹ ${totalAmount.toFixed(2)}</span></p>
                </div>
              </div>
              
              <div class="ack-bottom">
                <div class="seal-sign-box">Receiver's Seal & Sign</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    console.error('Unknown formatType:', formatType);
    alert('Unable to generate PDF: Unknown format type');
    return;
  }

  if (shouldPrint) {
    // Use iframe for printing both POS and Tax formats to bypass direct download
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = formatType === 'pos' ? '58mm' : '210mm';
    iframe.style.height = 'auto';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1';
    iframe.srcdoc = htmlContent;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      // Small delay to ensure content is fully rendered in the iframe
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  } else {
    // For download
    html2pdf().from(htmlContent).set(pdfOptions).save();
  }
};

// Helper function to convert number to words (Indian numbering system)
const numberToWords = (num) => {
  const amount = Math.floor(num);
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const tens = Math.floor(n / 10);
    const units = n % 10;
    return b[tens] + a[units];
  };

  const convert = (n) => {
    if (n === 0) return '';
    let res = '';
    if (n >= 10000000) {
      res += convert(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      res += convert(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      res += convert(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      res += convert(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (res !== '') res += 'and ';
      res += inWords(n);
    }
    return res;
  };

  if (amount === 0) return 'Zero';
  return convert(amount).trim();
};
