import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuHistory, LuDownload } from 'react-icons/lu';
import { format } from 'date-fns';

const ReturnHistory = ({ refresh }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReturns = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/admin/returns');
                setReturns(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch return history:', err);
                setError('Failed to load return history. Please check your network and API.');
                setLoading(false);
            }
        };
        fetchReturns();
    }, [refresh]);

    const handleApprove = async (returnId) => {
        try {
            await axios.put(`/admin/returns/${returnId}`);
            setReturns(prevReturns => prevReturns.map(item => 
                item._id === returnId ? { ...item, status: 'Approved' } : item
            ));
        } catch (err) {
            console.error('Failed to approve return:', err);
            setError('Failed to approve return. Please try again.');
        }
    };

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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {returns.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    No returns found.
                                </td>
                            </tr>
                        ) : (
                            returns.map(item => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(item.date), 'MM/dd/yyyy')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {item.status !== 'Approved' && (
                                            <button onClick={() => handleApprove(item._id)} className="text-primary hover:text-indigo-900">
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-center">
                <button className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center mx-auto">
                    <LuDownload className="mr-2" /> Generate Report
                </button>
            </div>
        </div>
    );
};

export default ReturnHistory;