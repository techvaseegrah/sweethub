import html2pdf from 'html2pdf.js';

export const generateReturnProductsReportPdf = (returnProducts, filters = {}) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const totalReturns = returnProducts.length;
  const totalQuantity = returnProducts.reduce((sum, item) => sum + (item.quantityReturned || 0), 0);
  
  // Group by reason for return
  const returnsByReason = {};
  returnProducts.forEach(item => {
    const reason = item.reasonForReturn || 'N/A';
    if (!returnsByReason[reason]) {
      returnsByReason[reason] = {
        count: 0,
        totalQuantity: 0
      };
    }
    returnsByReason[reason].count++;
    returnsByReason[reason].totalQuantity += item.quantityReturned || 0;
  });
  
  // Generate reason summary rows
  const reasonSummaryRows = Object.keys(returnsByReason).map(reason => {
    const data = returnsByReason[reason];
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${reason}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${data.count}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">${data.totalQuantity}</td>
      </tr>
    `;
  }).join('');
  
  // Generate detailed return records
  const returnRecords = returnProducts.map(item => {
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.returnId || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.productName || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${item.quantityReturned || 0}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.reasonForReturn || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.source || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.dateOfReturn ? new Date(item.dateOfReturn).toLocaleDateString() : 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${item.remarks || '-'}</td>
      </tr>
    `;
  }).join('');
  
  // Generate filter information
  const filterInfo = [];
  if (filters.date) filterInfo.push(`Date: ${filters.date}`);
  if (filters.reason) filterInfo.push(`Reason: ${filters.reason}`);

  const filterText = filterInfo.length > 0 ? 
    `<p style="margin: 8px 0; font-size: 16px;"><strong>Filters Applied:</strong> ${filterInfo.join(', ')}</p>` : 
    '';

  // Generate the complete HTML for the PDF
  const reportHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px;">
        <h1 style="color: #333; margin: 0; font-size: 32px;">The Sweet Hub</h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 5px 0;">156, Dubai Main Road, Thanjavur, Tamil Nadu - 613006</p>
        <p style="color: #666; font-size: 16px; margin: 5px 0;">Phone: 7339200636</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; margin: 0; font-size: 28px;">RETURN PRODUCTS REPORT</h2>
        <p style="color: #666; font-size: 18px; margin: 15px 0;">
          Generated on ${currentDate}
        </p>
        ${filterText}
      </div>
      
      <!-- Summary -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Report Summary</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Returns</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalReturns}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Quantity</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalQuantity}</p>
          </div>
        </div>
      </div>
      
      <!-- Return Reasons Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Returns by Reason</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Reason for Return</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Count</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${reasonSummaryRows}
          </tbody>
        </table>
      </div>
      
      <!-- Detailed Returns -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Return Records</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Return ID</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Product Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">Quantity</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Reason</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Source</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Date</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${returnRecords}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Return Products Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `return_products_report_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};