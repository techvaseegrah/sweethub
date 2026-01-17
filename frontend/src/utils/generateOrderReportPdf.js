import html2pdf from 'html2pdf.js';

export const generateOrderReportPdf = (order, shopName) => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  // Format order date with time
  const orderDate = new Date(order.orderDate);
  const formattedOrderDate = orderDate.toLocaleDateString('en-IN');
  const formattedOrderTime = orderDate.toLocaleTimeString('en-IN', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Generate order items table rows
  const orderItems = order.items?.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px;">${item.productName}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${item.unit}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${item.quantity} ${item.unit}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">₹${(parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)).toFixed(2)}</td>
    </tr>
  `).join('') || '';

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
        <h2 style="color: #333; margin: 0; font-size: 28px;">ORDER DETAILS REPORT</h2>
        <p style="color: #666; font-size: 18px; margin: 15px 0;">
          Order ID: ${order.orderId}
        </p>
      </div>
      
      <!-- Order Information -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Order Information</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <div>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Order ID:</strong> ${order.orderId}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Shop Name:</strong> ${shopName}</p>
          </div>
          <div>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Order Date:</strong> ${formattedOrderDate}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Order Time:</strong> ${formattedOrderTime}</p>
          </div>
          <div>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Status:</strong> 
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; ${
                order.status === 'Pending' ? 'background-color: #fef3c7; color: #92400e;' :
                order.status === 'Processed' ? 'background-color: #dbeafe; color: #1e40af;' :
                order.status === 'Invoiced' ? 'background-color: #dcfce7; color: #166534;' :
                'background-color: #f3f4f6; color: #374151;'
              }">
                ${order.status}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Product Name</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Unit</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Quantity</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Unit Price</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems}
          </tbody>
        </table>
      </div>
      
      <!-- Order Summary -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Order Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #666;">Subtotal</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #333;">₹${parseFloat(order.subtotal || 0).toFixed(2)}</p>
          </div>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #666;">Tax</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #333;">₹${parseFloat(order.tax || 0).toFixed(2)}</p>
          </div>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #666;">Grand Total</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #e53e3e;">₹${parseFloat(order.grandTotal || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString('en-IN', { hour12: true })}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Order Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `order_${order.orderId}_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};