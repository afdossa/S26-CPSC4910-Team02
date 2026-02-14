
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DriverApplication, SponsorOrganization, PointTransaction, Notification, CartItem } from '../types';
import { submitApplication, getDriverApplication, getSponsors, getTransactions, updateUserPreferences, getUserProfile, getCatalog, updateSponsorRules, getNotifications, markNotificationAsRead, getAllUsers, handleRefund } from '../services/mockData';
import { triggerRedshiftArchive } from '../services/mysql';
import { getConfig, updateConfig, isTestMode } from '../services/config';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, AlertCircle, Building, Database, Server, Loader, CheckCircle, Power, Bell, Info, Filter, X, DollarSign, RefreshCw, User as UserIcon, Receipt, Package, Inbox, Calendar, Settings, Globe, Download, Activity, Award, BarChart3, Truck, Undo2, Users, Check } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

const StatusBadge = ({ active, mockName, realName }: { active: boolean, mockName: string, realName: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}`}>
        {active ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
        {active ? `MOCK (${mockName})` : `LIVE (${realName})`}
    </span>
);

const DriverDashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {
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
  
  // Scoped variables for Driver View
  const isPending = !!pendingApp && pendingApp.status === 'PENDING';
  const displaySponsorName = isPending 
    ? (sponsors.find(s => s.id === pendingApp?.sponsorId)?.name || 'Sponsor')
    : (activeSponsor?.name || 'Sponsor');

  // Application Form State
  const [sponsorId, setSponsorId] = useState('');
  const [license, setLicense] = useState('');
  const [experience, setExperience] = useState(''); 
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preference State
  const [alertsEnabled, setAlertsEnabled] = useState(user.preferences?.alertsEnabled ?? true);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(user.preferences?.orderAlertsEnabled ?? true);
  
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
        setTransactions(txList.filter(t => t.driverId === user.id));
        setNotifications(notifList);
        
        if (freshUser && freshUser.preferences) {
            setAlertsEnabled(freshUser.preferences.alertsEnabled);
            setOrderAlertsEnabled(freshUser.preferences.orderAlertsEnabled ?? true);
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
    if (onUpdateUser) {
        const fresh = await getUserProfile(user.id);
        if (fresh) onUpdateUser(fresh);
    }
  };

  const toggleOrderAlerts = async () => {
    const newVal = !orderAlertsEnabled;
    setOrderAlertsEnabled(newVal);
    await updateUserPreferences(user.id, { orderAlertsEnabled: newVal });
    if (onUpdateUser) {
        const fresh = await getUserProfile(user.id);
        if (fresh) onUpdateUser(fresh);
    }
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

  const downloadHistoryCSV = () => {
      if (transactions.length === 0) {
          alert("No transaction history to export.");
          return;
      }
      const headers = ['Date', 'Type', 'Sponsor', 'Reason', 'Amount'];
      const rows = transactions.map(t => [t.date, t.type || 'UNKNOWN', `"${t.sponsorName.replace(/"/g, '""')}"`, `"${t.reason.replace(/"/g, '""')}"`, t.amount.toString()]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `history_${user.username}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const stats = (() => {
      const positiveTx = transactions.filter(t => t.amount > 0);
      const totalEarned = positiveTx.reduce((acc, t) => acc + t.amount, 0);
      const months = new Set(positiveTx.map(t => t.date.substring(0, 7)));
      const uniqueMonths = months.size;
      const avgMonthly = uniqueMonths > 0 ? Math.round(totalEarned / uniqueMonths) : 0;
      return { totalEarned, avgMonthly, uniqueMonths };
  })();

  if (loading) return <div className="p-10 text-center dark:text-gray-300">Loading dashboard data...</div>;

  if (!user.sponsorId && !pendingApp) {
      return (
          <div className="max-w-2xl mx-auto py-8 px-4">
              <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                  <div className="text-center mb-8">
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Welcome, {user.fullName}!</h2>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">Join a sponsor to start earning safety rewards.</p>
                  </div>
                  <form onSubmit={handleApply} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Select Sponsor</label>
                            <select className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)}>
                                {sponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <input type="text" required value={license} onChange={(e) => setLicense(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white" placeholder="CDL License #" />
                        <input type="number" required value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white" placeholder="Years Experience" />
                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white" rows={3} placeholder="Why join us?" />
                        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
                            {isSubmitting ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Application'}
                        </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button onClick={() => { setActiveTab('overview'); navigate('/dashboard'); }} className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'}`}>Overview</button>
          <button onClick={() => { setActiveTab('notifications'); navigate('/dashboard?tab=notifications'); }} className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${activeTab === 'notifications' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'}`}>Notifications {notifications.filter(n => !n.isRead).length > 0 && <span className="ml-2 h-4 w-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full">{notifications.filter(n => !n.isRead).length}</span>}</button>
      </div>

      {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isPending && <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-xl flex items-center"><Clock className="h-5 w-5 text-yellow-400 mr-3" /><p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Application to {displaySponsorName} is currently pending review.</p></div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-6 border border-gray-100 dark:border-slate-700 lg:col-span-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl mr-5"><ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-400" /></div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Point Balance</h4>
                                <div className="text-4xl font-black text-gray-900 dark:text-white flex items-center">
                                    {isPending ? '---' : (showAsDollars ? <><DollarSign className="w-7 h-7 text-green-600 mr-1" />{getPointsValueUSD().replace('$', '')}</> : <>{user.pointsBalance?.toLocaleString()} <span className="text-sm text-gray-400 ml-1">PTS</span></>)}
                                </div>
                                <p className="text-xs font-bold text-gray-500 mt-1">Org: {displaySponsorName}</p>
                            </div>
                        </div>
                        {!isPending && (
                            <div className="flex flex-col sm:items-end gap-3">
                                <button onClick={() => setShowAsDollars(!showAsDollars)} className="text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:shadow-sm flex items-center"><RefreshCw className="w-3 h-3 mr-2" /> {showAsDollars ? 'View Points' : 'View Dollars'}</button>
                                <Link to="/catalog" className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95">Redeem Rewards</Link>
                            </div>
                        )}
                    </div>
                </div>

                {!isPending && (
                    <div className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                        <div className="flex items-center mb-4"><Activity className="h-5 w-5 text-indigo-500 mr-2" /><h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Earnings Insights</h3></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50"><div className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Avg / Month</div><div className="text-xl font-black text-indigo-900 dark:text-indigo-100">{stats.avgMonthly.toLocaleString()}</div></div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50"><div className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-1">Total Career</div><div className="text-xl font-black text-emerald-900 dark:text-emerald-100">{stats.totalEarned.toLocaleString()}</div></div>
                        </div>
                    </div>
                )}
                
                {!isPending && activeSponsor && (
                    <div className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                        <div className="flex items-center mb-4"><Info className="h-5 w-5 text-blue-500 mr-2" /><h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Incentive Guide</h3></div>
                        <ul className="space-y-2">
                            {(activeSponsor.incentiveRules || []).map((r, i) => <li key={i} className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-start"><div className="h-1.5 w-1.5 rounded-full bg-blue-400 mr-2 mt-1 shrink-0" />{r}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/30 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center"><Receipt className="w-5 h-5 mr-2 text-gray-400" />Activity Ledger</h3>
                    {!isPending && <div className="flex items-center gap-3"><button onClick={downloadHistoryCSV} className="text-[10px] font-black uppercase flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-white"><Download className="w-3.5 h-3.5 mr-1" /> Export</button><select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as any)} className="text-[10px] font-black uppercase px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"><option value="ALL">All</option><option value="MANUAL">Awards</option><option value="PURCHASE">Rewards</option></select></div>}
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                    {filteredTransactions.map(t => (
                        <li key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-bold truncate ${t.amount < 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{t.reason}</p>
                                    {t.status && t.status !== 'COMPLETED' && <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-100 text-amber-700">{t.status.replace('_', ' ')}</span>}
                                </div>
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider mt-0.5">{t.date} • {t.sponsorName}</p>
                            </div>
                            <div className="ml-4 flex flex-col items-end shrink-0">
                                <div className={`text-sm font-black ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}</div>
                                <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded mt-1 ${t.type === 'PURCHASE' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{t.type}</span>
                            </div>
                        </li>
                    ))}
                    {filteredTransactions.length === 0 && <li className="p-12 text-center text-gray-400 italic text-sm">No activity recorded.</li>}
                </ul>
            </div>
          </div>
      )}

      {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4"><div className="flex items-center"><Settings className="h-5 w-5 text-blue-500 mr-2" /><div><h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Alert Settings</h3><p className="text-xs text-gray-500">How you receive updates.</p></div></div></div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><div className="flex items-center"><TrendingUp className="w-4 h-4 text-blue-600 mr-2" /><span className="text-xs font-bold dark:text-gray-200">Point Changes</span></div><button onClick={toggleAlerts} className={`${alertsEnabled ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-5 w-10 items-center rounded-full transition-colors`}><span className={`${alertsEnabled ? 'translate-x-5' : 'translate-x-1'} h-3 w-3 rounded-full bg-white transition-transform`} /></button></div>
                    <div className="flex items-center justify-between"><div className="flex items-center"><Receipt className="w-4 h-4 text-green-600 mr-2" /><span className="text-xs font-bold dark:text-gray-200">Order Alerts</span></div><button onClick={toggleOrderAlerts} className={`${orderAlertsEnabled ? 'bg-green-600' : 'bg-gray-300'} relative inline-flex h-5 w-10 items-center rounded-full transition-colors`}><span className={`${orderAlertsEnabled ? 'translate-x-5' : 'translate-x-1'} h-3 w-3 rounded-full bg-white transition-transform`} /></button></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
                {notifications.map(n => (
                    <div key={n.id} onClick={() => !n.isRead && handleReadNotification(n.id)} className={`p-6 flex items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${!n.isRead ? 'bg-white border-l-4 border-blue-500' : 'opacity-70'}`}>
                        <div className={`p-2 rounded-xl mr-4 ${n.type === 'POINT_CHANGE' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}><Bell className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">{n.title} {!n.isRead && <span className="h-2 w-2 bg-blue-500 rounded-full" />}</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                            <span className="text-[9px] font-black uppercase text-gray-400 mt-2 block">{new Date(n.date).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && <div className="p-20 text-center text-gray-400 italic">No notifications yet.</div>}
              </div>
          </div>
      )}
    </div>
  );
};

const SponsorDashboard: React.FC<DashboardProps> = ({ user }) => {
    const [sponsorOrg, setSponsorOrg] = useState<SponsorOrganization | undefined>(undefined);
    const [newRule, setNewRule] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingRefunds, setPendingRefunds] = useState<PointTransaction[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [sp, txs] = await Promise.all([getSponsors(), getTransactions()]);
        setSponsorOrg(sp.find(s => s.id === user.sponsorId));
        setPendingRefunds(txs.filter(t => t.status === 'REFUND_PENDING' && t.sponsorName === sp.find(s => s.id === user.sponsorId)?.name));
        setLoading(false);
    }, [user.sponsorId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefundAction = async (txId: string, approved: boolean) => {
        setProcessingId(txId);
        try {
            const success = await handleRefund(txId, approved, user.fullName);
            if (success) {
                await loadData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingId(null);
        }
    };

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
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
             <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                 <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-6">Org Overview: {sponsorOrg?.name || user.fullName}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900"><h3 className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-widest mb-2">Fleet Drivers</h3><p className="text-3xl font-black text-blue-900 dark:text-blue-100">124</p></div>
                     <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900"><h3 className="text-[10px] font-black uppercase text-green-800 dark:text-green-300 tracking-widest mb-2">Queue (Apps)</h3><p className="text-3xl font-black text-green-900 dark:text-green-100">3</p></div>
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900"><h3 className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 tracking-widest mb-2">Month Issuance</h3><p className="text-3xl font-black text-purple-900 dark:text-purple-100">45k</p></div>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Action Panel */}
                 <div className="space-y-6">
                     <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                         <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-4">Operations</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <Link to="/sponsor/drivers" className="py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 text-center transition-all flex items-center justify-center">
                                <Users className="w-4 h-4 mr-2" /> Manage Fleet
                             </Link>
                             <Link to="/sponsor/applications" className="py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black text-center transition-all">Review Apps</Link>
                             <Link to="/sponsor/points" className="py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 text-center transition-all">Grant Points</Link>
                         </div>
                     </div>

                     <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                         <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-4 flex items-center"><Undo2 className="w-4 h-4 mr-2 text-blue-500" /> Pending Refunds</h3>
                         <div className="space-y-4">
                            {pendingRefunds.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No refund requests in queue.</p>
                            ) : (
                                pendingRefunds.map(tx => {
                                    const isCurrentProcessing = processingId === tx.id;
                                    return (
                                        <div key={tx.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 animate-in fade-in slide-in-from-right-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs font-black dark:text-white">Request from {tx.driverName}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">Tx: {tx.id}</p>
                                                </div>
                                                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{Math.abs(tx.amount).toLocaleString()} PTS</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-[10px] text-gray-600 dark:text-gray-300 italic mb-3">"{tx.refundReason}"</div>
                                            <div className="flex gap-2">
                                                <button 
                                                    disabled={!!processingId}
                                                    onClick={() => handleRefundAction(tx.id, true)} 
                                                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isCurrentProcessing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve</>}
                                                </button>
                                                <button 
                                                    disabled={!!processingId}
                                                    onClick={() => handleRefundAction(tx.id, false)} 
                                                    className="flex-1 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isCurrentProcessing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Deny</>}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                         </div>
                     </div>
                 </div>

                 {/* Incentive Rules */}
                 <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                     <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-4 flex items-center"><Award className="w-4 h-4 mr-2 text-amber-500" /> Active Rewards Logic</h3>
                     <div className="space-y-4">
                         <div className="flex gap-2">
                             <input type="text" value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Rule description..." className="flex-1 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs bg-gray-50 dark:bg-slate-700 dark:text-white outline-none" />
                             <button onClick={handleAddRule} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Add</button>
                         </div>
                         <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                             {(sponsorOrg?.incentiveRules || []).map((rule, i) => (
                                 <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl group border border-transparent hover:border-gray-200 transition-all">
                                     <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{rule}</span>
                                     <button onClick={() => handleRemoveRule(i)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const AdminDashboard: React.FC<DashboardProps> = ({ user }) => {
    const [config, setConfig] = useState(getConfig());
    const [archiving, setArchiving] = useState(false);
    const [stats, setStats] = useState({ sponsors: 0, users: 0, drivers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleConfigChange = () => setConfig(getConfig());
        window.addEventListener('config-change', handleConfigChange);
        return () => window.removeEventListener('config-change', handleConfigChange);
    }, []);

    useEffect(() => {
        const loadStats = async () => {
            const [allUsers, allSponsors] = await Promise.all([getAllUsers(), getSponsors()]);
            setStats({ users: allUsers.length, drivers: allUsers.filter(u => u.role === UserRole.DRIVER).length, sponsors: allSponsors.length });
            setLoading(false);
        };
        loadStats();
    }, []);

    const toggleService = (key: keyof typeof config) => {
        const newVal = !config[key];
        updateConfig({ [key]: newVal });
    };

    const toggleMaster = () => {
        const active = config.useMockAuth || config.useMockDB || config.useMockRedshift;
        updateConfig({ useMockAuth: !active, useMockDB: !active, useMockRedshift: !active });
    };

    const handleArchive = async () => {
        setArchiving(true);
        if(await triggerRedshiftArchive()) alert("Archive Triggered");
        setArchiving(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-8">System Control Panel</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900"><h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1 flex items-center"><Building className="w-3 h-3 mr-1" /> Sponsors</h3><p className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{loading ? '---' : stats.sponsors}</p></div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900"><h3 className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1 flex items-center"><Truck className="w-3 h-3 mr-1" /> Active Fleet</h3><p className="text-3xl font-black text-blue-900 dark:text-blue-100">{loading ? '---' : stats.drivers}</p></div>
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900"><h3 className="text-[10px] font-black uppercase text-purple-500 tracking-widest mb-1 flex items-center"><UserIcon className="w-3 h-3 mr-1" /> Registered Users</h3><p className="text-3xl font-black text-purple-900 dark:text-purple-100">{loading ? '---' : stats.users}</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     <Link to="/admin/sponsors" className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-transparent hover:border-blue-500 transition-all">
                        <Building className="w-8 h-8 text-blue-600 mb-3" /><h3 className="font-bold dark:text-white">Partners</h3><p className="text-xs text-gray-500 mt-1">Configure org relationships.</p>
                     </Link>
                     <Link to="/admin/users" className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-transparent hover:border-purple-500 transition-all">
                        <UserIcon className="w-8 h-8 text-purple-600 mb-3" /><h3 className="font-bold dark:text-white">User Mgmt</h3><p className="text-xs text-gray-500 mt-1">Security, bans, role overrides.</p>
                     </Link>
                     <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-transparent flex flex-col justify-between">
                        <h3 className="font-bold dark:text-white flex items-center"><Activity className="w-4 h-4 mr-2" /> ETL Jobs</h3>
                        <button onClick={handleArchive} disabled={archiving} className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all">{archiving ? <Loader className="w-4 h-4 animate-spin mx-auto"/> : 'Archive Redshift'}</button>
                     </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow rounded-2xl p-8 border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div><h3 className="text-xl font-black dark:text-white flex items-center"><Power className="w-6 h-6 mr-2 text-red-500" /> Developer Master Override</h3><p className="text-sm text-gray-500">Instantly switch between Simulated Mock and Live AWS APIs.</p></div>
                 <button onClick={toggleMaster} className={`px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${isTestMode() ? 'bg-red-600 text-white shadow-red-200' : 'bg-green-600 text-white shadow-green-200'}`}>{isTestMode() ? 'ENABLE LIVE PROD' : 'SWITCH TO LOCAL MOCK'}</button>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {
  if (user.role === UserRole.DRIVER) return <DriverDashboard user={user} onUpdateUser={onUpdateUser} />;
  if (user.role === UserRole.SPONSOR) return <SponsorDashboard user={user} />;
  if (user.role === UserRole.ADMIN) return <AdminDashboard user={user} />;
  return <div>Unknown User Role</div>;
};
