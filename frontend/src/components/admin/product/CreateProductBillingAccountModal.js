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
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [editingInternalAccount, setEditingInternalAccount] = useState(null);

    const getEndpoint = () => isShop ? '/shop/product-billing-users' : '/admin/product-billing-users';

    // Load accounts when component mounts or when manage accounts is shown
    useEffect(() => {
        if (showManageAccounts) {
            fetchAccounts();
        }
        fetchCategories();
    }, [showManageAccounts]);

    // Load editing account data if editing
    useEffect(() => {
        if (editingAccount) {
            setFormData({
                username: editingAccount.username,
                password: '',
            });
            setSelectedCategories(editingAccount.allowedCategories ? (typeof editingAccount.allowedCategories[0] === 'object' ? editingAccount.allowedCategories.map(cat => cat._id) : editingAccount.allowedCategories) : []);
        } else {
            setFormData({
                username: '',
                password: '',
            });
            setSelectedCategories([]);
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

    const fetchCategories = async () => {
        try {
            const categoryUrl = isShop ? '/shop/categories' : '/admin/categories';
            const response = await axios.get(categoryUrl, { withCredentials: true });
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
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
            const currentEditing = editingAccount || editingInternalAccount;

            if (currentEditing) {
                // Update existing account
                await axios.put(`${endpoint}/${currentEditing._id}`, {
                    username: formData.username,
                    password: formData.password || undefined,
                    allowedCategories: selectedCategories,
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
                    allowedCategories: selectedCategories,
                }, {
                    withCredentials: true,
                });
                setSuccess('Account created successfully!');
            }

            // Clear form
            resetForm();

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
        setEditingInternalAccount(account);
        setFormData({
            username: account.username,
            password: '',
        });
        setSelectedCategories(account.allowedCategories ? 
            (typeof account.allowedCategories[0] === 'object' 
                ? account.allowedCategories.map(cat => cat._id) 
                : account.allowedCategories) 
            : []);
        setShowManageAccounts(false);
        setShowPassword(false);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
        });
        setSelectedCategories([]);
        setEditingInternalAccount(null);
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

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Allowed Categories
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                            {categories.map(cat => (
                                <label key={cat._id} className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat._id)}
                                        onChange={() => handleCategoryToggle(cat._id)}
                                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                                    />
                                    <span className="truncate">{cat.name}</span>
                                </label>
                            ))}
                            {categories.length === 0 && (
                                <p className="col-span-2 text-xs text-gray-500 text-center py-2">No categories found</p>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">If none selected, user can see all categories.</p>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 ${editingAccount || editingInternalAccount ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold`}
                        >
                            {loading ? (editingAccount || editingInternalAccount ? 'Updating...' : 'Creating...') : (editingAccount || editingInternalAccount ? 'Update Account' : 'Create Account')}
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allowed Categories</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts.map((account) => (
                                    <tr key={account._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">{account.username}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs overflow-hidden">
                                            {account.allowedCategories && account.allowedCategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {account.allowedCategories.map(cat => (
                                                        <span key={cat?._id || Math.random()} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-blue-200">
                                                            {typeof cat === 'object' ? cat.name : cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-[10px]">All Accessible</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs space-x-1">
                                            <button
                                                onClick={() => startEditing(account)}
                                                className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2.5 py-1.5 rounded-lg transition-colors font-bold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account._id)}
                                                className="bg-red-100 text-red-600 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors font-bold ml-1"
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
