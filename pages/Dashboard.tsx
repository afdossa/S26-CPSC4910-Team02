import React, { useState, useEffect } from 'react';
import { User, UserRole, DriverApplication, SponsorOrganization, PointTransaction } from '../types';
import { submitApplication, getDriverApplication, getSponsors, getTransactions } from '../services/mockData';
import { triggerRedshiftArchive } from '../services/mysql';
import { getConfig, updateConfig, isTestMode } from '../services/config';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, AlertCircle, Building, Database, Server, Loader, CheckCircle, Power } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const DriverDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [pendingApp, setPendingApp] = useState<DriverApplication | undefined>(undefined);
  const [sponsors, setSponsors] = useState<SponsorOrganization[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Application Form State
  const [sponsorId, setSponsorId] = useState('');
  const [license, setLicense] = useState('');
  const [experience, setExperience] = useState(''); // Changed to string to allow empty initial state
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [app, spList, txList] = await Promise.all([
                getDriverApplication(user.id),
                getSponsors(),
                getTransactions() // In real app, filter by user.id
            ]);
            setPendingApp(app);
            setSponsors(spList);
            setTransactions(txList);
            if (spList.length > 0) setSponsorId(spList[0].id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [user.id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Convert experience string back to number for submission
    if (await submitApplication(user.id, sponsorId, { licenseNumber: license, experienceYears: Number(experience), reason })) {
       const app = await getDriverApplication(user.id);
       setPendingApp(app);
       // Removed alert to provide smoother continuity to dashboard view
    } else {
       alert("Failed to submit application.");
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-10 text-center">Loading dashboard data...</div>;

  // Case 1: No Sponsor AND No Pending Application -> Show Application Form
  if (!user.sponsorId && !pendingApp) {
      return (
          <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                  <div className="text-center mb-8">
                      <h2 className="text-3xl font-extrabold text-gray-900">Welcome, {user.fullName}!</h2>
                      <p className="mt-2 text-lg text-gray-600">To start earning points, you need to join a Sponsor Organization.</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                          <Building className="w-5 h-5 mr-2" /> Apply to a Sponsor
                      </h3>
                      <form onSubmit={handleApply} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Select Sponsor</label>
                              <select
                                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white border"
                                  value={sponsorId}
                                  onChange={(e) => setSponsorId(e.target.value)}
                              >
                                  {sponsors.map(s => (
                                      <option key={s.id} value={s.id}>{s.name} (Ratio: {s.pointDollarRatio})</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">CDL License Number</label>
                              <input 
                                  type="text" required 
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                  value={license}
                                  onChange={(e) => setLicense(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                              <input 
                                  type="number" required min="0"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                  value={experience}
                                  onChange={(e) => setExperience(e.target.value)}
                              />
                          </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700">Why do you want to join us?</label>
                              <textarea 
                                  required
                                  rows={3}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                              />
                          </div>
                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                              {isSubmitting ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                                </>
                              ) : 'Submit Application'}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      );
  }

  // Case 2: Show Dashboard (Active or Pending)
  const isPending = !user.sponsorId && !!pendingApp;
  const displaySponsorName = isPending 
      ? sponsors.find(s => s.id === pendingApp?.sponsorId)?.name 
      : sponsors.find(s => s.id === user.sponsorId)?.name;

  return (
    <div className="space-y-6">
      {isPending && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                          <span className="font-bold">Application Pending:</span> Waiting for acceptance from <span className="font-bold">{displaySponsorName}</span>. 
                          <br/>
                          You will be notified once you are confirmed. Your dashboard features are currently in preview mode.
                      </p>
                  </div>
              </div>
          </div>
      )}

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
                  <div className="text-3xl font-bold text-gray-900">
                      {isPending ? 'N/A' : user.pointsBalance?.toLocaleString()}
                  </div>
                </dd>
                <dt className="text-xs text-gray-400 mt-1">Sponsor: {displaySponsorName} {isPending ? '(Pending)' : ''}</dt>
              </dl>
            </div>
            <div className="ml-5">
                {isPending ? (
                    <button disabled className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                        Redeem Points
                    </button>
                ) : (
                    <Link to="/catalog" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Redeem Points
                    </Link>
                )}
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
          {!isPending && transactions.map((t) => (
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
          {(transactions.length === 0 || isPending) && (
              <li className="px-4 py-4 text-sm text-gray-500 text-center italic">
                  {isPending ? "Transaction history will be available after approval." : "No transaction history."}
              </li>
          )}
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
    const [config, setConfig] = useState(getConfig());
    const [archiving, setArchiving] = useState(false);

    // Sync config state if it changes externally (e.g. from About page or Master Toggle)
    useEffect(() => {
        const handleConfigChange = () => setConfig(getConfig());
        window.addEventListener('config-change', handleConfigChange);
        return () => window.removeEventListener('config-change', handleConfigChange);
    }, []);

    const toggleService = (key: keyof typeof config) => {
        const newVal = !config[key];
        updateConfig({ [key]: newVal });
    };

    const isMasterTestMode = config.useMockAuth || config.useMockDB || config.useMockRedshift;

    const toggleMaster = () => {
        const newState = !isMasterTestMode;
        updateConfig({
            useMockAuth: newState,
            useMockDB: newState,
            useMockRedshift: newState
        });
    };

    const handleArchive = async () => {
        if (!confirm("Are you sure? This triggers the ETL pipeline.")) return;
        setArchiving(true);
        const success = await triggerRedshiftArchive();
        if(success) alert("Archive job started successfully.");
        else alert("Failed to trigger archive job.");
        setArchiving(false);
    };

    const StatusBadge = ({ active, mockName, realName }: { active: boolean, mockName: string, realName: string }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {active ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            {active ? `MOCK (${mockName})` : `LIVE (${realName})`}
        </span>
    );

    return (
        <div className="space-y-6">
             <div className="bg-slate-800 text-white overflow-hidden shadow rounded-lg p-6 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-bold mb-2">System Administration</h2>
                    <p className="text-slate-300">Logged in as {user.username}</p>
                 </div>
                 
                 <div className="flex flex-col items-end">
                     <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${isTestMode() ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="font-bold text-sm tracking-wider">{isTestMode() ? 'TEST MODE' : 'PRODUCTION'}</span>
                     </div>
                 </div>
             </div>

             {/* Service Control Panel */}
             <div className="bg-white shadow rounded-lg p-6 border-t-4 border-indigo-500">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                     <Server className="w-5 h-5 mr-2 text-indigo-500" />
                     Service Control Panel
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     
                     {/* Master Test Mode Control */}
                     <div className={`border rounded-lg p-4 ${isMasterTestMode ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-gray-700">Test Mode</h4>
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isMasterTestMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {isMasterTestMode ? 'ACTIVE' : 'INACTIVE'}
                             </span>
                         </div>
                         <p className="text-xs text-gray-500 mb-4">Master switch to toggle all services between Live and Mock.</p>
                         <button 
                            onClick={toggleMaster}
                            className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${isMasterTestMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                         >
                             <div className="flex items-center justify-center">
                                <Power className="w-4 h-4 mr-2" />
                                {isMasterTestMode ? 'Switch All to LIVE' : 'Switch All to MOCK'}
                             </div>
                         </button>
                     </div>

                     {/* Auth Control */}
                     <div className="border rounded-lg p-4 bg-gray-50">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-gray-700">Authentication</h4>
                             <StatusBadge active={config.useMockAuth} mockName="Local" realName="Firebase" />
                         </div>
                         <p className="text-xs text-gray-500 mb-4">Toggle between simulated auth and Google Firebase.</p>
                         <button 
                            onClick={() => toggleService('useMockAuth')}
                            className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${config.useMockAuth ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                         >
                             {config.useMockAuth ? 'Enable Live Firebase' : 'Switch to Mock Auth'}
                         </button>
                     </div>

                     {/* Database Control */}
                     <div className="border rounded-lg p-4 bg-gray-50">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-gray-700">Database</h4>
                             <StatusBadge active={config.useMockDB} mockName="LocalStorage" realName="AWS RDS" />
                         </div>
                         <p className="text-xs text-gray-500 mb-4">Toggle between local browser storage and AWS MySQL.</p>
                         <button 
                            onClick={() => toggleService('useMockDB')}
                            className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${config.useMockDB ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                         >
                             {config.useMockDB ? 'Enable Live MySQL' : 'Switch to Mock DB'}
                         </button>
                     </div>

                     {/* Analytics Control */}
                     <div className="border rounded-lg p-4 bg-gray-50">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-gray-700">Warehouse</h4>
                             <StatusBadge active={config.useMockRedshift} mockName="No-Op" realName="Redshift" />
                         </div>
                         <p className="text-xs text-gray-500 mb-4">Toggle between simulated ETL latency and real AWS Glue triggers.</p>
                         <button 
                            onClick={() => toggleService('useMockRedshift')}
                            className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${config.useMockRedshift ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                         >
                             {config.useMockRedshift ? 'Enable Live Redshift' : 'Switch to Mock ETL'}
                         </button>
                     </div>
                 </div>
             </div>

             {/* Redshift Archive Control (Manual Trigger) */}
             <div className="bg-indigo-900 rounded-lg p-4 text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center">
                    <Database className="w-8 h-8 mr-4 text-indigo-300" />
                    <div>
                        <h3 className="font-bold text-lg">Data Warehousing</h3>
                        <p className="text-indigo-200 text-sm">Manually trigger archival pipeline.</p>
                    </div>
                </div>
                <button 
                    onClick={handleArchive}
                    disabled={archiving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors disabled:opacity-50"
                >
                    {archiving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
                    {archiving ? 'Archiving...' : 'Archive to Redshift'}
                </button>
             </div>

             {/* Quick Stats & Alerts */}
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
                         <div className="font-semibold text-gray-900">Manage Users</div>
                         <div className="text-sm text-gray-500">Manually create or manage accounts.</div>
                     </Link>
                     <Link to="/reports?tab=audit" className="text-left p-4 border rounded hover:bg-gray-50 block">
                         <div className="font-semibold text-gray-900">System Logs</div>
                         <div className="text-sm text-gray-500">View detailed audit logs for security.</div>
                     </Link>
                 </div>
             </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    switch (user.role) {
        case UserRole.DRIVER:
            return <DriverDashboard user={user} />;
        case UserRole.SPONSOR:
            return <SponsorDashboard user={user} />;
        case UserRole.ADMIN:
            return <AdminDashboard user={user} />;
        default:
            return <div className="p-10 text-center text-red-600">Error: Unknown User Role ({user.role})</div>;
    }
};
