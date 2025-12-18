import React, { useState, useEffect } from 'react';
import { LuHistory } from 'react-icons/lu';
import axios from '../../../api/axios';

const ReturnHistoryTable = ({ refresh }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReturns = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/admin/warehouse/returns');
                setReturns(response.data);
                setError('');
            } catch (err) {
                console.error('Failed to fetch return history:', err);
                setError('Failed to load return history.');
            } finally {
                setLoading(false);
            }
        };
        fetchReturns();
    }, [refresh]);

    if (loading) return (
      <div className="text-center p-6 text-gray-500 flex flex-col items-center justify-center">
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

    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                <LuHistory className="mr-2" /> Return History
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {returns.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No returns found.
                                </td>
                            </tr>
                        ) : (
                            returns.map(item => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.returnId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantityReturned}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.reasonForReturn}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.source}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(item.dateOfReturn).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnHistoryTable;