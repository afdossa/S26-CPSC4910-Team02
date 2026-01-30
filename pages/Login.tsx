import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { createProfile, getUserProfile, getAllUsers } from '../services/mockData';
import { authService } from '../services/auth';
import { updateConfig, isTestMode, getConfig } from '../services/config';
import { useNavigate } from 'react-router-dom';
import { Lock, UserPlus, AlertTriangle, Beaker, Shield, Building, Truck, RefreshCw, Loader } from 'lucide-react';

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
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const navigate = useNavigate();

  // Listen for global config changes
  useEffect(() => {
      const handleConfigChange = () => {
          setTestMode(isTestMode());
          setIsSwitchingMode(false); // Stop spinning when change is detected
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

  // --- VALIDATION TOOLS LOGIC ---
  const toggleTestMode = () => {
      setIsSwitchingMode(true);
      const newState = !testMode;
      
      // Update config WITHOUT forcing reload.
      // App.tsx is now listening to config changes and will re-bind Auth service automatically.
      updateConfig({
          useMockAuth: newState,
          useMockDB: newState,
          useMockRedshift: newState
      }, false); 
  };

  const fillCreds = (type: 'admin' | 'sponsor' | 'driver') => {
      // 1. Force into Login mode (not register mode)
      setIsRegistering(false);
      setError(null);
      
      // 2. Set credentials
      setPassword('password');
      
      if (type === 'admin') setEmail('admin@system.com');
      else if (type === 'sponsor') setEmail('alice@fastlane.com');
      else if (type === 'driver') setEmail('john.trucker@example.com');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Complete your profile to start earning rewards' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {error && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {isRegistering ? (
             <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                {/* Registration Form Fields */}
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
                        <label htmlFor="regUsername" className="block text-sm font-medium text-gray-700 mb-1">Username (Display Name)</label>
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
                        <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            id="regEmail"
                            type="email"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label htmlFor="regPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                            <input
                                id="regPhone"
                                type="tel"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
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
                    </div>
                    <div>
                        <label htmlFor="regAddress" className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                        <textarea
                            id="regAddress"
                            rows={2}
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
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
                    <button type="button" onClick={() => setIsRegistering(false)} className="text-sm text-blue-600 hover:text-blue-500">
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
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white"
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
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                        </span>
                        {loading ? 'Signing in...' : 'Sign in with Email'}
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <GoogleIcon />
                        <span className="ml-3">Sign in with Google</span>
                    </button>
                    <p className="mt-2 text-center text-xs text-gray-500">
                        Supports 2-Step Verification
                    </p>
                </div>

                <div className="text-center">
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-blue-600 hover:text-blue-500">
                        Need an account? Register
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* --- VALIDATION TOOLS PANEL --- */}
      {/* This section is intended for internal validation/demo only. Remove before final production deployment. */}
      <div className="mt-8 p-4 bg-slate-100 border border-slate-300 rounded-lg max-w-md w-full relative group shadow-sm transition-all duration-300">
          <div className="absolute -top-3 left-4 bg-slate-500 text-white text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              Validation Tools
          </div>
          
          <div className="flex items-center justify-between mb-2 mt-2">
              <div className="flex items-center text-sm font-medium text-slate-700">
                  <Beaker className="w-4 h-4 mr-2 text-slate-500" />
                  Test Mode: {testMode ? <span className="text-green-600 font-bold ml-1">ON</span> : <span className="text-red-600 font-bold ml-1">OFF</span>}
              </div>
              <button 
                  type="button"
                  onClick={toggleTestMode}
                  disabled={isSwitchingMode}
                  className={`text-xs px-3 py-1.5 rounded border shadow-sm transition-colors flex items-center ${testMode ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}
              >
                  {isSwitchingMode ? (
                      <>
                        <Loader className="w-3 h-3 mr-1 animate-spin" /> Switching...
                      </>
                  ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {testMode ? 'Disable Mocks' : 'Enable Mocks'}
                      </>
                  )}
              </button>
          </div>

          {testMode && !isSwitchingMode && (
              <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-slate-500 mb-2 font-semibold">One-Click Credentials:</p>
                  <div className="grid grid-cols-3 gap-2">
                      <button 
                          type="button"
                          onClick={() => fillCreds('admin')}
                          className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded hover:bg-purple-50 hover:border-purple-200 transition-all text-xs font-medium text-slate-600 hover:text-purple-700 hover:shadow-sm"
                      >
                          <Shield className="w-4 h-4 mb-1" />
                          Admin
                      </button>
                      <button 
                          type="button"
                          onClick={() => fillCreds('sponsor')}
                          className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-200 transition-all text-xs font-medium text-slate-600 hover:text-blue-700 hover:shadow-sm"
                      >
                          <Building className="w-4 h-4 mb-1" />
                          Sponsor
                      </button>
                      <button 
                          type="button"
                          onClick={() => fillCreds('driver')}
                          className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded hover:bg-amber-50 hover:border-amber-200 transition-all text-xs font-medium text-slate-600 hover:text-amber-700 hover:shadow-sm"
                      >
                          <Truck className="w-4 h-4 mb-1" />
                          Driver
                      </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center pt-1">Populates form above. Click 'Sign in' to proceed.</p>
              </div>
          )}
      </div>
    </div>
  );
};