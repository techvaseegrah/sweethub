import html2pdf from 'html2pdf.js';

export const generateStockReportPdf = (products, filters = {}) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (product.stockLevel || 0), 0);
  const totalStockValue = products.reduce((sum, product) => {
    const netPrice = product.prices && product.prices.length > 0 ? product.prices[0].netPrice || 0 : 0;
    return sum + ((product.stockLevel || 0) * netPrice);
  }, 0);
  
  // Count products with low stock
  const lowStockProducts = products.filter(product => 
    (product.stockLevel || 0) <= (product.stockAlertThreshold || 0)
  ).length;
  
  // Generate product summary rows
  const productRows = products.map(product => {
    const netPrice = product.prices && product.prices.length > 0 ? product.prices[0].netPrice || 0 : 0;
    const unit = product.prices && product.prices.length > 0 ? product.prices[0].unit || 'N/A' : 'N/A';
    const stockValue = (product.stockLevel || 0) * netPrice;
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${product.name || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: right;">₹${netPrice.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: center;">${unit}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: right;">${product.stockLevel || 0}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: right;">₹${stockValue.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: right;">${product.stockAlertThreshold || 0}</td>
      </tr>
    `;
  }).join('');

  // Generate filter information
  const filterInfo = [];
  if (filters.shop) filterInfo.push(`Shop: ${filters.shop}`);

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
        <h2 style="color: #333; margin: 0; font-size: 28px;">STOCK REPORT</h2>
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
            <p style="font-size: 16px; color: #666; margin: 0;">Total Products</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalProducts}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Stock</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalStock}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Value</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">₹${totalStockValue.toFixed(2)}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Low Stock Items</p>
            <p style="font-size: 28px; font-weight: bold; color: ${lowStockProducts > 0 ? '#dc2626' : '#16a34a'}; margin: 10px 0 0 0;">${lowStockProducts}</p>
          </div>
        </div>
      </div>
      
      <!-- Detailed Stock -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Stock Information</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Product Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Net Price</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">Unit</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Stock Level</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Stock Value</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Alert Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Stock Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `stock_report_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};