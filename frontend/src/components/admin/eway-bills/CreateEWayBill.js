import React, { useState, useContext } from 'react';
import { LuArrowLeft, LuPlus, LuCalendar, LuTruck } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useEWayBills } from '../../../context/EWayBillContext';

const CreateEWayBill = () => {
  const navigate = useNavigate();
  const { addEWayBill } = useEWayBills();
  
  const [formData, setFormData] = useState({
    // E-Way Bill Header
    ewbNumber: '',
    generatedBy: '',
    generatedDate: '',
    validFrom: '',
    validTo: '',
    supplyType: 'Outward',
    subType: 'Supply',
    documentType: 'Invoice',
    documentNumber: '',
    documentDate: '',
    
    // PART-A: Sender (From) Information
    senderGstin: '',
    senderLegalName: '',
    senderTradeName: '',
    senderAddress: '',
    senderPlace: '',
    senderPincode: '',
    senderState: '',
    senderStateCode: '',
    
    // PART-A: Receiver (To) Information
    receiverGstin: '',
    receiverLegalName: '',
    receiverTradeName: '',
    receiverAddress: '',
    receiverPlace: '',
    receiverPincode: '',
    receiverState: '',
    receiverStateCode: '',
    
    // PART-B: Transport Details
    transportMode: 'Road',
    approxDistance: '',
    transporterId: '',
    transporterName: '',
    transporterDocNumber: '',
    transporterDocDate: '',
    vehicleNumber: '',
    vehicleType: 'Regular',
    dispatchPlace: '',
    dispatchState: ''
  });

  const [goodsDetails, setGoodsDetails] = useState([
    {
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      taxableValue: '',
      cgstRate: '',
      sgstRate: '',
      igstRate: '',
      cgstAmount: '',
      sgstAmount: '',
      igstAmount: '',
      totalAmount: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoodsChange = (index, e) => {
    const { name, value } = e.target;
    const updatedGoods = [...goodsDetails];
    updatedGoods[index][name] = value;
    setGoodsDetails(updatedGoods);
  };

  const addGoodsRow = () => {
    setGoodsDetails(prev => [
      ...prev,
      {
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        taxableValue: '',
        cgstRate: '',
        sgstRate: '',
        igstRate: '',
        cgstAmount: '',
        sgstAmount: '',
        igstAmount: '',
        totalAmount: ''
      }
    ]);
  };

  const removeGoodsRow = (index) => {
    if (goodsDetails.length > 1) {
      const updatedGoods = [...goodsDetails];
      updatedGoods.splice(index, 1);
      setGoodsDetails(updatedGoods);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare the data to be saved
      const billData = {
        ...formData,
        goodsDetails,
        totalAmount: parseFloat(formData.totalInvoiceValue) || 0
      };
      
      // Save the E-Way bill using context
      addEWayBill(billData);
      
      // Success - navigate back to E-Way bills history
      navigate('/admin/eway-bills/history');
    } catch (err) {
      console.error('Error creating E-Way bill:', err);
      setError('Failed to create E-Way bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/eway-bills/history')}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md"
          disabled={loading}
        >
          <LuArrowLeft className="text-gray-600 text-xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Create E-Way Bill</h1>
          <p className="text-gray-600">Generate a new E-Way bill for transportation</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* E-Way Bill Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">E-Way Bill Details</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* E-Way Bill Header Section */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-4">E-Way Bill Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Way Bill Number</label>
                <input
                  type="text"
                  name="ewbNumber"
                  value={formData.ewbNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter E-Way Bill Number"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated By</label>
                <input
                  type="text"
                  name="generatedBy"
                  value={formData.generatedBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Generator Name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated Date</label>
                <input
                  type="date"
                  name="generatedDate"
                  value={formData.generatedDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                <input
                  type="date"
                  name="validTo"
                  value={formData.validTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supply Type</label>
                <select
                  name="supplyType"
                  value={formData.supplyType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Outward">Outward</option>
                  <option value="Inward">Inward</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Type</label>
                <select
                  name="subType"
                  value={formData.subType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Supply">Supply</option>
                  <option value="Export">Export</option>
                  <option value="Job Work">Job Work</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Bill">Bill</option>
                  <option value="Challan">Challan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                <input
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Document Number"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Date</label>
                <input
                  type="date"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* PART-A: Sender Information */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-4">PART-A: Sender (From) Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  name="senderGstin"
                  value={formData.senderGstin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter GSTIN"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  name="senderLegalName"
                  value={formData.senderLegalName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Legal Name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
                <input
                  type="text"
                  name="senderTradeName"
                  value={formData.senderTradeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Trade Name"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="senderAddress"
                  value={formData.senderAddress}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Address"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                <input
                  type="text"
                  name="senderPlace"
                  value={formData.senderPlace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Place"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="senderPincode"
                  value={formData.senderPincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Pincode"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="senderState"
                  value={formData.senderState}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter State"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <input
                  type="text"
                  name="senderStateCode"
                  value={formData.senderStateCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter State Code"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* PART-A: Receiver Information */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-4">PART-A: Receiver (To) Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  name="receiverGstin"
                  value={formData.receiverGstin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter GSTIN"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  name="receiverLegalName"
                  value={formData.receiverLegalName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Legal Name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
                <input
                  type="text"
                  name="receiverTradeName"
                  value={formData.receiverTradeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Trade Name"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="receiverAddress"
                  value={formData.receiverAddress}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Address"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                <input
                  type="text"
                  name="receiverPlace"
                  value={formData.receiverPlace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Place"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="receiverPincode"
                  value={formData.receiverPincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Pincode"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="receiverState"
                  value={formData.receiverState}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter State"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <input
                  type="text"
                  name="receiverStateCode"
                  value={formData.receiverStateCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter State Code"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* PART-A: Goods Details */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">PART-A: Goods Details</h3>
              <button
                type="button"
                onClick={addGoodsRow}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={loading}
              >
                <LuPlus className="text-sm" />
                <span>Add Row</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-xs">Product Name</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">HSN Code</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">Qty</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">Unit</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">Taxable Value</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">CGST Rate</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">SGST Rate</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">IGST Rate</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">CGST Amt</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">SGST Amt</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">IGST Amt</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">Total Amt</th>
                    <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {goodsDetails.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="productName"
                          value={item.productName}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Product"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="hsnCode"
                          value={item.hsnCode}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="HSN"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Qty"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="unit"
                          value={item.unit}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Unit"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="taxableValue"
                          value={item.taxableValue}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Value"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="cgstRate"
                          value={item.cgstRate}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Rate"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="sgstRate"
                          value={item.sgstRate}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Rate"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="igstRate"
                          value={item.igstRate}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Rate"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="cgstAmount"
                          value={item.cgstAmount}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Amt"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="sgstAmount"
                          value={item.sgstAmount}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Amt"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="igstAmount"
                          value={item.igstAmount}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Amt"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="text"
                          name="totalAmount"
                          value={item.totalAmount}
                          onChange={(e) => handleGoodsChange(index, e)}
                          className="w-full px-1 py-1 text-xs border-none focus:ring-0"
                          placeholder="Total"
                          disabled={loading}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {goodsDetails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGoodsRow(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            <LuPlus className="transform rotate-45 text-sm" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* PART-B: Transport Details */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-4">PART-B: Transport Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                <select
                  name="transportMode"
                  value={formData.transportMode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Road">Road</option>
                  <option value="Rail">Rail</option>
                  <option value="Air">Air</option>
                  <option value="Ship">Ship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approx Distance (KM)</label>
                <input
                  type="number"
                  name="approxDistance"
                  value={formData.approxDistance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Distance"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID</label>
                <input
                  type="text"
                  name="transporterId"
                  value={formData.transporterId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Transporter ID"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
                <input
                  type="text"
                  name="transporterName"
                  value={formData.transporterName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Transporter Name"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Document Number</label>
                <input
                  type="text"
                  name="transporterDocNumber"
                  value={formData.transporterDocNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Document Number"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Document Date</label>
                <input
                  type="date"
                  name="transporterDocDate"
                  value={formData.transporterDocDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Vehicle Number"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="Regular">Regular</option>
                  <option value="ODC">ODC</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place of Dispatch</label>
                <input
                  type="text"
                  name="dispatchPlace"
                  value={formData.dispatchPlace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Dispatch Place"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="dispatchState"
                  value={formData.dispatchState}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter State"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* Total Summary Section */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-4">Total Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Taxable Amount</label>
                <input
                  type="text"
                  name="totalTaxableAmount"
                  value={formData.totalTaxableAmount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total CGST</label>
                <input
                  type="text"
                  name="totalCgst"
                  value={formData.totalCgst || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total SGST</label>
                <input
                  type="text"
                  name="totalSgst"
                  value={formData.totalSgst || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total IGST</label>
                <input
                  type="text"
                  name="totalIgst"
                  value={formData.totalIgst || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Invoice Value</label>
                <input
                  type="text"
                  name="totalInvoiceValue"
                  value={formData.totalInvoiceValue || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Notes</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Validity depends on distance</li>
              <li>E-Way Bill needs to be carried during transportation</li>
            </ul>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/eway-bills/history')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <LuPlus className="text-lg" />
                  <span>Create E-Way Bill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEWayBill;