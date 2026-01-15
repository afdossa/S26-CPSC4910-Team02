import React from 'react';
import { User, UserRole } from '../types';
import { MOCK_TRANSACTIONS } from '../services/mockData';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const DriverDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Driver Stats Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheck className="h-10 w-10 text-green-500" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Current Points Balance</dt>
                <dd>
                  <div className="text-3xl font-bold text-gray-900">{user.pointsBalance?.toLocaleString()}</div>
                </dd>
              </dl>
            </div>
            <div className="ml-5">
                <Link to="/catalog" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Redeem Points
                </Link>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Point Activity</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest earnings and deductions.</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {MOCK_TRANSACTIONS.map((t) => (
            <li key={t.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-blue-600 truncate">{t.reason}</p>
                    <p className="text-xs text-gray-500">{t.sponsorName}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`flex items-center text-sm font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" />
                    {t.date}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SponsorDashboard: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div className="space-y-6">
             <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                 <h2 className="text-2xl font-bold text-gray-900 mb-4">Sponsor Overview: {user.fullName}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <h3 className="text-blue-800 font-semibold">Active Drivers</h3>
                         <p className="text-3xl font-bold text-blue-900 mt-2">124</p>
                     </div>
                     <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                         <h3 className="text-green-800 font-semibold">Pending Applications</h3>
                         <p className="text-3xl font-bold text-green-900 mt-2">3</p>
                     </div>
                     <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                         <h3 className="text-purple-800 font-semibold">Points Awarded (Month)</h3>
                         <p className="text-3xl font-bold text-purple-900 mt-2">45,000</p>
                     </div>
                 </div>
             </div>

             <div className="bg-white shadow rounded-lg p-6">
                 <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                 <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                     <Link to="/sponsor/applications" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center flex justify-center items-center">
                        Review Applications
                     </Link>
                     <Link to="/sponsor/points" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-center flex justify-center items-center">
                        Manage Driver Points
                     </Link>
                     <Link to="/sponsor/catalog" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-center flex justify-center items-center">
                        Edit Product Catalog
                     </Link>
                 </div>
             </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div className="space-y-6">
             <div className="bg-slate-800 text-white overflow-hidden shadow rounded-lg p-6">
                 <h2 className="text-2xl font-bold mb-2">System Administration</h2>
                 <p className="text-slate-300">Logged in as {user.username}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                     <div className="text-gray-500 text-sm font-medium">Total Sponsors</div>
                     <div className="text-2xl font-bold text-gray-900 mt-1">15</div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                     <div className="text-gray-500 text-sm font-medium">Total Drivers</div>
                     <div className="text-2xl font-bold text-gray-900 mt-1">1,204</div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
                     <div className="text-gray-500 text-sm font-medium">Total Sales (YTD)</div>
                     <div className="text-2xl font-bold text-gray-900 mt-1">$450k</div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                     <div className="text-gray-500 text-sm font-medium">System Alerts</div>
                     <div className="text-2xl font-bold text-gray-900 mt-1">2</div>
                 </div>
             </div>

             <div className="bg-white shadow rounded-lg">
                 <div className="px-6 py-4 border-b border-gray-200">
                     <h3 className="font-bold text-gray-800 flex items-center">
                         <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                         Critical Actions
                     </h3>
                 </div>
                 <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Link to="/admin/sponsors" className="text-left p-4 border rounded hover:bg-gray-50 block">
                         <div className="font-semibold text-gray-900">Create New Sponsor</div>
                         <div className="text-sm text-gray-500">Onboard a new organization to the platform.</div>
                     </Link>
                     <Link to="/admin/users" className="text-left p-4 border rounded hover:bg-gray-50 block">
                         <div className="font-semibold text-gray-900">Manage Account Requests</div>
                         <div className="text-sm text-gray-500">Approve or deny new user registrations.</div>
                     </Link>
                     <Link to="/reports?tab=audit" className="text-left p-4 border rounded hover:bg-gray-50 block">
                         <div className="font-semibold text-gray-900">System Logs</div>
                         <div className="text-sm text-gray-500">View detailed audit logs for security.</div>
                     </Link>
                 </div>
             </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {user.role === UserRole.DRIVER && <DriverDashboard user={user} />}
      {user.role === UserRole.SPONSOR && <SponsorDashboard user={user} />}
      {user.role === UserRole.ADMIN && <AdminDashboard user={user} />}
    </div>
  );
};