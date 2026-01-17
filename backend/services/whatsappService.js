const axios = require('axios');

const sendWhatsAppBill = async (billData, senderName) => {
  try {
    // 1. Check for required credentials
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      console.warn('WhatsApp credentials missing in .env');
      return;
    }

    const {
      customerMobileNumber,
      customerName,
      totalAmount,
      paymentMethod,
      _id,
      billDate,
      billType
    } = billData;

    // Check if this is a reference bill - don't send WhatsApp for reference bills
    if (billType === 'REFERENCE') {
      console.log('Reference bill detected, skipping WhatsApp message');
      return;
    }

    // 2. Check if customer mobile number exists and is valid
    if (!customerMobileNumber || customerMobileNumber.toString().trim() === '') {
      console.log('Customer mobile number is missing, skipping WhatsApp message');
      return;
    }

    // 3. Format Phone Number (Meta requires country code without +)
    // Example: "+91 98765 43210" -> "919876543210"
    let formattedNumber = customerMobileNumber.toString().replace(/\D/g, ''); // Remove non-digits
    
    // Auto-fix Indian numbers if they are 10 digits
    if (formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }
    // Remove leading 0 if present
    if (formattedNumber.startsWith('0')) {
        formattedNumber = '91' + formattedNumber.slice(1);
    }

    // 4. Format Date
    const dateObj = new Date(billDate);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    // 5. Short Bill ID
    const shortBillId = _id.toString().slice(-6).toUpperCase();

    // 6. Handle customer name - use a default if not provided
    const displayCustomerName = customerName && customerName.trim() !== '' ? customerName : 'Customer';

    // 7. Send Request
    const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'template',
      template: {
        name: 'invoice_summary', // Must match Meta Template Name
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: displayCustomerName },                 // {{1}} Customer Name
              { type: 'text', text: senderName },                   // {{2}} Shop/Factory Name
              { type: 'text', text: shortBillId },                  // {{3}} Bill ID
              { type: 'text', text: totalAmount.toFixed(2) },       // {{4}} Amount
              { type: 'text', text: formattedDate },                // {{5}} Date
              { type: 'text', text: paymentMethod }                 // {{6}} Payment Method
            ]
          }
        ]
      }
    };

    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(url, payload, config);
    console.log(`WhatsApp sent to ${formattedNumber} (ID: ${response.data.messages[0].id})`);
    return response.data;

  } catch (error) {
    console.error('WhatsApp Send Error:', error.response ? error.response.data : error.message);
    return null; // Don't throw, just log
  }
};

module.exports = { sendWhatsAppBill };