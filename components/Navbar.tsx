import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Truck, LogOut, LayoutDashboard, ShoppingBag, FileBarChart, Info, User as UserIcon, Menu, X } from 'lucide-react';
import { authService } from '../services/auth';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
      authService.logout().then(() => {
          onLogout();
          navigate('/login');
          setIsMobileMenuOpen(false);
      });
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600';
  };
  
  const isMobileActive = (path: string) => {
      return location.pathname === path ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 hidden sm:block">DriveWell</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {user && (
                <Link to="/dashboard" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/dashboard')}`}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              )}
              
              {/* Role Based Links */}
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

          <div className="flex items-center">
             {/* Desktop User Info */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900">{user.fullName}</span>
                    <span className="text-xs text-slate-500">{user.role}</span>
                  </div>
                  {user.role === UserRole.DRIVER && (
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold border border-amber-200">
                      {user.pointsBalance?.toLocaleString()} pts
                    </div>
                  )}
                  <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                    <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                 <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                   Login
                 </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
             {user ? (
                 <>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isMobileActive('/dashboard')}`}>
                        Dashboard
                    </Link>
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
            <div className="pt-4 pb-4 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img className="h-10 w-10 rounded-full bg-gray-200" src={user.avatarUrl} alt="" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.fullName}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {user.role === UserRole.DRIVER && (
                    <div className="block px-4 py-2 text-base font-medium text-amber-600">
                        {user.pointsBalance?.toLocaleString()} Points
                    </div>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};