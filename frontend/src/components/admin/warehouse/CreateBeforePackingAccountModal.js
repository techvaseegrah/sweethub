import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function CreateBeforePackingAccountModal({ onClose, onAccountCreated, editingAccount = null, showManageAccountsInitial = false }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [showManageAccounts, setShowManageAccounts] = useState(showManageAccountsInitial);
    const [showPassword, setShowPassword] = useState(false);
    const [currentEditingAccount, setCurrentEditingAccount] = useState(editingAccount);
    const [deleteConfirmState, setDeleteConfirmState] = useState({
        show: false,
        accountId: null
    });
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Sync internal state with prop if it changes
    useEffect(() => {
        if (editingAccount) {
            setCurrentEditingAccount(editingAccount);
        }
    }, [editingAccount]);

    // Load accounts when component mounts if in manage mode
    useEffect(() => {
        if (showManageAccountsInitial) {
            fetchAccounts();
        }
        fetchCategories();
    }, []);
    
    // Load editing account data if editing
    useEffect(() => {
        if (currentEditingAccount) {
            setFormData({
                username: currentEditingAccount.username,
                password: '',
            });
            setSelectedCategories(currentEditingAccount.allowedCategories ? 
                currentEditingAccount.allowedCategories.map(cat => 
                    (cat && typeof cat === 'object') ? cat._id : cat
                ).filter(Boolean)
                : []);
        } else {
            setFormData({
                username: '',
                password: '',
            });
            setSelectedCategories([]);
        }
    }, [currentEditingAccount]);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/admin/before-packing-only-users', {
                withCredentials: true,
            });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching before-packing-only users:', err);
            setError('Failed to load before-packing-only accounts');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/admin/categories', { withCredentials: true });
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
            if (currentEditingAccount) {
                // Update existing account
                await axios.put(`/admin/before-packing-only-users/${currentEditingAccount._id}`, {
                    username: formData.username,
                    password: formData.password || undefined, // Only send password if it's being changed
                    allowedCategories: selectedCategories,
                }, {
                    withCredentials: true,
                });
                setSuccess('Before packing-only account updated successfully!');
            } else {
                // Create new account
                await axios.post('/admin/before-packing-only-users', {
                    username: formData.username,
                    password: formData.password,
                    name: formData.username, // Use username as name
                    allowedCategories: selectedCategories,
                }, {
                    withCredentials: true,
                });
                setSuccess('Before packing-only account created successfully!');
            }
            
            // Clear form
            setFormData({
                username: '',
                password: '',
            });
            setSelectedCategories([]);

            // Refresh accounts list to show the newly created account
            fetchAccounts();

            // Call the success callback
            setTimeout(() => {
                onAccountCreated();
                if (!showManageAccounts) {
                    onClose();
                }
            }, 1000);
        } catch (err) {
            console.error('Error saving before-packing-only user:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(currentEditingAccount ? 'Failed to update before packing-only account. Please try again.' : 'Failed to create before packing-only account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (accountId) => {
        setDeleteConfirmState({
            show: true,
            accountId: accountId
        });
    };

    const confirmDelete = async () => {
        const { accountId } = deleteConfirmState;
        try {
            await axios.delete(`/admin/before-packing-only-users/${accountId}`, {
                withCredentials: true,
            });
            
            setSuccess('Before packing-only account deleted successfully!');
            fetchAccounts(); // Refresh the list
            setDeleteConfirmState({ show: false, accountId: null }); // Close confirmation
        } catch (err) {
            console.error('Error deleting before-packing-only user:', err);
            setError('Failed to delete before packing-only account. Please try again.');
            setDeleteConfirmState({ show: false, accountId: null }); // Close confirmation
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmState({ show: false, accountId: null });
    };


    const startEditing = (account) => {
        setFormData({
            username: account.username,
            password: '',
        });
        setSelectedCategories(account.allowedCategories ? 
            account.allowedCategories.map(cat => 
                (cat && typeof cat === 'object') ? cat._id : cat
            ).filter(Boolean)
            : []);
        setCurrentEditingAccount(account);
        setShowManageAccounts(false);
    };

    return (
        <div className="p-6">
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {success && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{success}</div>}
            
            {showManageAccounts ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Manage Before Packing Accounts</h3>
                        <button
                            onClick={() => {
                                setShowManageAccounts(false);
                                setCurrentEditingAccount(null);
                                setFormData({ username: '', password: '' });
                                setSelectedCategories([]);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Create
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="py-2 px-4 border-b text-left">Username</th>
                                    <th className="py-2 px-4 border-b text-left">Allowed Categories</th>
                                    <th className="py-2 px-4 border-b text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr key={account._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{account.username}</td>
                                        <td className="py-2 px-4 border-b text-sm text-gray-500">
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
                                        <td className="py-2 px-4 border-b">
                                            <button
                                                onClick={() => startEditing(account)}
                                                className="text-blue-600 hover:text-blue-800 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account._id)}
                                                className="text-red-600 hover:text-red-800"
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
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Password {currentEditingAccount ? '' : '*'}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={!currentEditingAccount}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
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
                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
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
                    </div>
                    
                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (currentEditingAccount ? 'Update Account' : 'Create Account')}
                        </button>
                    </div>
                </form>
            )}

            {!showManageAccounts && (
                <div className="mt-4">
                    <button
                        onClick={() => {
                            setShowManageAccounts(true);
                            fetchAccounts(); // Refresh accounts when switching to manage view
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Manage Before Packing Accounts
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmState.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="mb-6">Are you sure you want to delete this before packing account? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateBeforePackingAccountModal;