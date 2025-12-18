import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuHistory } from 'react-icons/lu';

const ReturnProductsHistory = ({ refresh }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                // For admin, fetch all returns (no shopId filter)
                const response = await axios.get('/admin/warehouse/returns');
                // Filter out shop returns for admin view (only show admin-created returns)
                const adminReturns = response.data.filter(item => !item.shopId);
                setReturns(adminReturns);
            } catch (err) {
                setError('Failed to fetch return history');
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [refresh]);

    if (loading) return (
      <div className="p-6 text-center flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">Return ID</th>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">Quantity</th>
                            <th className="py-3 px-4 text-left">Reason</th>
                            <th className="py-3 px-4 text-left">Source</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
    {returns.map(returnItem => (
        <tr key={returnItem._id} className="border-b hover:bg-gray-50">
            <td className="border px-4 py-2">{returnItem.returnId}</td>
            <td className="border px-4 py-2">{returnItem.productName}</td>
            <td className="border px-4 py-2">{returnItem.quantityReturned}</td>
            <td className="border px-4 py-2">{returnItem.reasonForReturn}</td>
            <td className="border px-4 py-2">{returnItem.source}</td>
            <td className="border px-4 py-2">{new Date(returnItem.dateOfReturn).toLocaleDateString()}</td>
            <td className="border px-4 py-2">{returnItem.remarks || '-'}</td>

        </tr>
    ))}
</tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnProductsHistory;