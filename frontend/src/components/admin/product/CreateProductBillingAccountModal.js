import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function CreateProductBillingAccountModal({ onClose, onAccountCreated, isShop = false, editingAccount = null }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [showManageAccounts, setShowManageAccounts] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [accountToDeleteId, setAccountToDeleteId] = useState(null);

    const getEndpoint = () => isShop ? '/shop/product-billing-users' : '/admin/product-billing-users';

    // Load accounts when component mounts or when manage accounts is shown
    useEffect(() => {
        if (showManageAccounts) {
            fetchAccounts();
        }
    }, [showManageAccounts]);

    // Load editing account data if editing
    useEffect(() => {
        if (editingAccount) {
            setFormData({
                username: editingAccount.username,
                password: '',
            });
        } else {
            setFormData({
                username: '',
                password: '',
            });
        }
    }, [editingAccount]);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get(getEndpoint(), {
                withCredentials: true,
            });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching product-billing users:', err);
            setError('Failed to load product-billing accounts');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const endpoint = getEndpoint();

            if (editingAccount) {
                // Update existing account
                await axios.put(`${endpoint}/${editingAccount._id}`, {
                    username: formData.username,
                    password: formData.password || undefined,
                }, {
                    withCredentials: true,
                });
                setSuccess('Account updated successfully!');
            } else {
                // Create new account
                await axios.post(endpoint, {
                    username: formData.username,
                    password: formData.password,
                    name: formData.username,
                }, {
                    withCredentials: true,
                });
                setSuccess('Account created successfully!');
            }

            // Clear form
            setFormData({
                username: '',
                password: '',
            });

            // Refresh accounts list if in manage mode
            if (showManageAccounts) {
                fetchAccounts();
            }

            // Call the success callback
            setTimeout(() => {
                onAccountCreated();
                if (!showManageAccounts) {
                    onClose();
                }
            }, 1000);
        } catch (err) {
            console.error('Error saving product-billing user:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(editingAccount ? 'Failed to update account. Please try again.' : 'Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (accountId) => {
        setAccountToDeleteId(accountId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!accountToDeleteId) return;

        try {
            await axios.delete(`${getEndpoint()}/${accountToDeleteId}`, {
                withCredentials: true,
            });

            setSuccess('Account deleted successfully!');
            fetchAccounts(); // Refresh the list
            setIsDeleteModalOpen(false);
            setAccountToDeleteId(null);
        } catch (err) {
            console.error('Error deleting product-billing user:', err);
            setError('Failed to delete account. Please try again.');
            setIsDeleteModalOpen(false);
            setAccountToDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setAccountToDeleteId(null);
    };

    const startEditing = (account) => {
        setFormData({
            username: account.username,
            password: '',
        });
        setShowManageAccounts(false);
        setShowPassword(false);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
        });
        setShowPassword(false);
    };

    return (
        <div className="p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {!showManageAccounts ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                                placeholder={editingAccount ? "Enter new password (optional)" : "Enter password"}
                                required={!editingAccount}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (editingAccount ? 'Updating...' : 'Creating...') : (editingAccount ? 'Update Account' : 'Create Account')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                            }}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Manage Accounts</h3>
                        <button
                            onClick={() => setShowManageAccounts(false)}
                            className="text-red-600 hover:text-red-800 underline"
                        >
                            Back to Form
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-64">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts.map((account) => (
                                    <tr key={account._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{account.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => startEditing(account)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account._id)}
                                                className="text-red-600 hover:text-red-900 ml-2"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!showManageAccounts && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowManageAccounts(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Manage Existing Accounts
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in text-center">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-600 mb-8 px-4">
                            Are you sure you want to delete this account? This action cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="w-full sm:w-1/2 py-3 px-6 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition duration-200 shadow-lg shadow-red-200"
                            >
                                Yes, Delete
                            </button>
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="w-full sm:w-1/2 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateProductBillingAccountModal;
