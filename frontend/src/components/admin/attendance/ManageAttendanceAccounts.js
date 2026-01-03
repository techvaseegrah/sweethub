import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

function ManageAttendanceAccounts() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        username: '',
        password: ''
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/admin/attendance-only-users', {
                withCredentials: true,
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching attendance-only users:', err);
            setError('Failed to fetch attendance-only users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setEditingUser(user._id);
        setEditFormData({
            name: user.name,
            username: user.username,
            password: '' // Don't populate password field
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        try {
            await axios.put(`/admin/attendance-only-users/${editingUser}`, editFormData, {
                withCredentials: true,
            });
            
            setEditingUser(null);
            setEditFormData({ name: '', username: '', password: '' });
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error updating attendance-only user:', err);
            alert('Failed to update attendance-only user: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        
        try {
            await axios.delete(`/admin/attendance-only-users/${userToDelete._id}`, {
                withCredentials: true,
            });
            
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error deleting attendance-only user:', err);
            alert('Failed to delete attendance-only user: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditFormData({ name: '', username: '', password: '' });
    };

    const handleAddNew = () => {
        navigate('/admin/attendance/create-attendance-account');
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Attendance-Only Accounts</h2>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Attendance-Only Accounts</h2>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Create New Account
                </button>
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Username</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50">
                                {editingUser === user._id ? (
                                    <form onSubmit={handleUpdate}>
                                        <tr>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    value={editFormData.name}
                                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                                                    required
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    value={editFormData.username}
                                                    onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                                                    required
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="password"
                                                    placeholder="New password (optional)"
                                                    value={editFormData.password}
                                                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 mb-2"
                                                />
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEdit}
                                                        className="bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </form>
                                ) : (
                                    <>
                                        <td className="py-3 px-4 text-sm">{user.name}</td>
                                        <td className="py-3 px-4 text-sm">{user.username}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUserToDelete(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No attendance-only accounts found. <button 
                        onClick={handleAddNew}
                        className="text-blue-600 hover:underline"
                    >
                        Create your first account
                    </button>.
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete the account <strong>{userToDelete?.name}</strong> (username: {userToDelete?.username})? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
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

export default ManageAttendanceAccounts;