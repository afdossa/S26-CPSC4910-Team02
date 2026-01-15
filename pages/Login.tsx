import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS, registerUser, resetDatabase } from '../services/mockData';
import { useNavigate } from 'react-router-dom';
import { Lock, UserCheck, UserPlus, Database } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.DRIVER);

  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = MOCK_USERS.find(u => u.username === username);
    
    if (foundUser && foundUser.password === password) {
      onLogin(foundUser);
      navigate('/dashboard');
    } else {
      alert('Invalid credentials. For testing: admin / test');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!regUsername || !regPassword || !regFullName) {
          alert("Please fill in all fields.");
          return;
      }
      
      const success = registerUser(regUsername, regFullName, regRole, regPassword);
      if (success) {
          alert("Account created successfully! Please wait for an Admin to approve your account.");
          setIsRegistering(false);
          setRegUsername('');
          setRegPassword('');
          setRegFullName('');
      } else {
          alert("Username already taken.");
      }
  };

  const quickLogin = (role: UserRole) => {
    // Quick login for dev (bypasses password for standard mocks if needed, but better to use real auth now)
    // We will find the FIRST user of this role
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
        // Auto-fill for convenience
        setUsername(user.username);
        setPassword(user.password || 'password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Join the Driver Incentive Program' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {isRegistering ? (
             <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                <div className="rounded-md shadow-sm space-y-3">
                    <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        id="fullName"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                    />
                    </div>
                    <div>
                    <label htmlFor="regUsername" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        id="regUsername"
                        type="text"
                        required
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                    />
                    </div>
                    <div>
                    <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        id="regPassword"
                        type="password"
                        required
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                    />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <select
                            id="role"
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value as UserRole)}
                        >
                            <option value={UserRole.DRIVER}>Driver</option>
                            <option value={UserRole.SPONSOR}>Sponsor</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                    </div>
                </div>

                <div>
                    <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <UserPlus className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                    </span>
                    Sign Up
                    </button>
                </div>
                <div className="text-center">
                    <button type="button" onClick={() => setIsRegistering(false)} className="text-sm text-blue-600 hover:text-blue-500">
                        Already have an account? Sign in
                    </button>
                </div>
            </form>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                </div>
                <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <div>
                <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                </span>
                Sign in
                </button>
            </div>
             <div className="text-center">
                <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-blue-600 hover:text-blue-500">
                    Need an account? Create one
                </button>
            </div>
            </form>
        )}

        {!isRegistering && (
             <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                        Dev Tools: Pre-fill Credentials
                    </span>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <button onClick={() => quickLogin(UserRole.DRIVER)} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-500 hover:bg-gray-50">
                    <UserCheck className="w-4 h-4 mr-1"/> Driver
                    </button>
                    <button onClick={() => quickLogin(UserRole.SPONSOR)} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-500 hover:bg-gray-50">
                    <UserCheck className="w-4 h-4 mr-1"/> Sponsor
                    </button>
                    <button onClick={() => quickLogin(UserRole.ADMIN)} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-500 hover:bg-gray-50">
                    <UserCheck className="w-4 h-4 mr-1"/> Admin
                    </button>
                </div>
                
                <div className="mt-4 border-t border-gray-200 pt-4 text-center">
                    <button 
                        onClick={() => { if(window.confirm('Reset all data? This clears local storage.')) resetDatabase(); }} 
                        className="text-xs text-red-500 hover:text-red-700 flex items-center justify-center mx-auto"
                    >
                        <Database className="w-3 h-3 mr-1" /> Reset Local Database
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};