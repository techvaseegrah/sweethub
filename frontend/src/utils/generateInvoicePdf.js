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
  const shopPhone = invoiceData?.shop?.phone || '7339200636';
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
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.productName || item.product?.name || item.name || 'Item'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  // Generate the complete HTML for the PDF
  const invoiceHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <!-- FROM Information -->
      ${invoiceData.fromInfo ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">FROM (Sweet Production Factory)</h3>
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
          <p style="font-weight: bold; margin: 0;">${invoiceData.fromInfo.name || ''}</p>
          <p style="margin: 5px 0;">${invoiceData.fromInfo.address || ''}</p>
          ${invoiceData.fromInfo.gstin ? `<p style="margin: 5px 0;">GSTIN: ${invoiceData.fromInfo.gstin}</p>` : ''}
          ${invoiceData.fromInfo.state ? `<p style="margin: 5px 0;">State: ${invoiceData.fromInfo.state}</p>` : ''}
          ${invoiceData.fromInfo.stateCode ? `<p style="margin: 5px 0;">State Code: ${invoiceData.fromInfo.stateCode}</p>` : ''}
          ${invoiceData.fromInfo.phone ? `<p style="margin: 5px 0;">Phone: ${invoiceData.fromInfo.phone}</p>` : ''}
          ${invoiceData.fromInfo.email ? `<p style="margin: 5px 0;">Email: ${invoiceData.fromInfo.email}</p>` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- TO Information -->
      ${invoiceData.toInfo ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">TO (Receiving Branch / Shop)</h3>
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
          <p style="font-weight: bold; margin: 0;">${invoiceData.toInfo.name || ''}</p>
          <p style="margin: 5px 0;">${invoiceData.toInfo.address || ''}</p>
          ${invoiceData.toInfo.gstin ? `<p style="margin: 5px 0;">GSTIN: ${invoiceData.toInfo.gstin}</p>` : ''}
          ${invoiceData.toInfo.state ? `<p style="margin: 5px 0;">State: ${invoiceData.toInfo.state}</p>` : ''}
          ${invoiceData.toInfo.stateCode ? `<p style="margin: 5px 0;">State Code: ${invoiceData.toInfo.stateCode}</p>` : ''}
          ${invoiceData.toInfo.phone ? `<p style="margin: 5px 0;">Phone: ${invoiceData.toInfo.phone}</p>` : ''}
        </div>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">${shopName}</h2>
        <p style="color: #666; font-size: 14px;">${shopLocation}</p>
        ${shopPhone ? `<p style="color: #666; font-size: 14px;">Phone: ${shopPhone}</p>` : ''}
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <div>
          <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
          <p><strong>Date:</strong> ${issueDate}</p>
          ${adminName && adminName !== 'Admin' ? `<p><strong>From:</strong> ${adminName}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p><strong>Status:</strong> ${status}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Subtotal</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${subtotal.toFixed(2)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}:
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">-₹${discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Net Amount</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${(subtotal - discountAmount).toFixed(2)}</td>
          </tr>
          ${gstPercentage > 0 ? `
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">GST (${gstPercentage}%)</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${gstAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Grand Total</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div>
          <p><strong>Total Items:</strong> ${invoiceData.items.length || 0}</p>
        </div>
      </div>
      <p style="text-align: center; margin-top: 30px; font-style: italic; color: #777;">Thank you for your business!</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `invoice_${invoiceNumber}_${issueDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
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