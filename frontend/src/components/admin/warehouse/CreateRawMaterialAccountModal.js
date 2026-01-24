import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function CreateRawMaterialAccountModal({ onClose, onAccountCreated, editingAccount = null, showManageAccountsInitial = false }) {
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
    // State for delete confirmation
    // State for delete confirmation
    const [deleteConfirmState, setDeleteConfirmState] = useState({
        show: false,
        accountId: null
    });

    // Load accounts when component mounts if in manage mode
    useEffect(() => {
        if (showManageAccountsInitial) {
            fetchAccounts();
        }
    }, []);
    
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
            const response = await axios.get('/admin/raw-materials-only-users', {
                withCredentials: true,
            });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching raw-material-only users:', err);
            setError('Failed to load raw-material-only accounts');
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
            if (editingAccount) {
                // Update existing account
                await axios.put(`/admin/raw-materials-only-users/${editingAccount._id}`, {
                    username: formData.username,
                    password: formData.password || undefined, // Only send password if it's being changed
                }, {
                    withCredentials: true,
                });
                setSuccess('Raw-material-only account updated successfully!');
            } else {
                // Create new account
                await axios.post('/admin/raw-materials-only-users', {
                    username: formData.username,
                    password: formData.password,
                    name: formData.username, // Use username as name
                }, {
                    withCredentials: true,
                });
                setSuccess('Raw-material-only account created successfully!');
            }
            
            // Clear form
            setFormData({
                username: '',
                password: '',
            });

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
            console.error('Error saving raw-material-only user:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(editingAccount ? 'Failed to update raw-material-only account. Please try again.' : 'Failed to create raw-material-only account. Please try again.');
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
            await axios.delete(`/admin/raw-materials-only-users/${accountId}`, {
                withCredentials: true,
            });
            
            setSuccess('Raw-material-only account deleted successfully!');
            fetchAccounts(); // Refresh the list
            setDeleteConfirmState({ show: false, accountId: null }); // Close confirmation
        } catch (err) {
            console.error('Error deleting raw-material-only user:', err);
            setError('Failed to delete raw-material-only account. Please try again.');
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
        setShowManageAccounts(false);
        setShowPassword(false);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
        });
        setShowPassword(false);
        // If we were editing, clear the editing state
        if (editingAccount) {
            // We need to pass a callback to parent to clear editing state
        }
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
                        {editingAccount && (
                            <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                        )}
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (editingAccount ? 'Updating...' : 'Creating...') : (editingAccount ? 'Update Account' : 'Create Account')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                if (editingAccount) {
                                    // If we were editing, clear the editing state
                                    onClose(); // Close the modal after reset
                                }
                            }}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            {editingAccount ? 'Cancel Edit' : 'Cancel'}
                        </button>
                    </div>
                </form>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Manage Raw Materials Accounts</h3>
                        <button
                            onClick={() => setShowManageAccounts(false)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Back to Form
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts.map((account) => (
                                    <tr key={account._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{account.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{account.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => {
                                                    startEditing(account);
                                                    setShowManageAccounts(false);
                                                }}
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
                        onClick={() => {
                            setShowManageAccounts(true);
                            fetchAccounts(); // Refresh accounts when switching to manage view
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Manage Raw Materials Accounts
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmState.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this raw-material-only account?</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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

export default CreateRawMaterialAccountModal;