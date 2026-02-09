import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { createProfile, getUserProfile, getAllUsers } from '../services/mockData';
import { authService } from '../services/auth';
import { updateConfig, isTestMode, getConfig } from '../services/config';
import { useNavigate } from 'react-router-dom';
import { Lock, UserPlus, AlertTriangle, Shield, Building, Truck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Test Mode State
  const [testMode, setTestMode] = useState(isTestMode());

  const navigate = useNavigate();

  // Listen for global config changes
  useEffect(() => {
      const handleConfigChange = () => {
          setTestMode(isTestMode());
      };
      window.addEventListener('config-change', handleConfigChange);
      return () => window.removeEventListener('config-change', handleConfigChange);
  }, []);

  const processLoginSuccess = async (uid: string, googleDetails?: { email: string, name: string }) => {
        try {
            const profile = await getUserProfile(uid);

            if (profile) {
                onLogin(profile);
                navigate('/dashboard');
                return;
            }

            if (googleDetails) {
                setLoading(true);
                const allUsers = await getAllUsers();
                const roleToAssign = allUsers.length === 0 ? UserRole.ADMIN : UserRole.DRIVER;
                
                const baseName = googleDetails.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const randomSuffix = Math.floor(Math.random() * 10000);
                const autoUsername = `${baseName}_${randomSuffix}`;

                const success = await createProfile(
                    uid, 
                    autoUsername, 
                    googleDetails.name, 
                    roleToAssign, 
                    {
                        email: googleDetails.email,
                        phone: '',
                        address: ''
                    }
                );

                if (success) {
                    const newProfile = await getUserProfile(uid);
                    if (newProfile) {
                        onLogin(newProfile);
                        navigate('/dashboard');
                        if (roleToAssign === UserRole.ADMIN) {
                            alert("Welcome! You are the first user, so you have been assigned ADMIN privileges.");
                        }
                    } else {
                        setError("Profile created but could not be loaded. Please refresh.");
                        setLoading(false);
                    }
                } else {
                    setError("Could not auto-create profile. Please register manually.");
                    setIsRegistering(true);
                    setRegEmail(googleDetails.email);
                    setRegFullName(googleDetails.name);
                    setLoading(false);
                }
            } else {
                setError("Account authenticated, but profile not found in database. Please register.");
                setLoading(false);
            }
        } catch (e: any) {
            console.error(e);
            setError("Login Error: " + e.message);
            setLoading(false);
        }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        const userCredential = await authService.signIn(email, password);
        await processLoginSuccess(userCredential.user.uid);
    } catch (err: any) {
        console.error(err);
        let msg = err.message || "Invalid credentials";
        if (msg.includes("API key")) msg = "Invalid Firebase API Key in configuration.";
        setError("Login failed: " + msg);
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError(null);
      setLoading(true);
      try {
          const result = await authService.signInWithGoogle();
          await processLoginSuccess(result.user.uid, {
              email: result.user.email || '',
              name: result.user.displayName || 'Google User'
          });
      } catch (err: any) {
          console.error("Google Sign In Error", err);
          setError("Google Sign-In failed: " + err.message);
          setLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!regUsername || !regFullName || !regEmail || !regPassword) {
          setError("Please fill in all required fields.");
          return;
      }
      
      setLoading(true);
      try {
          let uid = '';
          try {
             const userCredential = await authService.signUp(regEmail, regPassword);
             uid = userCredential.user.uid;
          } catch (authError: any) {
             if (authError.code === 'auth/email-already-in-use') {
                 setError("This email address is already associated with an account. Please sign in instead.");
                 setLoading(false);
                 return;
             }
             throw authError;
          }
          
          const allUsers = await getAllUsers();
          const roleToAssign = allUsers.length === 0 ? UserRole.ADMIN : UserRole.DRIVER;

          const success = await createProfile(uid, regUsername, regFullName, roleToAssign, {
              email: regEmail,
              phone: regPhone,
              address: regAddress
          });

          if (success) {
              const profile = await getUserProfile(uid);
              if (profile) {
                  onLogin(profile);
                  navigate('/dashboard');
                  if (roleToAssign === UserRole.ADMIN) {
                      alert("Welcome! You are the first user, so you have been assigned ADMIN privileges.");
                  } else {
                      alert("Account created successfully! Signing you in...");
                  }
              }
          } else {
              setError("Username already taken in profile database.");
          }
      } catch (err: any) {
          console.error(err);
          setError("Registration failed: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const fillCreds = (type: 'admin' | 'sponsor' | 'driver') => {
      setIsRegistering(false);
      setError(null);
      setPassword('password');
      
      if (type === 'admin') setEmail('admin@system.com');
      else if (type === 'sponsor') setEmail('alice@fastlane.com');
      else if (type === 'driver') setEmail('john.trucker@example.com');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isRegistering ? 'Complete your profile to start earning rewards' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {error && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700 dark:text-blue-200">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {isRegistering ? (
             <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                <div className="rounded-md shadow-sm space-y-3">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="regUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Display Name)</label>
                        <input
                            id="regUsername"
                            type="text"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                        />
                    </div>
                     <div>
                        <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            id="regEmail"
                            type="email"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label htmlFor="regPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (Optional)</label>
                            <input
                                id="regPhone"
                                type="tel"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                            />
                        </div>
                        <div>
                             <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                id="regPassword"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="regAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address (Optional)</label>
                        <textarea
                            id="regAddress"
                            rows={2}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700"
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <UserPlus className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                    </span>
                    {loading ? 'Creating Profile...' : 'Complete Registration'}
                    </button>
                </div>
                <div className="text-center">
                    <button type="button" onClick={() => setIsRegistering(false)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                        Back to Login
                    </button>
                </div>
            </form>
        ) : (
            <div className="mt-8 space-y-6">
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                        <label htmlFor="email" className="sr-only">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-slate-700"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        </div>
                        <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-slate-700"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        </div>
                    </div>

                    <div>
                        <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-md"
                        >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400 dark:text-blue-200" aria-hidden="true" />
                        </span>
                        {loading ? 'Signing in...' : 'Sign in with Email'}
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <GoogleIcon />
                        <span className="ml-3">Sign in with Google</span>
                    </button>
                </div>

                <div className="text-center">
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                        Need an account? Register
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Quick Login Helpers (Only in Test Mode) */}
      {testMode && (
          <div className="mt-8 max-w-md w-full">
              <p className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider font-semibold">Development Shortcuts</p>
              <div className="grid grid-cols-3 gap-3">
                  <button 
                      onClick={() => fillCreds('admin')}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-purple-300 transition-all group"
                  >
                      <Shield className="w-5 h-5 mb-1 text-purple-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Admin</span>
                  </button>
                  <button 
                      onClick={() => fillCreds('sponsor')}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group"
                  >
                      <Building className="w-5 h-5 mb-1 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Sponsor</span>
                  </button>
                  <button 
                      onClick={() => fillCreds('driver')}
                      className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-amber-300 transition-all group"
                  >
                      <Truck className="w-5 h-5 mb-1 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Driver</span>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};