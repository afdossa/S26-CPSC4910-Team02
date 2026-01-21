import React, { useState, useEffect } from 'react';
import { MOCK_USERS, createUser, updateUserRole, getAllUsers } from '../services/mockData';
import { User, UserRole } from '../types';
import { ArrowLeft, Users, Shield, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminUserManagement: React.FC = () => {
    // Current Users State
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Create User State
    const [newUsername, setNewUsername] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.DRIVER);
    const [newPassword, setNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        // Load users on mount
        const load = async () => {
            // Note: In real app this comes from API. 
            // Currently MOCK_USERS is static in mockData, but we want to see live changes if possible.
            // Since getAllUsers isn't fully wired for live list in mysql.ts (returns empty in previous step), 
            // we will fallback to MOCK_USERS if empty, or try to implement a refresh logic.
            // For now, we will just use MOCK_USERS as the base but try to refresh.
            
            // NOTE FOR USER: In a real "Live" mode, we would fetch from API. 
            // Since we don't have a 'getAllUsers' in mysql.ts explicitly returning the array for UI,
            // we are using the local state modification to simulate it for this UI view.
            setUsers(MOCK_USERS); 
            setLoading(false);
        };
        load();
    }, []);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newFullName || !newPassword || !newEmail) {
            alert("Please fill in all required fields");
            return;
        }

        createUser(newUsername, newFullName, newRole, newPassword, { email: newEmail }).then((success) => {
            if (success) {
                alert(`User ${newUsername} created successfully with role ${newRole}`);
                setNewUsername('');
                setNewFullName('');
                setNewPassword('');
                setNewEmail('');
                setNewRole(UserRole.DRIVER);
                // Refresh list locally
                const newUser: User = {
                    id: `temp_${Date.now()}`,
                    username: newUsername,
                    fullName: newFullName,
                    role: newRole,
                    email: newEmail,
                    avatarUrl: 'https://via.placeholder.com/150'
                };
                setUsers([...users, newUser]);
            } else {
                alert("Username already exists.");
            }
        });
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const user = users.find(u => u.id === userId);
        if(!user) return;

        if(!window.confirm(`Are you sure you want to change ${user.username}'s role from ${user.role} to ${newRole}?`)) return;

        const success = await updateUserRole(userId, newRole);
        if(success) {
            setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));
        } else {
            alert("Failed to update role. Please try again.");
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
                                            <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                className={`text-xs border-gray-300 rounded-full shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-1 pl-2 pr-6 cursor-pointer font-bold
                                                    ${user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-800' : 
                                                      user.role === UserRole.SPONSOR ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}
                                            >
                                                <option value={UserRole.DRIVER}>DRIVER</option>
                                                <option value={UserRole.SPONSOR}>SPONSOR</option>
                                                <option value={UserRole.ADMIN}>ADMIN</option>
                                            </select>
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