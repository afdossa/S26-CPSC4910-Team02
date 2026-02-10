
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { createProfile, getUserProfile, getAllUsers } from '../services/mockData';
import { authService } from '../services/auth';
import { isTestMode } from '../services/config';
import { Lock, UserPlus, Shield, Building, Truck, Loader, Mail, AtSign } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const GoogleIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const processLoginSuccess = async (uid: string, googleDetails?: { email: string, name: string }) => {
        try {
            const profile = await getUserProfile(uid);

            if (profile) {
                onLogin(profile);
                // Removed navigate('/dashboard') - App.tsx handles this via declarative routing
                return;
            }

            if (googleDetails) {
                setLoading(true);
                const allUsers = await getAllUsers();
                const roleToAssign = allUsers.length === 0 ? UserRole.ADMIN : UserRole.DRIVER;
                
                const baseName = googleDetails.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const autoUsername = `${baseName}_${Math.floor(Math.random() * 10000)}`;

                const success = await createProfile(uid, autoUsername, googleDetails.name, roleToAssign, {
                    email: googleDetails.email,
                    phone: '',
                    address: ''
                });

                if (success) {
                    const newProfile = await getUserProfile(uid);
                    if (newProfile) {
                        onLogin(newProfile);
                    }
                } else {
                    setError("Could not auto-create profile. Please register manually.");
                    setIsRegistering(true);
                    setRegEmail(googleDetails.email);
                    setRegFullName(googleDetails.name);
                }
            } else {
                setError("Account authenticated, but profile not found. Please register.");
            }
        } catch (e: any) {
            setError("Login Error: " + e.message);
        } finally {
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
        setError(err.message || "Invalid credentials");
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
          setError("Google Sign-In failed: " + err.message);
          setLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
          const userCredential = await authService.signUp(regEmail, regPassword);
          const allUsers = await getAllUsers();
          const roleToAssign = allUsers.length === 0 ? UserRole.ADMIN : UserRole.DRIVER;

          await createProfile(userCredential.user.uid, regUsername, regFullName, roleToAssign, {
              email: regEmail,
              phone: '',
              address: ''
          });
          
          const profile = await getUserProfile(userCredential.user.uid);
          if (profile) {
              onLogin(profile);
          }
      } catch (err: any) {
          setError("Registration failed: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const fillCreds = (type: 'admin' | 'sponsor' | 'driver') => {
      setIsRegistering(false);
      setPassword('password');
      if (type === 'admin') setEmail('admin@system.com');
      else if (type === 'sponsor') setEmail('alice@fastlane.com');
      else if (type === 'driver') setEmail('john.trucker@example.com');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700">
        <div className="text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isRegistering ? 'Join the fleet of elite drivers' : 'Sign in to access your rewards and points'}
          </p>
        </div>

        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 dark:text-red-400 font-medium">
                {error}
            </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? (
            <>
                <div className="space-y-4">
                    <div className="relative">
                        <AtSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Username"
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Email address"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="text" required value={regFullName} onChange={(e) => setRegFullName(e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Full Name"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Password"
                        />
                    </div>
                </div>
            </>
          ) : (
            <div className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Password"
                    />
                </div>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : (isRegistering ? <UserPlus className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />)}
            {isRegistering ? 'Register Now' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-800 text-gray-500">Or continue with</span></div>
          </div>
          <button
            onClick={handleGoogleLogin} disabled={loading}
            className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon /> Google
          </button>
        </div>

        <div className="text-center">
            <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-bold text-blue-600 hover:text-blue-500"
            >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
        </div>

        {isTestMode() && !isRegistering && (
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-2">Test Credentials</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => fillCreds('driver')} className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-blue-50 transition-colors">
                        <Truck className="w-4 h-4 text-blue-600 mb-1" />
                        <span className="text-[8px] font-bold">DRIVER</span>
                    </button>
                    <button onClick={() => fillCreds('sponsor')} className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-blue-50 transition-colors">
                        <Building className="w-4 h-4 text-indigo-600 mb-1" />
                        <span className="text-[8px] font-bold">SPONSOR</span>
                    </button>
                    <button onClick={() => fillCreds('admin')} className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-blue-50 transition-colors">
                        <Shield className="w-4 h-4 text-purple-600 mb-1" />
                        <span className="text-[8px] font-bold">ADMIN</span>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
