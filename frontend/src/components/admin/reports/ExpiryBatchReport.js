import React from 'react';
import { LuFileClock, LuDownload, LuSearch, LuFilter } from 'react-icons/lu';

const ExpiryBatchReport = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Expiry / Batch Report</h1>
                    <p className="text-gray-600">Track batch validity and upcoming expirations</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                    <button className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Expired Items', value: '0', color: 'red' },
                    { label: 'Expiring in 7 Days', value: '0', color: 'orange' },
                    { label: 'Expiring in 30 Days', value: '0', color: 'yellow' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">Batch Expiry Details</h3>
                </div>
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LuFileClock className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">No Expiry Data</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Items close to expiration or recently expired will be flagged here for action.</p>
                </div>
            </div>
        </div>
    );
};

export default ExpiryBatchReport;
