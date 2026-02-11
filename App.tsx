
import React, { useState, useEffect, PropsWithChildren, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import { SponsorApplications } from './pages/SponsorApplications';
import { SponsorPoints } from './pages/SponsorPoints';
import { SponsorCatalog } from './pages/SponsorCatalog';
import { AdminSponsors } from './pages/AdminSponsors';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AdminSettings } from './pages/AdminSettings';
import { User, UserRole, Product, CartItem } from './types';
import { authService } from './services/auth';
import { getUserProfile } from './services/mockData';
import { isTestMode, updateConfig } from './services/config';
import { AlertTriangle, Power } from 'lucide-react';

// Custom Home Component
const Home = ({ user }: { user: User | null }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl">
        <span className="block xl:inline">Drive Safe.</span>{' '}
        <span className="block text-blue-600 dark:text-blue-400 xl:inline">Earn Rewards.</span>
      </h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        The industry standard for incentivizing trucking excellence. 
      </p>
      <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
        <div className="rounded-md shadow">
          <Link to="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

// Protected Route Component Wrapper using declarative Navigate
const ProtectedRoute = ({ user, children }: PropsWithChildren<{ user: User | null }>) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testModeActive, setTestModeActive] = useState(isTestMode());
  const [showFlash, setShowFlash] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Theme Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  useEffect(() => {
    const handleConfigChange = () => {
      const active = isTestMode();
      setTestModeActive(active);
      if (active) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      }
    };

    window.addEventListener('config-change', handleConfigChange);
    
    if(isTestMode()) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    }

    return () => window.removeEventListener('config-change', handleConfigChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted && authLoading) {
        setAuthLoading(false);
      }
    }, 3000);

    const unsubscribe = authService.onStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (isMounted) setUser(profile || null);
        } catch (e) {
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
  }, [testModeActive]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = useCallback(() => {
    authService.logout().then(() => {
      setUser(null);
      clearCart();
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const TIMEOUT_MS = 15 * 60 * 1000;
    let timeoutId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, handleLogout]);

  const handleExitTestMode = () => {
    updateConfig({
      useMockAuth: false,
      useMockDB: false,
      useMockRedshift: false
    }); 
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Initializing Services...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${testModeActive ? 'border-4 border-red-600' : ''} dark:bg-slate-900 dark:text-slate-100`}>
        
        {showFlash && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl flex items-center animate-bounce pointer-events-none">
            <AlertTriangle className="w-8 h-8 mr-3" />
            <div className="text-xl font-bold">TEST MODE ACTIVE</div>
          </div>
        )}

        {testModeActive && (
          <div className="bg-red-600 text-white text-xs px-4 py-1 flex justify-between items-center shadow-inner">
            <div className="font-bold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              SYSTEM IN TEST MODE
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

        <Navbar user={user} onLogout={handleLogout} isDark={isDark} toggleTheme={toggleTheme} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
            />
            <Route path="/about" element={<About />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                <Dashboard user={user!} onUpdateUser={(u) => setUser(u)} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute user={user}>
                <Profile user={user!} onUpdate={(updated) => setUser(updated)} />
              </ProtectedRoute>
            } />

            <Route path="/chat" element={
              <ProtectedRoute user={user}>
                <Chat user={user!} />
              </ProtectedRoute>
            } />

            <Route path="/catalog" element={
              <ProtectedRoute user={user}>
                {user?.role === UserRole.DRIVER ? (
                  <Catalog 
                    user={user!} 
                    cart={cart}
                    addToCart={addToCart} 
                    updateQuantity={updateCartQuantity}
                    removeItem={removeFromCart}
                    clearCart={clearCart}
                    onPurchaseSuccess={(points) => {
                      if (user) setUser({ ...user, pointsBalance: (user.pointsBalance || 0) - points });
                    }}
                  />
                ) : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute user={user}>
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SPONSOR) ? <Reports /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            <Route path="/sponsor/applications" element={
              <ProtectedRoute user={user}>
                {user?.role === UserRole.SPONSOR ? <SponsorApplications /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/sponsor/points" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorPoints user={user!} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            <Route path="/sponsor/catalog" element={
               <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorCatalog /> : <Navigate to="/dashboard" replace />}
               </ProtectedRoute>
            } />

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

            <Route path="/admin/settings" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.ADMIN ? <AdminSettings /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
            <p className="mt-1 text-center text-base text-gray-400">&copy; 2026 DriveWell, Inc. - Team 2. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
