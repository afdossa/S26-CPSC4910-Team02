import React, { useState } from 'react';
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

// Protected Route Component Wrapper
const ProtectedRoute = ({ user, children }: { user: User | null, children: React.ReactNode }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
                {user?.role === UserRole.DRIVER ? <Catalog /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute user={user}>
                {(user?.role === UserRole.ADMIN || user?.role === UserRole.SPONSOR) ? <Reports /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />

            {/* Sponsor Specific Routes */}
            <Route path="/sponsor/applications" element={
              <ProtectedRoute user={user}>
                {user?.role === UserRole.SPONSOR ? <SponsorApplications /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />
            
            <Route path="/sponsor/points" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorPoints /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />

            <Route path="/sponsor/catalog" element={
               <ProtectedRoute user={user}>
                 {user?.role === UserRole.SPONSOR ? <SponsorCatalog /> : <Navigate to="/dashboard" />}
               </ProtectedRoute>
            } />

            {/* Admin Specific Routes */}
            <Route path="/admin/sponsors" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.ADMIN ? <AdminSponsors /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute user={user}>
                 {user?.role === UserRole.ADMIN ? <AdminUserManagement /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } />

          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
            <p className="mt-1 text-center text-sm text-gray-400">
              &copy; 2026 Good Driver Incentive Program. Team 6.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;