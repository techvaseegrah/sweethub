import React from 'react';
import ProductHistory from './ProductHistory';

function ProductHistoryPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product History</h1>
        <p className="text-gray-600">View the complete history of all product changes</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <ProductHistory closeModal={() => {}} />
      </div>
    </div>
  );
}

export default ProductHistoryPage;