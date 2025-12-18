import React, { useState } from 'react';
import ReturnProductForm from '../components/admin/warehouse/ReturnProductForm';
import ReturnProductsHistory from '../components/admin/warehouse/ReturnProductsHistory';
import { LuHistory } from 'react-icons/lu';

const ReturnProductsPage = () => {
    const [refreshHistory, setRefreshHistory] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const handleReturnSuccess = () => {
        setRefreshHistory(prev => !prev);
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">📦 Return Products Module</h1>
                <button 
                    onClick={() => setShowHistoryModal(true)}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <LuHistory className="mr-2" /> View History
                </button>
            </div>
            
            <div className="flex-1">
                <ReturnProductForm onReturnSuccess={handleReturnSuccess} />
            </div>
            
            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center border-b p-4">
                            <h2 className="text-xl font-bold">Return Products History</h2>
                            <button 
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <ReturnProductsHistory refresh={refreshHistory} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnProductsPage;