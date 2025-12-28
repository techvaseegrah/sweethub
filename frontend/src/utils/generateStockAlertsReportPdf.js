import html2pdf from 'html2pdf.js';

export const generateStockAlertsReportPdf = (products, categories, shops, filters = {}) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (product.stockLevel || 0), 0);
  
  // Group products by category if needed
  let productsByCategory = {};
  let filteredProducts = products;
  
  if (filters.category && filters.category !== 'All') {
    const selectedCategoryName = categories.find(cat => cat._id === filters.category)?.name || filters.category;
    filteredProducts = products.filter(product => 
      product.category?._id === filters.category
    );
    productsByCategory[selectedCategoryName] = filteredProducts;
  } else {
    // Group all products by their categories
    products.forEach(product => {
      const categoryName = product.category?.name || 'Uncategorized';
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = [];
      }
      productsByCategory[categoryName].push(product);
    });
  }

  // Calculate total alerts by shop if shop info is available
  let alertsByShop = {};
  if (shops && shops.length > 0) {
    shops.forEach(shop => {
      const shopAlerts = filteredProducts.filter(product => 
        product.shop && product.shop._id === shop._id
      );
      if (shopAlerts.length > 0) {
        alertsByShop[shop.name] = shopAlerts.length;
      }
    });
    
    // Also add admin alerts
    const adminAlerts = filteredProducts.filter(product => !product.shop || !product.shop._id);
    if (adminAlerts.length > 0) {
      alertsByShop['Admin'] = adminAlerts.length;
    }
  }

  // Generate category summaries
  const categorySummaries = Object.keys(productsByCategory).map(categoryName => {
    const categoryProducts = productsByCategory[categoryName];
    const categoryTotalStock = categoryProducts.reduce((sum, product) => sum + (product.stockLevel || 0), 0);
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${categoryName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${categoryProducts.length}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">${categoryTotalStock}</td>
      </tr>
    `;
  }).join('');

  // Generate shop summaries if shops data is available
  const shopSummaries = Object.keys(alertsByShop).length > 0 
    ? Object.keys(alertsByShop).map(shopName => {
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${shopName}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${alertsByShop[shopName]}</td>
          </tr>
        `;
      }).join('')
    : '';

  // Generate product items table
  const productItems = filteredProducts.map(product => {
    const categoryName = product.category?.name || 'Uncategorized';
    const shopName = product.shop ? product.shop.name : 'Admin';
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${product.name || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${categoryName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${shopName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">${product.stockLevel || 0}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">${product.stockAlertThreshold || 0}</td>
      </tr>
    `;
  }).join('');

  // Generate filter information
  const filterInfo = [];
  if (filters.shop) filterInfo.push(`Shop: ${filters.shop}`);
  if (filters.category && filters.category !== 'All') {
    const categoryName = categories.find(cat => cat._id === filters.category)?.name || filters.category;
    filterInfo.push(`Category: ${categoryName}`);
  }
  if (filters.searchTerm) filterInfo.push(`Search: ${filters.searchTerm}`);

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
        <h2 style="color: #333; margin: 0; font-size: 28px;">STOCK ALERTS REPORT</h2>
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
            <p style="font-size: 16px; color: #666; margin: 0;">Total Alert Products</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalProducts}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Stock</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalStock}</p>
          </div>
        </div>
      </div>
      
      ${Object.keys(productsByCategory).length > 0 ? `
      <!-- Category Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Products by Category</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Category</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Product Count</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total Stock</th>
            </tr>
          </thead>
          <tbody>
            ${categorySummaries}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${Object.keys(alertsByShop).length > 0 ? `
      <!-- Shop Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Alerts by Shop</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Shop</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Alert Count</th>
            </tr>
          </thead>
          <tbody>
            ${shopSummaries}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Detailed Products -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Alert Products</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Product Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Category</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Shop</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Stock Level</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Alert Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${productItems}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Stock Alert Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `stock_alerts_report_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};