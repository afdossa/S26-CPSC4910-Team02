import React, { useState, useEffect, PropsWithChildren } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { Reports } from './pages/Reports';
import { SponsorApplications } from './pages/SponsorApplications';
import { SponsorPoints } from './pages/SponsorPoints';
import { SponsorCatalog } from './pages/SponsorCatalog';
import { AdminSponsors } from './pages/AdminSponsors';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { User, UserRole } from './types';
import { authService } from './services/auth';
import { getUserProfile } from './services/mockData';
import { isTestMode, updateConfig } from './services/config';
import { AlertTriangle, Power } from 'lucide-react';

// Protected Route Component Wrapper
const ProtectedRoute = ({ user, children }: PropsWithChildren<{ user: User | null }>) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testModeActive, setTestModeActive] = useState(isTestMode());
  const [showFlash, setShowFlash] = useState(false);
  const [configVersion, setConfigVersion] = useState(0); // Used to trigger re-subscription to auth

  // Audio Context for Alarm
  const playTestModeAlarm = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // Sweep up

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    // Listener for test mode changes
    const handleConfigChange = () => {
        const active = isTestMode();
        setTestModeActive(active);
        
        // Increment version to force Auth Service re-bind in the other useEffect
        setConfigVersion(v => v + 1);
        // Clear current user when switching modes to avoid state pollution
        setUser(null); 
        setAuthLoading(true);

        if (active) {
            setShowFlash(true);
            playTestModeAlarm();
            setTimeout(() => setShowFlash(false), 3000);
        }
    };

    window.addEventListener('config-change', handleConfigChange);
    
    // Initial check
    if(isTestMode()) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
    }

    return () => window.removeEventListener('config-change', handleConfigChange);
  }, []);

  useEffect(() => {
      let isMounted = true;
      // Force loading to finish after 3 seconds in case Firebase hangs (due to bad keys)
      const safetyTimeout = setTimeout(() => {
          if (isMounted && authLoading) {
              console.warn("Auth check timed out - forcing Login screen. Check your API Keys.");
              setAuthLoading(false);
          }
      }, 3000);

      // Global Auth Listener (Facade)
      // This will re-run whenever `configVersion` changes, binding to either Real Firebase or Mock Auth
      console.log("Binding Auth Service Listener (Config Version: " + configVersion + ")");
      const unsubscribe = authService.onStateChange(async (firebaseUser) => {
          if (firebaseUser) {
              // User is signed in, fetch profile data
              try {
                const profile = await getUserProfile(firebaseUser.uid);
                if (profile) {
                    if (isMounted) setUser(profile);
                } else {
                    console.warn("Auth user found but no profile data:", firebaseUser.uid);
                    if (isMounted) setUser(null);
                }
              } catch (e) {
                  console.error("Error fetching profile", e);
                  if (isMounted) setUser(null);
              }
          } else {
              if (isMounted) setUser(null);
          }
          if (isMounted) setAuthLoading(false);
          clearTimeout(safetyTimeout);
      });

      return () => {
          isMounted = false;
          unsubscribe();
          clearTimeout(safetyTimeout);
      };
  }, [configVersion]); // Dependent on configVersion

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleExitTestMode = () => {
      if (window.confirm("Switch to Production Mode?\n\nThis will disable all mocks and attempt to connect to real AWS and Firebase services.")) {
          updateConfig({
              useMockAuth: false,
              useMockDB: false,
              useMockRedshift: false
          }, false); // No hard reload
      }
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm">Initializing Services...</p>
              {!testModeActive && (
                  <p className="text-xs text-red-400 mt-2">Connecting to Real Firebase...</p>
              )}
          </div>
      );
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${testModeActive ? 'border-4 border-red-600' : ''}`}>
        
        {/* Test Mode Flash Message */}
        {showFlash && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl flex items-center animate-bounce pointer-events-none">
                <AlertTriangle className="w-8 h-8 mr-3" />
                <div className="text-xl font-bold">TEST MODE ACTIVE: USING MOCK SERVICES</div>
            </div>
        )}

        {testModeActive && (
            <div className="bg-red-600 text-white text-xs px-4 py-1 flex justify-between items-center shadow-inner">
                <div className="font-bold flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    SYSTEM IN TEST MODE - DATA IS NOT SAVED TO AWS
                </div>
                <button 
                    onClick={handleExitTestMode}
                    className="flex items-center bg-white text-red-600 px-3 py-0.5 rounded text-xs font-bold hover:bg-gray-100 uppercase transition-colors shadow-sm"
                >
                    <Power className="w-3 h-3 mr-1" />
                    Exit Test Mode
                </button>
            </div>
        )}

        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              user ? <Navigate to="/dashboard" replace /> : 
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Drive Safe.</span>{' '}
                      <span className="block text-blue-600 xl:inline">Earn Rewards.</span>
                  </h1>
                  <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                      The industry standard for incentivizing trucking excellence. 
                      Drivers earn points for safety and efficiency, redeemable for real-world rewards.
                  </p>
                  <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                      <div className="rounded-md shadow">
                          <Link to="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                              Get Started
                          </Link>
                      </div>
                  </div>
              </div>
            } />
            
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/about" element={<About />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                <Dashboard user={user!} />
              </ProtectedRoute>
            } />

            <Route path="/catalog" element={
              <ProtectedRoute user={user}>
                {user?.role === UserRole.DRIVER ? <Catalog /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute user={user}>
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SPONSOR) ? <Reports /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            {/* Sponsor Specific Routes */}
            <Route path="/sponsor/applications" element={
              <ProtectedRoute user={user}>
                {user?.role === UserRole.SPONSOR ? <SponsorApplications /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/sponsor/points" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorPoints /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            <Route path="/sponsor/catalog" element={
               <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorCatalog /> : <Navigate to="/dashboard" replace />}
               </ProtectedRoute>
            } />

            {/* Admin Specific Routes */}
            <Route path="/admin/sponsors" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.ADMIN ? <AdminSponsors /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.ADMIN ? <AdminUserManagement /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
            <p className="mt-1 text-center text-sm text-gray-400">
              &copy; 2026 Good Driver Incentive Program. Team 6. AWS Powered.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;