
import React, { useState, useEffect } from 'react';
import { createUser, updateUserRole, getAllUsers, addAuditLog, banUser, deleteUser } from '../services/mockData';
import { User, UserRole } from '../types';
import { ArrowLeft, Users, Shield, Search, Key, CheckCircle, AlertCircle, Loader, X, RefreshCw, Eye, EyeOff, Lock, UserX, UserCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';

const PasswordResetModal: React.FC<{
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}> = ({ user, isOpen, onClose, onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const generateRandomPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setNewPassword(retVal);
        setConfirmPassword(retVal);
        setShowPassword(true);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await authService.adminSetPassword(user.id, newPassword);
            await addAuditLog(
                'Manual Password Override',
                'admin',
                user.username,
                `Administrator manually changed password for ${user.username}`,
                'PASSWORD_CHANGE'
            );
            onSuccess(`Successfully changed password for ${user.fullName}`);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl mr-3">
                            <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Reset Password</h3>
                            <p className="text-xs text-gray-500">For {user.fullName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleReset} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded text-xs text-red-700 dark:text-red-400 font-bold flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-blue-500"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Repeat password"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={generateRandomPassword}
                            className="flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-3 h-3 mr-2" /> Generate Random Secure Password
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            Update Password Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Modal State
    const [resetUser, setResetUser] = useState<User | null>(null);

    // Create User State
    const [newUsername, setNewUsername] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.DRIVER);
    const [newPassword, setNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const all = await getAllUsers();
            setUsers(all); 
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUsers();
    }, []);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newFullName || !newPassword || !newEmail) {
            setMessage({ text: "Please fill in all required fields", type: 'error' });
            return;
        }

        createUser(newUsername, newFullName, newRole, newPassword, { email: newEmail }).then((success) => {
            if (success) {
                setMessage({ text: `User ${newUsername} created successfully.`, type: 'success' });
                setNewUsername('');
                setNewFullName('');
                setNewPassword('');
                setNewEmail('');
                setNewRole(UserRole.DRIVER);
                refreshUsers();
            } else {
                setMessage({ text: "Username already exists.", type: 'error' });
            }
            setTimeout(() => setMessage(null), 5000);
        });
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const user = users.find(u => u.id === userId);
        if(!user) return;

        if(!window.confirm(`Are you sure you want to change ${user.username}'s role to ${newRole}?`)) return;

        const success = await updateUserRole(userId, newRole);
        if(success) {
            setMessage({ text: `Updated ${user.username}'s role to ${newRole}`, type: 'success' });
            refreshUsers();
        } else {
            setMessage({ text: "Failed to update role.", type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleToggleBan = async (user: User) => {
        const isBanning = user.isActive !== false;
        const actionLabel = isBanning ? 'Ban' : 'Unban';
        if (!window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} user ${user.username}?`)) return;

        try {
            const success = await banUser(user.id, !isBanning);
            if (success) {
                setMessage({ text: `User ${user.username} ${isBanning ? 'banned' : 'unbanned'} successfully.`, type: 'success' });
                await refreshUsers();
            } else {
                setMessage({ text: `Failed to ${actionLabel.toLowerCase()} user.`, type: 'error' });
            }
        } catch (err) {
            setMessage({ text: "Error toggling ban status.", type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteUser = async (user: User) => {
        if (!window.confirm(`CRITICAL ACTION: Are you sure you want to PERMANENTLY DELETE user ${user.username}? This cannot be undone.`)) return;

        try {
            const success = await deleteUser(user.id);
            if (success) {
                setMessage({ text: `User ${user.username} has been permanently deleted.`, type: 'success' });
                await refreshUsers();
            } else {
                setMessage({ text: `Failed to delete user.`, type: 'error' });
            }
        } catch (err) {
            setMessage({ text: "Error deleting user account.", type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const filteredUsers = users.filter(u => {
        const term = searchTerm.toLowerCase();
        return (
            u.username.toLowerCase().includes(term) || 
            u.fullName.toLowerCase().includes(term) ||
            (u.email && u.email.toLowerCase().includes(term))
        );
    });

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-4 font-bold text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Users className="w-8 h-8 text-gray-700 dark:text-gray-300 mr-3" />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Review, create, and manage system accounts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center shadow-lg animate-in fade-in slide-in-from-top-4 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 shadow-xl overflow-hidden sm:rounded-3xl border border-gray-100 dark:border-slate-700">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                             <div className="flex items-center">
                                <Users className="w-5 h-5 text-gray-500 mr-2" />
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">All System Users</h3>
                             </div>
                             <div className="relative rounded-2xl shadow-sm w-full sm:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  className="focus:ring-2 focus:ring-blue-500 block w-full pl-10 text-sm border-gray-200 dark:border-slate-600 rounded-2xl py-2 bg-white dark:bg-slate-700 dark:text-white border outline-none"
                                  placeholder="Search users..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>
                        </div>
                        
                        <div className="max-h-[600px] overflow-y-auto">
                            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                                {loading ? (
                                    <li className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                                        <Loader className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                                        Refreshing user data...
                                    </li>
                                ) : filteredUsers.map((user) => (
                                    <li key={user.id} className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors gap-4 ${user.isActive === false ? 'opacity-60 bg-red-50/10' : ''}`}>
                                        <div className="flex items-center w-full sm:w-auto">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-slate-600 overflow-hidden mr-4 border border-gray-100 dark:border-slate-500 flex-shrink-0 shadow-sm relative">
                                                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover"/>
                                                {user.isActive === false && (
                                                    <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                                                        <UserX className="w-6 h-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center">
                                                    <h3 className={`text-sm font-bold text-gray-900 dark:text-white truncate ${user.isActive === false ? 'line-through decoration-red-500/50' : ''}`}>{user.fullName}</h3>
                                                    {user.isActive === false && (
                                                        <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded shadow-sm tracking-wider animate-in fade-in slide-in-from-left-2">Banned</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">@{user.username}</p>
                                                {user.email && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user.email}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                                            {/* Ban/Unban Button */}
                                            <button 
                                                onClick={() => handleToggleBan(user)}
                                                className={`p-2 rounded-xl transition-all shadow-sm ${user.isActive === false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                                title={user.isActive === false ? 'Restore Account (Unban)' : 'Suspend Account (Ban)'}
                                            >
                                                {user.isActive === false ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                                            </button>

                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDeleteUser(user)}
                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all shadow-sm"
                                                title="Permanently Delete User"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            {/* Password Reset Button */}
                                            <button 
                                                onClick={() => setResetUser(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-xl transition-all"
                                                title="Manually Set Password"
                                            >
                                                <Key className="w-5 h-5" />
                                            </button>
                                            
                                            <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                className={`text-[10px] border-none rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 py-1.5 pl-3 pr-8 cursor-pointer font-black uppercase tracking-widest
                                                    ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 
                                                      user.role === UserRole.SPONSOR ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}
                                            >
                                                <option value={UserRole.DRIVER}>DRIVER</option>
                                                <option value={UserRole.SPONSOR}>SPONSOR</option>
                                                <option value={UserRole.ADMIN}>ADMIN</option>
                                            </select>
                                        </div>
                                    </li>
                                ))}
                                {!loading && filteredUsers.length === 0 && (
                                    <li className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        No users matching your search.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Create User Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 shadow-xl overflow-hidden sm:rounded-3xl border border-gray-100 dark:border-slate-700 sticky top-24">
                         <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center">
                            <Shield className="w-5 h-5 text-blue-500 mr-2" />
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Create New User</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={newFullName}
                                        onChange={(e) => setNewFullName(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                                    <input 
                                        type="text" 
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white outline-none"
                                        required
                                    />
                                </div>
                                 <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Initial Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">System Role</label>
                                    <select 
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white outline-none"
                                    >
                                        <option value={UserRole.DRIVER}>Driver</option>
                                        <option value={UserRole.SPONSOR}>Sponsor</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Create Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Reset Modal */}
            {resetUser && (
                <PasswordResetModal 
                    user={resetUser}
                    isOpen={!!resetUser}
                    onClose={() => setResetUser(null)}
                    onSuccess={(msg) => {
                        setMessage({ text: msg, type: 'success' });
                        setTimeout(() => setMessage(null), 5000);
                    }}
                />
            )}
        </div>
    );
};
