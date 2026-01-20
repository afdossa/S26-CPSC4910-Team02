import React, { useState } from 'react';
import { MOCK_USERS, createUser } from '../services/mockData';
import { User, UserRole } from '../types';
import { ArrowLeft, Users, Shield, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminUserManagement: React.FC = () => {
    // Current Users State
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [searchTerm, setSearchTerm] = useState('');

    // Create User State
    const [newUsername, setNewUsername] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.DRIVER);
    const [newPassword, setNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newFullName || !newPassword || !newEmail) {
            alert("Please fill in all required fields");
            return;
        }

        const success = createUser(newUsername, newFullName, newRole, newPassword, { email: newEmail });
        if (success) {
            alert(`User ${newUsername} created successfully with role ${newRole}`);
            setNewUsername('');
            setNewFullName('');
            setNewPassword('');
            setNewEmail('');
            setNewRole(UserRole.DRIVER);
            setUsers([...MOCK_USERS]); // Refresh list
        } else {
            alert("Username already exists.");
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <p className="text-gray-500">View all users and manually create accounts.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                             <div className="flex items-center">
                                <Users className="w-5 h-5 text-gray-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">All System Users</h3>
                             </div>
                             <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-1 border"
                                  placeholder="Search users..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>
                        </div>
                        
                        <div className="max-h-[600px] overflow-y-auto">
                            <ul className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                                                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover"/>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">{user.fullName}</h3>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                                {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                                  user.role === UserRole.SPONSOR ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <li className="px-6 py-4 text-center text-gray-500">No users found.</li>
                                )}
                            </ul>
                        </div>
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
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input 
                                        type="email" 
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
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