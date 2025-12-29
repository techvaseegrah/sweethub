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
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #ddd;">${item.productName || item.product?.name || item.name || 'Item'}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">₹${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">₹${(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  // Generate the complete HTML for the PDF
  const billHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <!-- Header with Logo and Company Info -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <div>
          <img src="${window.location.origin}/sweethub-logo.png" alt="The Sweet Hub Logo" style="max-height: 60px; width: auto;">
        </div>
        <div style="text-align: right;">
          <h1 style="color: #333; margin: 0; font-size: 24px;">${shopName}</h1>
          <p style="color: #666; font-size: 12px; margin: 5px 0;">${shopLocation}</p>
          ${shopGstNumber ? `<p style="color: #666; font-size: 12px; margin: 5px 0;">GSTIN: ${shopGstNumber}</p>` : ''}
          ${shopFssaiNumber ? `<p style="color: #666; font-size: 12px; margin: 5px 0;">FSSAI: ${shopFssaiNumber}</p>` : ''}
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Phone: ${shopPhone}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0; font-size: 20px;">BILL</h2>
      </div>
      
      <!-- Compressed FROM and TO Information -->
      ${(billData.fromInfo && Object.values(billData.fromInfo).some(val => val)) || (billData.toInfo && Object.values(billData.toInfo).some(val => val)) ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
        <!-- FROM Information -->
        ${billData.fromInfo ? `
        <div style="width: 48%;">
          <h4 style="color: #333; margin: 0 0 8px 0; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">FROM:</h4>
          <p style="font-weight: bold; margin: 3px 0;">${billData.fromInfo.name || ''}</p>
          <p style="margin: 3px 0;">${billData.fromInfo.address || ''}</p>
          ${billData.fromInfo.gstin ? `<p style="margin: 3px 0;">GSTIN: ${billData.fromInfo.gstin}</p>` : ''}
          ${billData.fromInfo.phone ? `<p style="margin: 3px 0;">Phone: ${billData.fromInfo.phone}</p>` : ''}
        </div>
        ` : ''}
        
        <!-- TO Information -->
        ${billData.toInfo ? `
        <div style="width: 48%;">
          <h4 style="color: #333; margin: 0 0 8px 0; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">TO:</h4>
          <p style="font-weight: bold; margin: 3px 0;">${billData.toInfo.name || ''}</p>
          <p style="margin: 3px 0;">${billData.toInfo.address || ''}</p>
          ${billData.toInfo.gstin ? `<p style="margin: 3px 0;">GSTIN: ${billData.toInfo.gstin}</p>` : ''}
          ${billData.toInfo.phone ? `<p style="margin: 3px 0;">Phone: ${billData.toInfo.phone}</p>` : ''}
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Bill Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 12px;">
        <div>
          <p><strong>Bill ID:</strong> ${billId}</p>
          <p><strong>Date:</strong> ${billDate}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Mobile:</strong> ${customerMobile}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 13px;">Item</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 13px;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">Price</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 13px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Subtotal</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${subtotal.toFixed(2)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}:
            </td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">-₹${discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Net Amount</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${(subtotal - discountAmount).toFixed(2)}</td>
          </tr>
          ${gstPercentage > 0 ? `
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">GST (${gstPercentage}%)</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${gstAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 13px;">Total Amount</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 13px;">₹${totalAmount.toFixed(2)}</td>
          </tr>
          ${amountPaid > 0 ? `
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Amount Paid</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${amountPaid.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${balance > 0 ? `
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Balance</td>
            <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${balance.toFixed(2)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      
      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px;">
        <div>
          <p><strong>Total Items:</strong> ${billData.items.length || 0}</p>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-style: italic; color: #777; font-size: 12px;">Thank you for your business!</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `bill_${billId}_${billDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  if (shouldPrint) {
    // Create a temporary iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
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