import html2pdf from 'html2pdf.js';

export const generateProfitLossReportPdf = (reportData, startDate, endDate) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const totalShops = reportData?.shopDetails?.length || 0;
  const profitableShops = reportData?.shopDetails?.filter(shop => shop.netProfit > 0).length || 0;
  const lossMakingShops = reportData?.shopDetails?.filter(shop => shop.netProfit < 0).length || 0;
  
  // Generate revenue breakdown rows
  const revenueRows = reportData?.shopDetails?.map(shop => {
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${shop.shopName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.revenueBreakdown?.customerSales?.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.revenueBreakdown?.invoiceSales?.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">₹${shop.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">${reportData.overallTotals.totalRevenue > 0 ? ((shop.totalRevenue / reportData.overallTotals.totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
      </tr>
    `;
  }).join('') || '';
  
  // Generate expense breakdown rows
  const expenseRows = reportData?.shopDetails?.map(shop => {
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${shop.shopName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.directCosts?.productCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.directCosts?.materialCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.indirectCosts?.transportCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">₹${shop.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      </tr>
    `;
  }).join('') || '';
  
  // Generate profit analysis rows
  const profitRows = reportData?.shopDetails?.map(shop => {
    const profitClass = shop.netProfit > 0 ? 'color: green;' : shop.netProfit < 0 ? 'color: red;' : 'color: #666;';
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${shop.shopName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${shop.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${shop.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px; ${profitClass}">₹${shop.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold; ${profitClass}">₹${shop.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px; ${profitClass}">${shop.profitMargin.toFixed(2)}%</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
            shop.netProfit > 0 ? 'background-color: #dcfce7; color: #166534;' : 'background-color: #fee2e2; color: #991b1b;'
          }">
            ${shop.netProfit > 0 ? 'Profitable' : 'Loss'}
          </span>
        </td>
      </tr>
    `;
  }).join('') || '';
  
  // Generate summary for total row
  const totalRevenue = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.revenueBreakdown?.customerSales?.amount || 0), 0
  ) || 0;
  
  const totalInvoiceSales = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.revenueBreakdown?.invoiceSales?.amount || 0), 0
  ) || 0;
  
  const totalProductCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.directCosts?.productCosts || 0), 0
  ) || 0;
  
  const totalManufacturingCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.directCosts?.manufacturingCosts || 0), 0
  ) || 0;
  
  const totalMaterialCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.directCosts?.materialCosts || 0), 0
  ) || 0;
  
  const totalSalaryCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.indirectCosts?.salaryCosts || 0), 0
  ) || 0;
  
  const totalTransportCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.indirectCosts?.transportCosts || 0), 0
  ) || 0;
  
  const totalUtilityCosts = reportData?.shopDetails?.reduce((sum, shop) => 
    sum + (shop.expenseBreakdown?.indirectCosts?.utilityCosts || 0), 0
  ) || 0;

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
        <h2 style="color: #333; margin: 0; font-size: 28px;">CONSOLIDATED PROFIT & LOSS REPORT</h2>
        <p style="color: #666; font-size: 18px; margin: 15px 0;">
          Period: ${startDate} to ${endDate}
        </p>
      </div>
      
      <!-- Executive Summary -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Executive Summary</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Revenue</p>
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0 0 0;">₹${reportData?.overallTotals?.totalRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Expenses</p>
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0 0 0;">₹${reportData?.overallTotals?.totalExpenses?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Gross Profit</p>
            <p style="font-size: 24px; font-weight: bold; color: ${reportData?.overallTotals?.grossProfit > 0 ? '#16a34a' : reportData?.overallTotals?.grossProfit < 0 ? '#dc2626' : '#666'}; margin: 10px 0 0 0;">₹${reportData?.overallTotals?.grossProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Net Profit/Loss</p>
            <p style="font-size: 24px; font-weight: bold; color: ${reportData?.overallTotals?.netProfit > 0 ? '#16a34a' : reportData?.overallTotals?.netProfit < 0 ? '#dc2626' : '#666'}; margin: 10px 0 0 0;">₹${reportData?.overallTotals?.netProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</p>
          </div>
        </div>
        <div style="margin-top: 15px; text-align: center;">
          <p style="font-size: 16px; color: #666; margin: 5px 0;">${profitableShops} shops profitable, ${lossMakingShops} shops in loss</p>
        </div>
      </div>
      
      <!-- Revenue Breakdown -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Revenue Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Shop</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Customer Sales</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Invoice Sales</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total Revenue</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${revenueRows}
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 16px;">TOTAL</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalInvoiceSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.totalRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Expense Breakdown -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Expense Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Shop</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Product Costs</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Manufacturing</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Materials</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Salaries</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Transport</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Utilities</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Total Expenses</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRows}
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 16px;">TOTAL</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalProductCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalManufacturingCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalMaterialCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalSalaryCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalTransportCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${totalUtilityCosts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.totalExpenses?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Profit Analysis -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Profit Analysis</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Shop</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Revenue</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Expenses</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Gross Profit</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Net Profit</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Profit Margin</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${profitRows}
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 16px;">TOTAL</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.totalRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.totalExpenses?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.grossProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">₹${reportData?.overallTotals?.netProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">${reportData?.overallTotals?.totalRevenue > 0 ? ((reportData.overallTotals.netProfit / reportData.overallTotals.totalRevenue) * 100).toFixed(2) : '0.00'}%</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 16px;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                  reportData?.overallTotals?.netProfit > 0 ? 'background-color: #dcfce7; color: #166534;' : 'background-color: #fee2e2; color: #991b1b;'
                }">
                  ${reportData?.overallTotals?.netProfit > 0 ? 'Profitable' : 'Loss'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Profit & Loss Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `profit_loss_report_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};