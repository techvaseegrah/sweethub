import React from 'react';

const InvoiceTemplate = ({ invoice }) => {
  if (!invoice) {
    return <div className="text-center p-8">No invoice data to display.</div>;
  }

  // Dummy data for admin details - replace with actual data from context or API
  const adminDetails = {
    name: 'Sweet Hub Admin',
    address: '123 Candy Lane, Sweetville, 45678',
    contact: 'contact@sweethub.com',
    logo: '/sweethub-logo.png', // Path to your logo in the public folder
  };

  return (
    <div id="invoice-to-print" className="p-6 sm:p-10 bg-white text-gray-800">
      {/* Header Section */}
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center">
          <img src={adminDetails.logo} alt="Logo" className="h-16 w-16 mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{adminDetails.name}</h1>
            <p className="text-sm text-gray-500">{adminDetails.address}</p>
            <p className="text-sm text-gray-500">{adminDetails.contact}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold uppercase text-gray-400">Invoice</h2>
          <p className="font-semibold text-gray-700">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
        </div>
      </header>

      {/* Bill To Section */}
      <section className="mb-10">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
        <p className="text-lg font-bold text-gray-900">{invoice.shop.name}</p>
        <p className="text-gray-600">{invoice.shop.address || 'No address provided'}</p>
      </section>

      {/* Items Table */}
      <section className="mb-10">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="th-style">Product Name</th>
              <th className="th-style text-center">Qty</th>
              <th className="th-style text-right">Unit Price</th>
              <th className="th-style text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="td-style">
                  <p className="font-medium">{item.productName || 'N/A'}</p>
                  <p className="text-xs text-gray-500">SKU: {item.productSku || 'N/A'}</p>
                </td>
                <td className="td-style text-center">{item.quantity || 0}</td>
                <td className="td-style text-right">₹{(item.unitPrice || 0).toFixed(2)}</td>
                <td className="td-style text-right">₹{(item.totalPrice || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals Section */}
      <section className="flex justify-end mb-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">₹{(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Tax:</span>
            <span className="font-semibold">₹{(invoice.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 text-xl font-bold bg-gray-100 px-4 rounded-md">
            <span>Grand Total:</span>
            <span>₹{(invoice.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-2 font-semibold">Admin Signature</p>
        <div className="w-48 h-12 border-b-2 border-gray-400 mx-auto mt-4"></div>
      </footer>
    </div>
  );
};

// Reusable styles for this component
const style = document.createElement('style');
style.innerHTML = `
  .th-style { padding: 0.75rem; font-weight: 600; }
  .td-style { padding: 0.75rem; }
`;
document.head.appendChild(style);

export default InvoiceTemplate;