
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DriverApplication, SponsorOrganization, PointTransaction, Notification, CartItem } from '../types';
import { submitApplication, getDriverApplication, getSponsors, getTransactions, updateUserPreferences, getUserProfile, getCatalog, updateSponsorRules, getNotifications, markNotificationAsRead } from '../services/mockData';
import { triggerRedshiftArchive } from '../services/mysql';
import { getConfig, updateConfig, isTestMode } from '../services/config';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, AlertCircle, Building, Database, Server, Loader, CheckCircle, Power, Bell, Info, Filter, X, DollarSign, RefreshCw, User as UserIcon, Receipt, Package, Inbox, Calendar, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const DriverDashboard: React.FC<{ user: User }> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications'>('overview');
  const [pendingApp, setPendingApp] = useState<DriverApplication | undefined>(undefined);
  const [sponsors, setSponsors] = useState<SponsorOrganization[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSponsor, setActiveSponsor] = useState<SponsorOrganization | undefined>(undefined);
  const [showAsDollars, setShowAsDollars] = useState(false);
  
  // Application Form State
  const [sponsorId, setSponsorId] = useState('');
  const [license, setLicense] = useState('');
  const [experience, setExperience] = useState(''); 
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preference State
  const [alertsEnabled, setAlertsEnabled] = useState(user.preferences?.alertsEnabled ?? true);
  
  // Filter State
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'MANUAL' | 'PURCHASE'>('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const [app, spList, txList, freshUser, products, notifList] = await Promise.all([
            getDriverApplication(user.id),
            getSponsors(),
            getTransactions(), 
            getUserProfile(user.id),
            getCatalog(),
            getNotifications(user.id)
        ]);
        setPendingApp(app);
        setSponsors(spList);
        setTransactions(txList);
        setNotifications(notifList);
        
        if (freshUser && freshUser.preferences) {
            setAlertsEnabled(freshUser.preferences.alertsEnabled);
        }
        if (spList.length > 0) setSponsorId(spList[0].id);

        if (freshUser?.sponsorId) {
            setActiveSponsor(spList.find(s => s.id === freshUser.sponsorId));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('notification-added', handleRefresh);
    return () => window.removeEventListener('notification-added', handleRefresh);
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'notifications') {
        setActiveTab('notifications');
    } else {
        setActiveTab('overview');
    }
  }, [location.search]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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

  const getPointsValueUSD = () => {
    const ratio = activeSponsor?.pointDollarRatio || 0.01;
    const value = (user.pointsBalance || 0) * ratio;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const handleReadNotification = async (id: string) => {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (loading) return <div className="p-10 text-center">Loading dashboard data...</div>;

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

  const isPending = !user.sponsorId && !!pendingApp;
  const displaySponsorName = isPending 
      ? sponsors.find(s => s.id === pendingApp?.sponsorId)?.name 
      : activeSponsor?.name;

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => { setActiveTab('overview'); navigate('/dashboard'); }}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Overview
          </button>
          <button 
            onClick={() => { setActiveTab('notifications'); navigate('/dashboard?tab=notifications'); }}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center ${activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 h-5 w-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                  </span>
              )}
          </button>
      </div>

      {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isPending && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <span className="font-bold">Application Pending:</span> Waiting for acceptance from <span className="font-bold">{displaySponsorName}</span>. 
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-2xl col-span-1 lg:col-span-2 border border-gray-100">
                    <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-50 p-3 rounded-2xl">
                                <ShieldCheck className="h-10 w-10 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5">
                                <dl>
                                    <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        Current Balance
                                    </dt>
                                    <dd>
                                        <div className="text-4xl font-black text-gray-900 flex items-center">
                                            {isPending ? 'N/A' : (
                                                showAsDollars ? (
                                                    <>
                                                        <DollarSign className="w-7 h-7 text-green-600 mr-1" />
                                                        {getPointsValueUSD().replace('$', '')}
                                                    </>
                                                ) : (
                                                    user.pointsBalance?.toLocaleString() + ' pts'
                                                )
                                            )}
                                        </div>
                                    </dd>
                                    <dt className="text-xs font-medium text-gray-500 mt-1">
                                        Sponsor: <span className="font-bold text-gray-700">{displaySponsorName}</span> {isPending ? '(Pending)' : ''}
                                    </dt>
                                </dl>
                            </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3 items-end">
                            {!isPending && (
                                <>
                                    <button 
                                        onClick={() => setShowAsDollars(!showAsDollars)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all hover:shadow-sm"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                        {showAsDollars ? 'View Points' : 'View Dollars'}
                                    </button>
                                    <Link 
                                        to="/catalog" 
                                        className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-black rounded-xl shadow-lg shadow-blue-100 text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        Redeem Points
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    </div>
                </div>

                {!isPending && activeSponsor && (
                    <div className="bg-white overflow-hidden shadow rounded-2xl border border-gray-100 lg:col-span-2">
                        <div className="px-6 py-5">
                            <div className="flex items-center mb-4">
                                <Info className="h-5 w-5 text-blue-500 mr-2" />
                                <h3 className="text-lg leading-6 font-bold text-gray-900">How to Earn Points</h3>
                            </div>
                            <div className="prose prose-sm text-gray-500">
                                {activeSponsor.incentiveRules && activeSponsor.incentiveRules.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeSponsor.incentiveRules.map((rule, idx) => (
                                            <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl text-gray-700 font-medium border border-transparent hover:border-blue-100 transition-colors">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                                                {rule}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="italic">No specific rules listed by sponsor.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-2xl border border-gray-100">
                <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-center bg-gray-50 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center">
                            <Receipt className="w-5 h-5 mr-2 text-gray-400" />
                            Recent Activity
                        </h3>
                    </div>
                    {!isPending && (
                        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select 
                                value={historyFilter} 
                                onChange={(e) => setHistoryFilter(e.target.value as any)}
                                className="text-xs font-bold border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-1 px-2"
                            >
                                <option value="ALL">All Activity</option>
                                <option value="MANUAL">Awards Only</option>
                                <option value="PURCHASE">Redemptions</option>
                            </select>
                        </div>
                    )}
                </div>
                <ul className="divide-y divide-gray-100">
                    {!isPending && filteredTransactions.map((t) => (
                        <li key={t.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-gray-900">{t.reason}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.sponsorName}</span>
                                        {t.type && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter
                                                ${t.type === 'MANUAL' ? 'bg-purple-100 text-purple-700' : 
                                                t.type === 'PURCHASE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {t.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`flex items-center text-sm font-black ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.amount > 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                    </div>
                                    <div className="flex items-center text-[10px] text-gray-400 font-bold mt-1">
                                        <Clock className="flex-shrink-0 mr-1 h-3 w-3" />
                                        {t.date}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(filteredTransactions.length === 0 || isPending) && (
                        <li className="px-4 py-12 text-sm text-gray-400 text-center italic">
                            No transactions recorded yet.
                        </li>
                    )}
                </ul>
            </div>
          </div>
      )}

      {activeTab === 'notifications' && (activeSponsor || isPending) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Preferences inside Notifications Tab */}
              <div className="bg-white shadow rounded-2xl overflow-hidden border border-blue-100 bg-blue-50/30">
                  <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                          <Settings className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notification Preferences</h3>
                              <p className="text-xs text-gray-500">Manage how you receive alerts about your points.</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-3">
                          <span className={`text-xs font-bold uppercase tracking-tighter ${alertsEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                              Point Change Alerts {alertsEnabled ? 'ON' : 'OFF'}
                          </span>
                          <button
                              type="button"
                              onClick={toggleAlerts}
                              className={`${alertsEnabled ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                              role="switch"
                              aria-checked={alertsEnabled}
                          >
                              <span aria-hidden="true" className={`${alertsEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                          </button>
                      </div>
                  </div>
              </div>

              <div className="bg-white shadow rounded-2xl overflow-hidden border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center text-gray-700 font-bold uppercase tracking-widest text-xs">
                          <Inbox className="w-4 h-4 mr-2 text-blue-500" />
                          Message Inbox
                      </div>
                      <span className="text-[10px] text-gray-400 font-black uppercase">{notifications.length} Total</span>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                      {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.isRead && handleReadNotification(n.id)}
                            className={`p-6 transition-colors cursor-pointer group hover:bg-gray-50 ${n.isRead ? 'opacity-80' : 'bg-white border-l-4 border-blue-500 shadow-sm'}`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                      {n.type === 'ORDER_CONFIRMATION' ? (
                                          <div className="bg-green-100 p-2 rounded-lg mr-3">
                                              <Receipt className="w-4 h-4 text-green-600" />
                                          </div>
                                      ) : n.type === 'POINT_CHANGE' ? (
                                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                              <TrendingUp className="w-4 h-4 text-blue-600" />
                                          </div>
                                      ) : (
                                          <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                              <Bell className="w-4 h-4 text-gray-600" />
                                          </div>
                                      )}
                                      <div>
                                          <h4 className={`text-sm font-bold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h4>
                                          <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                              <Calendar className="w-3 h-3 mr-1" />
                                              {new Date(n.date).toLocaleString()}
                                          </div>
                                      </div>
                                  </div>
                                  {!n.isRead && (
                                      <span className="h-2 w-2 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></span>
                                  )}
                              </div>
                              <p className="text-sm text-gray-600 ml-12">{n.message}</p>
                              
                              {n.type === 'ORDER_CONFIRMATION' && n.metadata?.orderSummary && (
                                  <div className="ml-12 mt-4 bg-gray-50 rounded-xl border border-gray-100 p-4">
                                      <div className="flex items-center mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                          <Package className="w-3 h-3 mr-1.5" />
                                          Order Snapshot
                                      </div>
                                      <div className="space-y-2">
                                          {n.metadata.orderSummary.items.map((item: CartItem, i: number) => (
                                              <div key={i} className="flex justify-between text-xs">
                                                  <span className="text-gray-600">
                                                      <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                                                  </span>
                                                  <span className="font-mono text-gray-400">{(item.pricePoints * item.quantity).toLocaleString()} pts</span>
                                              </div>
                                          ))}
                                          <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                              <span className="text-xs font-bold text-gray-900">Total Points Spent</span>
                                              <span className="text-sm font-black text-green-600">{n.metadata.orderSummary.total.toLocaleString()} PTS</span>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                      {notifications.length === 0 && (
                          <div className="p-20 text-center text-gray-400">
                              <Inbox className="w-16 h-16 mx-auto mb-4 opacity-10" />
                              <p className="text-lg font-black uppercase tracking-widest">All caught up!</p>
                              <p className="text-sm">You have no notifications at this time.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const SponsorDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [sponsorOrg, setSponsorOrg] = useState<SponsorOrganization | undefined>(undefined);
    const [newRule, setNewRule] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
             const sp = await getSponsors();
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
                 
                 <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isTestMode() ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="font-bold text-sm tracking-wider">{isTestMode() ? 'TEST MODE' : 'PRODUCTION'}</span>
                 </div>
             </div>

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
