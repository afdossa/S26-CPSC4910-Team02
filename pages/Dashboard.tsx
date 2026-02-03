import React, { useState, useEffect } from 'react';
import { User, UserRole, DriverApplication, SponsorOrganization, PointTransaction } from '../types';
import { submitApplication, getDriverApplication, getSponsors, getTransactions, updateUserPreferences, getUserProfile, getCatalog, updateSponsorRules } from '../services/mockData';
import { triggerRedshiftArchive } from '../services/mysql';
import { getConfig, updateConfig, isTestMode } from '../services/config';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, AlertCircle, Building, Database, Server, Loader, CheckCircle, Power, Bell, Info, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const DriverDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [pendingApp, setPendingApp] = useState<DriverApplication | undefined>(undefined);
  const [sponsors, setSponsors] = useState<SponsorOrganization[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatalogItems, setNewCatalogItems] = useState(0);
  const [activeSponsor, setActiveSponsor] = useState<SponsorOrganization | undefined>(undefined);
  
  // Application Form State
  const [sponsorId, setSponsorId] = useState('');
  const [license, setLicense] = useState('');
  const [experience, setExperience] = useState(''); // Text state for better UX
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preference State
  const [alertsEnabled, setAlertsEnabled] = useState(user.preferences?.alertsEnabled ?? true);
  
  // Filter State
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'MANUAL' | 'PURCHASE'>('ALL');

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [app, spList, txList, freshUser, products] = await Promise.all([
                getDriverApplication(user.id),
                getSponsors(),
                getTransactions(), // In real app, filter by user.id
                getUserProfile(user.id),
                getCatalog()
            ]);
            setPendingApp(app);
            setSponsors(spList);
            setTransactions(txList);
            
            if (freshUser && freshUser.preferences) {
                setAlertsEnabled(freshUser.preferences.alertsEnabled);
            }
            if (spList.length > 0) setSponsorId(spList[0].id);

            // Find Active Sponsor
            if (freshUser?.sponsorId) {
                setActiveSponsor(spList.find(s => s.id === freshUser.sponsorId));
            }

            // Check for new products (last 7 days)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const newCount = products.filter(p => p.createdAt && new Date(p.createdAt) > oneWeekAgo).length;
            setNewCatalogItems(newCount);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [user.id, user.sponsorId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Convert experience string back to number for submission
    if (await submitApplication(user.id, sponsorId, { licenseNumber: license, experienceYears: Number(experience), reason })) {
       const app = await getDriverApplication(user.id);
       setPendingApp(app);
    } else {
       alert("Failed to submit application.");
    }
    setIsSubmitting(false);
  };

  const toggleAlerts = async () => {
    const newVal = !alertsEnabled;
    setAlertsEnabled(newVal);
    await updateUserPreferences(user.id, { alertsEnabled: newVal });
  };

  const filteredTransactions = transactions.filter(t => {
      if (historyFilter === 'ALL') return true;
      if (historyFilter === 'MANUAL') return t.type === 'MANUAL';
      if (historyFilter === 'PURCHASE') return t.type === 'PURCHASE';
      return true;
  });

  if (loading) return <div className="p-10 text-center">Loading dashboard data...</div>;

  // Case 1: No Sponsor AND No Pending Application -> Show Application Form
  if (!user.sponsorId && !pendingApp) {
      return (
          <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                  <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.fullName}!</h2>
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
                                  type="text" 
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  required 
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                  value={experience}
                                  onChange={(e) => {
                                      const val = e.target.value;
                                      if (/^\d*$/.test(val)) setExperience(val);
                                  }}
                                  placeholder="e.g. 5"
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
      : activeSponsor?.name;

  return (
    <div className="space-y-6">
      {/* Notifications */}
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

      {newCatalogItems > 0 && alertsEnabled && !isPending && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 flex justify-between items-start">
             <div className="flex">
                 <div className="flex-shrink-0">
                     <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                 </div>
                 <div className="ml-3">
                     <p className="text-sm text-blue-700">
                         <span className="font-bold">New Rewards Available!</span> {newCatalogItems} new items have been added to the catalog recently.
                     </p>
                     <Link to="/catalog" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 inline-block">View Catalog &rarr;</Link>
                 </div>
             </div>
             <button onClick={() => setNewCatalogItems(0)} className="text-blue-400 hover:text-blue-500">
                 <X className="w-5 h-5" />
             </button>
         </div>
      )}

      {/* Grid for Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Stats Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg col-span-1 lg:col-span-2">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheck className="h-10 w-10 text-green-500" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                        Current Points Balance
                        {!isPending && (user.pointsBalance || 0) > 1000 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Good Driver
                            </span>
                        )}
                    </dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-900">
                          {isPending ? 'N/A' : user.pointsBalance?.toLocaleString()}
                      </div>
                    </dd>
                    <dt className="text-xs text-gray-400 mt-1">Sponsor: {displaySponsorName} {isPending ? '(Pending)' : ''}</dt>
                  </dl>

                  {!isPending && (
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Reward Tier Progress</span>
                            <span>5,000 pts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(((user.pointsBalance || 0) / 5000) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                  )}
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

          {/* Preferences Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center mb-4">
                      <Bell className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="flex-grow flex flex-col">
                          <span className="text-sm font-medium text-gray-900">Point Change Alerts</span>
                          <span className="text-sm text-gray-500">Receive notifications when your points balance changes.</span>
                      </span>
                      <button
                          type="button"
                          onClick={toggleAlerts}
                          className={`${alertsEnabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          role="switch"
                          aria-checked={alertsEnabled}
                      >
                          <span aria-hidden="true" className={`${alertsEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                      </button>
                  </div>
              </div>
          </div>

          {/* Incentive Rules Card */}
          {!isPending && activeSponsor && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center mb-4">
                          <Info className="h-5 w-5 text-gray-400 mr-2" />
                          <h3 className="text-lg leading-6 font-medium text-gray-900">How to Earn Points</h3>
                      </div>
                      <div className="prose prose-sm text-gray-500">
                          {activeSponsor.incentiveRules && activeSponsor.incentiveRules.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1">
                                  {activeSponsor.incentiveRules.map((rule, idx) => (
                                      <li key={idx}>{rule}</li>
                                  ))}
                              </ul>
                          ) : (
                              <p>No specific rules listed by sponsor.</p>
                          )}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* History */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
          <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Point Activity</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest earnings and deductions.</p>
          </div>
          
          {/* History Filter */}
          {!isPending && (
              <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select 
                      value={historyFilter} 
                      onChange={(e) => setHistoryFilter(e.target.value as any)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  >
                      <option value="ALL">All Activity</option>
                      <option value="MANUAL">Manual Awards</option>
                      <option value="PURCHASE">Purchases</option>
                  </select>
              </div>
          )}
        </div>
        <ul className="divide-y divide-gray-200">
          {!isPending && filteredTransactions.map((t) => (
            <li key={t.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-blue-600 truncate">{t.reason}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{t.sponsorName}</span>
                        {/* Type Badge */}
                        {t.type && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                ${t.type === 'MANUAL' ? 'bg-purple-100 text-purple-800' : 
                                  t.type === 'PURCHASE' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                {t.type}
                            </span>
                        )}
                    </div>
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
          {(filteredTransactions.length === 0 || isPending) && (
              <li className="px-4 py-4 text-sm text-gray-500 text-center italic">
                  {isPending ? "Transaction history will be available after approval." : "No transactions found matching criteria."}
              </li>
          )}
        </ul>
      </div>
    </div>
  );
};

const SponsorDashboard: React.FC<{ user: User }> = ({ user }) => {
    // Basic Sponsor Logic to handle Rules
    const [sponsorOrg, setSponsorOrg] = useState<SponsorOrganization | undefined>(undefined);
    const [newRule, setNewRule] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
             const sp = await getSponsors();
             // Assume user is linked to s1 for demo or find by ID in real app
             setSponsorOrg(sp.find(s => s.id === 's1')); 
             setLoading(false);
        };
        load();
    }, []);

    const handleAddRule = async () => {
        if (!sponsorOrg || !newRule.trim()) return;
        const updatedRules = [...(sponsorOrg.incentiveRules || []), newRule];
        await updateSponsorRules(sponsorOrg.id, updatedRules);
        setSponsorOrg({...sponsorOrg, incentiveRules: updatedRules});
        setNewRule('');
    };

    const handleRemoveRule = async (idx: number) => {
        if (!sponsorOrg) return;
        const updatedRules = [...(sponsorOrg.incentiveRules || [])];
        updatedRules.splice(idx, 1);
        await updateSponsorRules(sponsorOrg.id, updatedRules);
        setSponsorOrg({...sponsorOrg, incentiveRules: updatedRules});
    };

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

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white shadow rounded-lg p-6">
                     <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                     <div className="flex flex-col space-y-3">
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
                 
                 {/* Rule Management */}
                 <div className="bg-white shadow rounded-lg p-6">
                     <h3 className="text-lg font-medium mb-4">Incentive Rules</h3>
                     <div className="space-y-4">
                         <div className="flex space-x-2">
                             <input 
                                type="text" 
                                value={newRule} 
                                onChange={e => setNewRule(e.target.value)}
                                placeholder="e.g. 50 pts for safe trip"
                                className="flex-1 border rounded px-3 py-2 text-sm"
                             />
                             <button onClick={handleAddRule} className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">Add</button>
                         </div>
                         <ul className="space-y-2 max-h-48 overflow-y-auto">
                             {sponsorOrg?.incentiveRules?.map((rule, i) => (
                                 <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                     <span>{rule}</span>
                                     <button onClick={() => handleRemoveRule(i)} className="text-red-500 hover:text-red-700 ml-2">
                                         <X className="w-4 h-4" />
                                     </button>
                                 </li>
                             ))}
                             {(!sponsorOrg?.incentiveRules || sponsorOrg.incentiveRules.length === 0) && (
                                 <li className="text-gray-400 italic text-sm">No rules defined. Drivers won't see how to earn points.</li>
                             )}
                         </ul>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [config, setConfig] = useState(getConfig());
    const [archiving, setArchiving] = useState(false);

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