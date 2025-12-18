import html2pdf from 'html2pdf.js';

export const generateExpenseReportPdf = (expenses, dateFrom, dateTo, filters = {}) => {
  // Format dates
  const formattedDateFrom = dateFrom ? new Date(dateFrom).toLocaleDateString() : 'N/A';
  const formattedDateTo = dateTo ? new Date(dateTo).toLocaleDateString() : 'N/A';
  
  // Calculate totals
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = [];
    }
    expensesByCategory[category].push(expense);
  });
  
  // Generate category summaries
  const categorySummaries = Object.keys(expensesByCategory).map(category => {
    const categoryTotal = expensesByCategory[category].reduce((sum, expense) => sum + expense.amount, 0);
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${category}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${expensesByCategory[category].length}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${categoryTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  // Generate expense items table
  const expenseItems = expenses.map(expense => {
    const expenseDate = expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A';
    const shopName = expense.admin ? 'Admin' : (expense.shop?.name || 'N/A');
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${expenseDate}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${shopName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${expense.category || 'N/A'}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${expense.description || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${expense.paymentMode || 'N/A'}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${expense.amount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  // Generate filter information
  const filterInfo = [];
  if (filters.shop) filterInfo.push(`Shop: ${filters.shop}`);
  if (filters.category) filterInfo.push(`Category: ${filters.category}`);
  if (filters.paymentMode) filterInfo.push(`Payment Mode: ${filters.paymentMode}`);
  
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
        <h2 style="color: #333; margin: 0; font-size: 28px;">EXPENSE REPORT</h2>
        <p style="color: #666; font-size: 18px; margin: 15px 0;">
          Period: ${formattedDateFrom} to ${formattedDateTo}
        </p>
        ${filterText}
      </div>
      
      <!-- Summary -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Report Summary</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Expenses</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${expenses.length}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Amount</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">₹${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <!-- Category Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Expenses by Category</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Category</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Count</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${categorySummaries}
          </tbody>
        </table>
      </div>
      
      <!-- Detailed Expenses -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Expenses</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Date</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Shop</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Category</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Description</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Payment Mode</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Expense Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `expense_report_${formattedDateFrom.replace(/\//g, '-')}_to_${formattedDateTo.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};