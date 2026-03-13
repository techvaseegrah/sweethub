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
  const billId = billData?.billId || (billData?._id ? billData._id.slice(-8) : 'N/A');
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
        <td style="padding: 2px 3px; text-align: center;">${index + 1}</td>
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
                <td style="text-align: right; padding: 2px 3px;">₹${displayBaseOfNet.toFixed(2)}</td>
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
                  Discount:
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
      margin: [5, 5, 5, 5],
      filename: filenameSuffix,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 3,
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
      const itemGrossAmount = itemQty * (item.price || 0); // Price is assumed to be inclusive
      const itemBaseAmount = gstPercentage > 0 ? itemGrossAmount / (1 + gstPercentage / 100) : itemGrossAmount;
      const itemTaxAmount = itemGrossAmount - itemBaseAmount;
      const unitPrice = itemBaseAmount / (itemQty || 1);

      totalQty += itemQty;
      totalTaxAmount += itemTaxAmount;

      return `
        <tr style="text-align: center;">
          <td style="padding: 5px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 5px; border: 1px solid #ddd; text-align: left; font-weight: bold;">${(item.productName || 'Item').toUpperCase()}</td>
          <td style="padding: 5px; border: 1px solid #ddd;">${item.sku || '-'}</td>
          <td style="padding: 5px; border: 1px solid #ddd;">${itemQty}</td>
          <td style="padding: 5px; border: 1px solid #ddd;">${item.unit || ''}</td>
          <td style="padding: 5px; border: 1px solid #ddd; text-align: right;">₹ ${unitPrice.toFixed(2)}</td>
          <td style="padding: 5px; border: 1px solid #ddd; text-align: right;">₹ ${itemTaxAmount.toFixed(2)} (${gstPercentage.toFixed(0)}%)</td>
          <td style="padding: 5px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹ ${itemGrossAmount.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Tax Invoice HTML structure (Table-based layout for better PDF consistency)
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${billId}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; color: #000; line-height: 1.4; background: #fff; }
          .container { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm; background: #fff; }
          .header-company { text-align: center; margin-bottom: 2px; }
          .header-company h1 { font-size: 22px; font-weight: 800; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
          .header-company p { margin: 1px 0; font-size: 10px; color: #000; font-weight: 600; }
          .top-border { border-top: 2.5px solid #000; margin-top: 8px; margin-bottom: 8px; }
          .invoice-title { text-align: center; font-size: 14px; font-weight: 800; margin: 10px 0; color: #000; }
          
          /* Table-based grid for layout reliability */
          .layout-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: none; }
          .layout-table td { vertical-align: top; border: none; padding: 0; }
          
          .details-p { margin: 2px 0; font-size: 11px; }
          .details-strong { font-weight: 800; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ddd; }
          .items-table th { background-color: #4472c4; color: #fff; font-weight: 800; padding: 8px 5px; border: 1px solid #ddd; font-size: 10.5px; text-transform: capitalize; }
          .items-table td { border: 1px solid #ddd; padding: 5px; font-size: 10.5px; }
          .total-row { font-weight: 800; background-color: #fff; }
          .total-row td { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 5px; }

          .tax-table, .amounts-table { width: 100%; border-collapse: collapse; }
          .tax-table th, .amounts-table th { background-color: #4472c4; color: #fff; font-weight: 800; text-align: left; padding: 8px 10px; border: 1px solid #ddd; }
          .tax-table td, .amounts-table td { border: 1px solid #ddd; padding: 6px 10px; font-weight: 600; font-size: 10.5px; }
          
          .blue-bar { background-color: #4472c4; color: #fff; font-weight: 800; padding: 6px 10px; margin-top: 10px; font-size: 11px; }
          .bar-content { padding: 8px 10px; font-size: 10.5px; font-weight: 600; }
          
          .signature-section { margin-top: 60px; text-align: right; }
          .signature-section p { margin: 2px 0; font-weight: 700; font-size: 11px; }
          .authorized-signatory { margin-top: 60px; font-weight: 800; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-company">
            <h1>${shopName}</h1>
            <p>${shopAddress}</p>
            <p>TRICHY(DT)-621010</p>
            <p>7530023960, Ph. no.: 7530023960</p>
            <p>GSTIN: ${shopGstNumber}, State: 33-Tamil Nadu</p>
          </div>

          <div class="top-border"></div>
          <div class="invoice-title">Tax Invoice</div>

          <table class="layout-table">
            <tr>
              <td style="width: 60%;">
                <p class="details-p"><strong class="details-strong">Bill To</strong></p>
                <p style="font-weight: bold; font-size: 12px; margin-top: 5px;">${customerName.toUpperCase()}</p>
                <p class="details-p">${customerAddress || 'N/A'}</p>
                <p class="details-p">Contact No. : ${customerMobile}</p>
                <p class="details-p">GSTIN : ${customerGstin || 'N/A'}</p>
                <p class="details-p">State: ${customerState || '33-Tamil Nadu'}</p>
              </td>
              <td style="width: 40%; text-align: right;">
                <p class="details-p"><strong class="details-strong">Invoice Details</strong></p>
                <p style="margin-top: 5px;" class="details-p">Invoice No. : ${billId}</p>
                <p class="details-p">Date : ${billDate}</p>
                <p class="details-p">Time : ${billTime}</p>
                <p class="details-p">Place of supply: 33-Tamil Nadu</p>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="text-align: left;">Item name</th>
                <th style="width: 100px;">HSN/ SAC</th>
                <th style="width: 65px; text-align: center;">Qty</th>
                <th style="width: 55px; text-align: center;">Unit</th>
                <th style="width: 90px; text-align: right;">Price/ Unit</th>
                <th style="width: 110px; text-align: right;">GST</th>
                <th style="width: 100px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${taxInvoiceItemsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align: left; padding-left: 10px;">Total</td>
                <td></td>
                <td style="text-align: center;">${totalQty}</td>
                <td></td>
                <td></td>
                <td style="text-align: right;">₹ ${totalTaxAmount.toFixed(2)}</td>
                <td style="text-align: right;">₹ ${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <table class="layout-table" style="margin-top: 20px;">
            <tr>
              <td style="width: 62%; padding-right: 20px;">
                <table class="tax-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Tax type</th>
                      <th style="text-align: right;">Taxable amount</th>
                      <th style="text-align: center;">Rate</th>
                      <th style="text-align: right;">Tax amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>SGST</td>
                      <td style="text-align: right;">₹ ${displayBaseOfNet.toFixed(2)}</td>
                      <td style="text-align: center;">${(gstPercentage / 2).toFixed(1)}%</td>
                      <td style="text-align: right;">₹ ${displaySgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>CGST</td>
                      <td style="text-align: right;">₹ ${displayBaseOfNet.toFixed(2)}</td>
                      <td style="text-align: center;">${(gstPercentage / 2).toFixed(1)}%</td>
                      <td style="text-align: right;">₹ ${displayCgst.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="blue-bar">Invoice Amount In Words</div>
                <div class="bar-content">${numberToWords(totalAmount)} Only</div>

                <div class="blue-bar">Payment mode</div>
                <div class="bar-content">${billData.paymentMethod || 'Credit'}</div>

                <div class="blue-bar">Terms and Conditions</div>
                <div class="bar-content">Thank you for purchase with us</div>
              </td>
              <td style="width: 38%;">
                <table class="amounts-table">
                  <thead>
                    <tr>
                      <th colspan="2">Amounts</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sub Total</td>
                      <td style="text-align: right;">₹ ${totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Total</td>
                      <td style="text-align: right;">₹ ${totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Balance</td>
                      <td style="text-align: right;">₹ ${balance.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="signature-section">
                  <p>For : ${shopName.toUpperCase()}</p>
                  <div class="authorized-signatory">Authorized Signatory</div>
                </div>
              </td>
            </tr>
          </table>
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
