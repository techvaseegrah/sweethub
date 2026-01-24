import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { LuX, LuFileText, LuCheckCircle, LuPackage } from 'react-icons/lu';

function ViewOrderDetails({ order, onClose, onInvoiceCreated }) {
  const [adminQuantities, setAdminQuantities] = useState({});
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch shops and product details
    const fetchData = async () => {
      try {
        // Fetch shops to get shop name
        const shopsResponse = await axios.get('/admin/shops');
        setShops(shopsResponse.data);

        // First, get all products to build a lookup map
        const allProductsResponse = await axios.get('/admin/products?showAdmin=true');
        const allProducts = allProductsResponse.data;
        
        // Build a lookup map by product name and SKU for fallback matching
        const productLookupByName = {};
        const productLookupBySku = {};
        
        allProducts.forEach(product => {
          productLookupByName[product.name.toLowerCase()] = product;
          productLookupBySku[product.sku.toLowerCase()] = product;
        });

        // Fetch product details to ensure we have correct pricing
        // First check if products are already in the master list by name/SKU to avoid unnecessary 404s
        const uniqueProductIds = [...new Set(order.items.map(item => item.product))];
        const productsMap = {};
        
        // Check if any order items can be matched directly from the master product list
        for (const item of order.items) {
          const matchedProductByName = productLookupByName[item.productName?.toLowerCase()];
          if (matchedProductByName) {
            productsMap[item.product] = matchedProductByName;
            console.info(`Matched product by name: ${item.productName} -> ${matchedProductByName._id}`);
          }
        }
        
        // For products that weren't matched by name, try to fetch them individually
        const unmatchedProductIds = uniqueProductIds.filter(productId => !productsMap[productId]);
        if (unmatchedProductIds.length > 0) {
          const productPromises = unmatchedProductIds.map(productId => 
            axios.get(`/admin/products/${productId}`)
          );
          
          // Wait for all promises, but handle rejections gracefully
          const productResponses = await Promise.allSettled(productPromises);
          
          productResponses.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              // Success case - product was found
              const productId = unmatchedProductIds[index];
              productsMap[productId] = result.value.data;
            } else {
              // Failed case - product was not found, log the error
              const productId = unmatchedProductIds[index];
              console.warn(`Product ${productId} not found:`, result.reason);
              
              // For truly missing products, we can't do anything more
              // The UI will handle displaying appropriate error messages
            }
          });
        }
        
        setProducts(productsMap);
        
        // Initialize admin quantities with the shop quantities - with defensive checks
        const initialQuantities = {};
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item, index) => {
            initialQuantities[index] = item.quantity?.toString() || '0'; // Ensure it's a string
          });
        }
        setAdminQuantities(initialQuantities);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load order information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [order]);

  const getShopName = (shopId) => {
    if (!shopId) return 'Unknown Shop';
    const shop = shops.find(s => s._id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processed':
        return 'bg-blue-100 text-blue-800';
      case 'Invoiced':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateWithTime = (dateString) => {
    const date = new Date(dateString);
    
    // Format date as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time as hh:mm am/pm
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM/PM
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes} ${ampm}`
    };
  };

  const handleAdminQuantityChange = (index, value) => {
    // Ensure value is a string to prevent toString() errors
    const stringValue = value?.toString() || '';
    
    // Always update the state regardless of validation
    setAdminQuantities(prev => ({
      ...prev,
      [index]: stringValue
    }));
  };

  const handleCreateInvoice = async () => {
    try {
      console.log('Starting invoice creation process...');
      console.log('Order items:', order.items);
      console.log('Admin quantities:', adminQuantities);
      console.log('Products cache:', products);
      
      // Prepare items with admin quantities and correct pricing
      const itemsWithAdminQuantities = [];
      const invalidItems = []; // Track items with invalid prices
      
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        console.log(`Processing item ${i}:`, item);
        
        // Get the admin quantity value and convert to string for parsing
        const adminQtyValue = (adminQuantities && adminQuantities[i] !== undefined) 
          ? adminQuantities[i]?.toString() || item.quantity?.toString()
          : item.quantity?.toString();
          
        console.log(`Admin quantity value for item ${i}:`, adminQtyValue);
          
        // Parse the admin quantity to number
        const parsedAdminQty = adminQtyValue === '' || adminQtyValue === '.' || adminQtyValue === '0.' 
          ? 0 
          : parseFloat(adminQtyValue) || 0;

        console.log(`Parsed admin quantity for item ${i}:`, parsedAdminQty);

        const product = products[item.product];
        console.log(`Product lookup for ${item.product}:`, product);

        // Find the correct price for the specific unit
        const priceForUnit = product?.prices?.find(price => price.unit === item.unit);
        console.log(`Price for unit ${item.unit}:`, priceForUnit);

        // Determine the final unit price to use
        // If the original order has an invalid price (0 or less), use the current catalog price if available
        let finalUnitPrice = item.unitPrice || 0;
        
        if ((!item.unitPrice || item.unitPrice <= 0) && priceForUnit) {
          // Use the current catalog price if original was invalid
          finalUnitPrice = priceForUnit.sellingPrice;
          console.log(`Using catalog price for item ${i}:`, finalUnitPrice);
        } else if (!priceForUnit && (!item.unitPrice || item.unitPrice <= 0)) {
          // If neither original nor current price is valid, mark as invalid
          console.log(`No valid price found for item ${i}`);
          invalidItems.push({
            productName: item.productName,
            productId: item.product,
            originalPrice: item.unitPrice
          });
          continue; // Skip this item
        } else if (priceForUnit && (!item.unitPrice || item.unitPrice <= 0)) {
          // If we have current price but original was invalid, use current price
          finalUnitPrice = priceForUnit.sellingPrice;
          console.log(`Using fallback catalog price for item ${i}:`, finalUnitPrice);
        } else {
          console.log(`Using original price for item ${i}:`, finalUnitPrice);
        }

        // Use the matched product ID instead of the original order product ID if product was matched
        const finalProductId = product?._id || item.product;
        
        itemsWithAdminQuantities.push({
          ...item,
          product: finalProductId, // Use the correct product ID from the catalog
          adminQuantity: parsedAdminQty,
          unitPrice: finalUnitPrice
        });
        
        console.log(`Final item data for ${i}:`, {
          ...item,
          adminQuantity: parsedAdminQty,
          unitPrice: finalUnitPrice
        });
      }

      console.log('Items with admin quantities:', itemsWithAdminQuantities);
      console.log('Invalid items:', invalidItems);

      // Filter out items with zero admin quantity
      const filteredItems = itemsWithAdminQuantities.filter(item => item.adminQuantity > 0);
      console.log('Filtered items (quantity > 0):', filteredItems);

      // Show warning if there were invalid items but continue if there are valid items
      if (invalidItems.length > 0) {
        const invalidNames = invalidItems.map(item => item.productName).join(', ');
        console.warn(`Skipping items with invalid prices: ${invalidNames}`);
      }

      // Validate that at least one item has a positive quantity and valid price
      if (filteredItems.length === 0) {
        if (invalidItems.length > 0) {
          setError('No valid items to invoice. All items have invalid prices. Please contact support to resolve product pricing issues.');
        } else {
          setError('No items with positive quantities to invoice. Please enter quantities greater than 0.');
        }
        return;
      }

      // Create invoice with adjusted quantities
      const payload = {
        shopId: order.shop._id,
        items: filteredItems.map(item => ({
          productId: item.product,
          quantity: item.adminQuantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
        })),
        tax: parseFloat(order.tax) || 0,
        orderId: order._id // Link to the original order
      };

      console.log('Invoice payload:', payload);

      const response = await axios.post('/admin/invoices', payload);
      console.log('Invoice creation response:', response.data);
      
      try {
        // Update order status to 'Invoiced'
        await axios.put('/admin/orders/update-status', {
          orderId: order._id,
          status: 'Invoiced',
          invoiceId: response.data.invoice._id
        });
        console.log('Order status updated successfully');
      } catch (statusError) {
        // If order status update fails, it's OK - the invoice was still created
        console.warn('Failed to update order status:', statusError);
      }

      setSuccess(`Invoice created successfully! Skipped ${invalidItems.length} item(s) with invalid prices.`);
      setTimeout(() => {
        onInvoiceCreated && onInvoiceCreated();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Full error details:', err);
      setError(err.response?.data?.message || 'Failed to create invoice');
      console.error('Error creating invoice:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="ml-3 text-red-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">Direct Invoice</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <LuX size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Order ID</p>
            <p className="font-semibold text-gray-800">{order.orderId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Shop</p>
            <p className="font-semibold text-gray-800">{getShopName(order.shop?._id)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Order Date</p>
            <div className="font-semibold text-gray-800">
              <div>{formatDateWithTime(order.orderDate).date}</div>
              <div className="text-sm text-gray-500">{formatDateWithTime(order.orderDate).time}</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Order Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Req Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Sended Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items?.map && order.items.map((item, index) => {
                  // Use the original unit price from the order item as the primary source
                  // This ensures that even if the product doesn't exist, we still show the original price
                  let unitPrice = item.unitPrice || 0;
                  
                  // Only update the price if we successfully fetched the product and found the matching unit
                  const product = products[item.product];
                  if (product && product.prices) {
                    const priceForUnit = product.prices.find(price => price.unit === item.unit);
                    if (priceForUnit) {
                      unitPrice = priceForUnit.sellingPrice;
                    }
                  }
                  
                  // Calculate the admin quantity to use for the calculation - with defensive checks
                  const adminQtyValue = (adminQuantities && adminQuantities[index] !== undefined) 
                    ? adminQuantities[index]?.toString() || item.quantity?.toString()
                    : item.quantity?.toString();
                  
                  // Parse the quantity for calculations, treating empty strings as 0
                  const calculatedQty = adminQtyValue === '' || adminQtyValue === '.' || adminQtyValue === '0.' 
                    ? 0 
                    : parseFloat(adminQtyValue) || 0;
                  
                  return (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productName}
                      {!products[item.product] && item.unitPrice <= 0 && (
                        <div className="text-xs text-red-600">⚠️ Price issue - contact admin</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-semibold">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <input
                        type="text"
                        value={adminQuantities[index] !== undefined ? adminQuantities[index] : item.quantity?.toString()}
                        onChange={(e) => handleAdminQuantityChange(index, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₹{unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(calculatedQty * unitPrice).toFixed(2)}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-1/2">
            <h4 className="text-lg font-semibold mb-3">Admin Instructions</h4>
            <p className="text-sm text-gray-600">
              Adjust the "Admin Qty" column to specify the quantities you want to send to the shop. 
              You can reduce or increase quantities as needed. Items with zero quantity will not be included in the invoice.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                ₹{
                  order.items?.reduce((sum, item, index) => {
                    const adminQtyValue = (adminQuantities && adminQuantities[index] !== undefined) 
                      ? adminQuantities[index]?.toString() || item.quantity?.toString()
                      : item.quantity?.toString();
                    const adminQty = adminQtyValue === '' || adminQtyValue === '.' || adminQtyValue === '0.' 
                      ? 0 
                      : parseFloat(adminQtyValue) || 0;
                      
                    // Get the correct price for this unit from the fetched product
                    const product = products[item.product];
                    let unitPrice = item.unitPrice || 0; // fallback to original price or 0
                    
                    if (product && product.prices) {
                      const priceForUnit = product.prices.find(price => price.unit === item.unit);
                      if (priceForUnit) {
                        unitPrice = priceForUnit.sellingPrice;
                      }
                    }
                    return sum + (adminQty * unitPrice);
                  }, 0).toFixed(2)
                }
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tax:</span>
              <span className="font-semibold">₹{(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-xl font-bold bg-gray-100 px-4 rounded-md mt-2">
              <span>Grand Total:</span>
              <span>
                ₹{
                  (order.items?.reduce((sum, item, index) => {
                    const adminQtyValue = (adminQuantities && adminQuantities[index] !== undefined) 
                      ? adminQuantities[index]?.toString() || item.quantity?.toString()
                      : item.quantity?.toString();
                    const adminQty = adminQtyValue === '' || adminQtyValue === '.' || adminQtyValue === '0.' 
                      ? 0 
                      : parseFloat(adminQtyValue) || 0;
                      
                    // Get the correct price for this unit from the fetched product
                    const product = products[item.product];
                    let unitPrice = item.unitPrice || 0; // fallback to original price or 0
                    
                    if (product && product.prices) {
                      const priceForUnit = product.prices.find(price => price.unit === item.unit);
                      if (priceForUnit) {
                        unitPrice = priceForUnit.sellingPrice;
                      }
                    }
                    return sum + (adminQty * unitPrice);
                  }, 0) + (order.tax || 0)).toFixed(2)
                }
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {error && (
            <div className="text-red-600 text-sm self-center mr-auto">{error}</div>
          )}
          {success && (
            <div className="text-green-600 text-sm self-center mr-auto">{success}</div>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateInvoice}
            disabled={order.status !== 'Pending'}
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              order.status !== 'Pending' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title={order.status !== 'Pending' ? 'Cannot create invoice for non-pending orders' : 'Create Invoice'}
          >
            <LuFileText className="mr-2" />
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewOrderDetails;