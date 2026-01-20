import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Truck, LogOut, LayoutDashboard, ShoppingBag, FileBarChart, Info, User as UserIcon } from 'lucide-react';
import { authService } from '../services/auth';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
      authService.logout().then(() => {
          onLogout();
          navigate('/login');
      });
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600';
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
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end hidden sm:block">
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
        </div>
      </div>
    </nav>
  );
};