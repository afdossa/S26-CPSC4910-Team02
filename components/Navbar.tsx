import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, Notification } from '../types';
import { Truck, LogOut, LayoutDashboard, ShoppingBag, FileBarChart, Info, User as UserIcon, Menu, X, Bell, Settings } from 'lucide-react';
import { authService } from '../services/auth';
import { getNotifications } from '../services/mockData';
import { SettingsModal } from './SettingsModal';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, isDark, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== UserRole.DRIVER) {
        setUnreadCount(0);
        return;
    }

    const fetchUnread = async () => {
        const notifs = await getNotifications(user.id);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
    };

    fetchUnread();
    
    // Simple event based refresh for badge
    const handleRefresh = () => fetchUnread();
    window.addEventListener('notification-added', handleRefresh);
    return () => window.removeEventListener('notification-added', handleRefresh);
  }, [user]);

  const handleLogout = () => {
      authService.logout().then(() => {
          onLogout();
          navigate('/login');
          setIsMobileMenuOpen(false);
      });
  };

  const isActive = (path: string, exact = true) => {
    const isMatched = exact ? location.pathname === path : location.pathname.startsWith(path);
    if (isMatched && path === '/dashboard' && location.search.includes('tab=notifications')) return 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400';
    return isMatched ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400';
  };
  
  const isNotificationActive = () => {
      return location.pathname === '/dashboard' && location.search.includes('tab=notifications') 
        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400';
  };

  const isMobileActive = (path: string) => {
      return location.pathname === path ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white';
  };

  return (
    <>
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 dark:text-white hidden sm:block">DriveWell</span>
            </Link>
            
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {user && (
                <Link to="/dashboard" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/dashboard')}`}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              )}
              
              {user?.role === UserRole.DRIVER && (
                <Link to="/dashboard?tab=notifications" className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${isNotificationActive()}`}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 h-4 w-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white dark:border-slate-800">
                          {unreadCount}
                      </span>
                  )}
                </Link>
              )}

              {user?.role === UserRole.DRIVER && (
                <Link to="/catalog" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/catalog')}`}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Catalog
                </Link>
              )}
              
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.SPONSOR) && (
                 <Link to="/reports" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/reports')}`}>
                 <FileBarChart className="w-4 h-4 mr-2" />
                 Reports
               </Link>
              )}

              <Link to="/about" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/about')}`}>
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Settings Gear - Always Visible */}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Application Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{user.fullName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{user.role}</span>
                  </div>
                  {user.role === UserRole.DRIVER && (
                    <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-bold border border-amber-200 dark:border-amber-700">
                      {user.pointsBalance?.toLocaleString()} pts
                    </div>
                  )}
                  <Link to="/profile" className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden border border-slate-300 dark:border-slate-500 hover:ring-2 hover:ring-blue-500 transition-all">
                    <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                 <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                   Login
                 </Link>
              )}
            </div>

            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700">
          <div className="pt-2 pb-3 space-y-1">
             {user ? (
                 <>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/dashboard')}`}>
                        Dashboard
                    </Link>
                    {user.role === UserRole.DRIVER && (
                      <Link to="/dashboard?tab=notifications" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center ${location.search.includes('tab=notifications') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        Notifications
                        {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 rounded-full">{unreadCount}</span>}
                      </Link>
                    )}
                    {user.role === UserRole.DRIVER && (
                      <Link to="/catalog" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/catalog')}`}>
                        Catalog
                      </Link>
                    )}
                    {(user.role === UserRole.ADMIN || user.role === UserRole.SPONSOR) && (
                        <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/reports')}`}>
                            Reports
                        </Link>
                    )}
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/profile')}`}>
                        My Profile
                    </Link>
                 </>
             ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/login')}`}>
                     Login
                  </Link>
             )}
             <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/about')}`}>
                 About
             </Link>
          </div>
          
          {user && (
            <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600" src={user.avatarUrl} alt="" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">{user.fullName}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {user.role === UserRole.DRIVER && (
                    <div className="block px-4 py-2 text-base font-medium text-amber-600 dark:text-amber-400">
                        {user.pointsBalance?.toLocaleString()} Points
                    </div>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
    
    <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isDark={isDark}
        toggleTheme={toggleTheme}
    />
    </>
  );
};