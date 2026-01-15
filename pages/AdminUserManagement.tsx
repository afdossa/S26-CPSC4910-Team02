import React, { useState } from 'react';
import { MOCK_PENDING_USERS, approveUser, rejectUser, createUser } from '../services/mockData';
import { PendingUser, UserRole } from '../types';
import { Check, X, ArrowLeft, Users, UserPlus, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminUserManagement: React.FC = () => {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(MOCK_PENDING_USERS);

    // Create User State
    const [newUsername, setNewUsername] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.DRIVER);
    const [newPassword, setNewPassword] = useState('');

    const handleApprove = (id: string) => {
        if (approveUser(id)) {
            setPendingUsers(pendingUsers.filter(u => u.id !== id));
            alert("User approved and added to active user list.");
        }
    };

    const handleReject = (id: string) => {
        if (rejectUser(id)) {
            setPendingUsers(pendingUsers.filter(u => u.id !== id));
            alert("User request rejected.");
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newFullName || !newPassword) {
            alert("Please fill in all fields");
            return;
        }

        const success = createUser(newUsername, newFullName, newRole, newPassword);
        if (success) {
            alert(`User ${newUsername} created successfully with role ${newRole}`);
            setNewUsername('');
            setNewFullName('');
            setNewPassword('');
            setNewRole(UserRole.DRIVER);
        } else {
            alert("Username already exists.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center">
                    <Users className="w-8 h-8 text-gray-700 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500">Manage pending requests and create new accounts.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Requests Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex items-center">
                            <UserPlus className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Account Requests</h3>
                        </div>
                        
                        {pendingUsers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p>No pending user requests found.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {pendingUsers.map((user) => (
                                    <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{user.fullName}</h3>
                                            <p className="text-sm text-gray-500">Username: <span className="font-mono">{user.username}</span></p>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {user.role}
                                                </span>
                                                <span className="text-xs text-gray-400">Requested: {user.requestDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <X className="w-4 h-4 mr-1 text-red-500" /> Deny
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Create User Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                         <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex items-center">
                            <Shield className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New User</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={newFullName}
                                        onChange={(e) => setNewFullName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input 
                                        type="text" 
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select 
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                    >
                                        <option value={UserRole.DRIVER}>Driver</option>
                                        <option value={UserRole.SPONSOR}>Sponsor</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Create Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};