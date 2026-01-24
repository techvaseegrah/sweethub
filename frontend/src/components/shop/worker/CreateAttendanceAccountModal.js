import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

function CreateAttendanceAccountModal({ onClose, onAccountCreated, isShop = true, editingAccount = null }) {
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
            const endpoint = isShop ? '/shop/attendance-only-users' : '/admin/attendance-only-users';
            const response = await axios.get(endpoint, {
                withCredentials: true,
            });
            setAccounts(response.data);
        } catch (err) {
            console.error('Error fetching attendance-only users:', err);
            setError('Failed to load attendance-only accounts');
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
            const endpoint = isShop ? '/shop/attendance-only-users' : '/admin/attendance-only-users';
            
            if (editingAccount) {
                // Update existing account
                await axios.put(`${endpoint}/${editingAccount._id}`, {
                    username: formData.username,
                    password: formData.password || undefined, // Only send password if it's being changed
                }, {
                    withCredentials: true,
                });
                setSuccess('Attendance-only account updated successfully!');
            } else {
                // Create new account
                await axios.post(endpoint, {
                    username: formData.username,
                    password: formData.password,
                    name: formData.username, // Use username as name
                }, {
                    withCredentials: true,
                });
                setSuccess('Attendance-only account created successfully!');
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
            console.error('Error saving attendance-only user:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(editingAccount ? 'Failed to update attendance-only account. Please try again.' : 'Failed to create attendance-only account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this attendance-only account?')) {
            try {
                const endpoint = isShop ? '/shop/attendance-only-users' : '/admin/attendance-only-users';
                await axios.delete(`${endpoint}/${accountId}`, {
                    withCredentials: true,
                });
                
                setSuccess('Attendance-only account deleted successfully!');
                fetchAccounts(); // Refresh the list
            } catch (err) {
                console.error('Error deleting attendance-only user:', err);
                setError('Failed to delete attendance-only account. Please try again.');
            }
        }
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
                        <h3 className="text-lg font-medium">Manage Attendance Accounts</h3>
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
                        onClick={() => setShowManageAccounts(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Manage Attendance Accounts
                    </button>
                </div>
            )}
        </div>
    );
}

export default CreateAttendanceAccountModal;