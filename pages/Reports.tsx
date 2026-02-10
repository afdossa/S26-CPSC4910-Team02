
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { getAuditLogs, getDriversBySponsor, getTransactions, getAllUsers } from '../services/mockData';
import { AuditLog, User, UserRole, PointTransaction } from '../types';
import { Download, Filter, Users, TrendingUp, Calendar, ArrowRight, Shield, FileBarChart, RotateCcw, User as UserIcon, MoreHorizontal, Receipt, TrendingDown, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

const SALES_DATA = [
  { name: 'FastLane Logistics', sales: 4000 },
  { name: 'Global Freight', sales: 3000 },
  { name: 'Red River Trucking', sales: 2000 },
  { name: 'Eagle Eye Trans', sales: 2780 },
  { name: 'Blue Sky', sales: 1890 },
];

export const Reports: React.FC = () => {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'sales' | 'points' | 'audit' | 'fleet' | 'ledger'>('sales');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [fleetDrivers, setFleetDrivers] = useState<User[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
    
    // Date Range State
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [allTransactions, setAllTransactions] = useState<PointTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitial = async () => {
            const unsub = authService.onStateChange(async (fbUser) => {
                if (fbUser) {
                    const profile = await getAllUsers().then(users => users.find(u => u.id === fbUser.uid));
                    if (profile) {
                        setCurrentUser(profile);
                        if (profile.role === UserRole.SPONSOR && profile.sponsorId) {
                            const drivers = await getDriversBySponsor(profile.sponsorId);
                            setFleetDrivers(drivers);
                            setActiveTab('fleet');
                        } else if (profile.role === UserRole.ADMIN) {
                            setActiveTab('sales');
                        }
                    }
                }
            });

            const [logs, txs] = await Promise.all([
                getAuditLogs(),
                getTransactions()
            ]);
            setAuditLogs(logs);
            setAllTransactions(txs);
            setLoading(false);
            return unsub;
        };
        loadInitial();
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        if (tab === 'audit' || tab === 'sales' || tab === 'points' || tab === 'fleet' || tab === 'ledger') {
            setActiveTab(tab as any);
        }
    }, [location.search]);

    // Real Data Filtering for Ledger and Summary
    const filteredLedger = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const selectedDriver = fleetDrivers.find(d => d.id === selectedDriverId);

        return allTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            const inDateRange = txDate >= start && txDate <= end;
            
            // For Sponsor view, only show fleet transactions
            // For Admin view, show all
            const isVisible = currentUser?.role === UserRole.ADMIN || (
                selectedDriverId === 'all' 
                    ? fleetDrivers.some(d => d.fullName === tx.driverName)
                    : tx.driverName === selectedDriver?.fullName
            );
            
            return inDateRange && isVisible;
        });
    }, [allTransactions, startDate, endDate, selectedDriverId, fleetDrivers, currentUser]);

    // Dynamic Chart Data Generator (Improvements: Map to actual transaction counts where possible)
    const dynamicChartData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        const numPoints = Math.min(Math.max(diffDays, 2), 15); 
        const data = [];
        
        for (let i = 0; i < numPoints; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + Math.floor((diffDays / (numPoints - 1)) * i));
            
            // Check real transactions for this period to influence height
            const dayStr = current.toISOString().split('T')[0];
            const realPointsOnDay = filteredLedger
                .filter(tx => tx.date === dayStr)
                .reduce((acc, curr) => acc + curr.amount, 0);

            // Seed logic for simulation filler
            const seed = (selectedDriverId === 'all' ? 10 : selectedDriverId.charCodeAt(0)) + current.getDate();
            const points = Math.floor(2000 + (Math.sin(seed) * 1000) + (selectedDriverId === 'all' ? 2000 : 0)) + realPointsOnDay;
            
            data.push({
                date: current.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                points: Math.max(points, 0)
            });
        }
        return data;
    }, [startDate, endDate, selectedDriverId, filteredLedger]);

    const handleResetFilters = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setStartDate(d.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setSelectedDriverId('all');
    };

    const downloadCSV = () => {
        alert(`Exporting ${activeTab} data from ${startDate} to ${endDate}...`);
    };

    const selectedDriverName = useMemo(() => {
        if (selectedDriverId === 'all') return 'Whole Fleet';
        return fleetDrivers.find(d => d.id === selectedDriverId)?.fullName || 'Selected Driver';
    }, [selectedDriverId, fleetDrivers]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Generating Reports...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Business Intelligence</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Analytics, audit trails, and fleet performance monitoring.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                        onClick={downloadCSV}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-black text-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <nav className="flex flex-wrap gap-2" aria-label="Tabs">
                    {currentUser?.role === UserRole.ADMIN && (
                        <>
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                        >
                            Global Sales
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                        >
                            System Ledger
                        </button>
                        </>
                    )}
                    {currentUser?.role === UserRole.SPONSOR && (
                        <>
                        <button
                            onClick={() => setActiveTab('fleet')}
                            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'fleet' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                        >
                            Fleet Metrics
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                        >
                            Point Ledger
                        </button>
                        </>
                    )}
                    <button
                         onClick={() => setActiveTab('points')}
                        className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'points' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100 dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                    >
                        Issuance Trends
                    </button>
                    <button
                         onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800'}`}
                    >
                        Audit Logs
                    </button>
                </nav>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 min-h-[500px] animate-in fade-in zoom-in-95 duration-300">
                {activeTab === 'sales' && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                             <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Revenue Distribution</h3>
                                <p className="text-sm text-gray-400">Total volume processed by organization.</p>
                             </div>
                             <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl text-blue-700 dark:text-blue-300 font-black text-sm">
                                Total: $13,670.00
                             </div>
                        </div>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={SALES_DATA}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Sales ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {(activeTab === 'fleet' || activeTab === 'ledger') && (
                    <div className="space-y-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                                    <Filter className="w-4 h-4 mr-2 text-indigo-500" />
                                    Report Filters
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust driver and date range for your fleet analysis.</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4">
                                {currentUser?.role === UserRole.SPONSOR && (
                                    <div className="flex items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
                                        <Users className="w-4 h-4 text-gray-400 ml-2" />
                                        <select 
                                            value={selectedDriverId}
                                            onChange={(e) => setSelectedDriverId(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold focus:ring-0 text-gray-700 dark:text-white px-3 py-1 cursor-pointer"
                                        >
                                            <option value="all">ALL DRIVERS</option>
                                            {fleetDrivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
                                    <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                                    <input 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none text-xs font-bold focus:ring-0 text-gray-700 dark:text-white px-2 py-1"
                                    />
                                    <span className="text-gray-300 mx-1">/</span>
                                    <input 
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none text-xs font-bold focus:ring-0 text-gray-700 dark:text-white px-2 py-1"
                                    />
                                </div>

                                <button 
                                    onClick={handleResetFilters}
                                    className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors shadow-sm"
                                    title="Reset Filters"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {activeTab === 'fleet' ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                        <dt className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Period Points Issuance</dt>
                                        <dd className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
                                            {dynamicChartData.reduce((acc, curr) => acc + curr.points, 0).toLocaleString()}
                                        </dd>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/50">
                                        <dt className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-1">Period Avg / Day</dt>
                                        <dd className="text-2xl font-black text-green-900 dark:text-green-100">
                                            {Math.floor(dynamicChartData.reduce((acc, curr) => acc + curr.points, 0) / dynamicChartData.length).toLocaleString()}
                                        </dd>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                        <dt className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Active Report For</dt>
                                        <dd className="text-lg font-black text-amber-900 dark:text-amber-100 truncate">{selectedDriverName}</dd>
                                    </div>
                                </div>

                                <div className="h-80 w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dynamicChartData}>
                                            <defs>
                                                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="points" stroke="#6366f1" fillOpacity={1} fill="url(#colorPoints)" name="Point Issuance" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="pt-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                                                <FileBarChart className="w-5 h-5 mr-2 text-blue-500" />
                                                Fleet Member Summary
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Current standings for all drivers in your organization.</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto border border-gray-100 dark:border-slate-700 rounded-2xl">
                                        <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                                <tr>
                                                    <th className="py-4 pl-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                                                    <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                                                    <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Points Balance</th>
                                                    <th className="px-3 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {fleetDrivers.map((driver) => (
                                                    <tr key={driver.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${selectedDriverId === driver.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                        <td className="whitespace-nowrap py-4 pl-6 flex items-center">
                                                            <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-slate-600 overflow-hidden mr-3 flex-shrink-0">
                                                                <img src={driver.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{driver.fullName}</span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">@{driver.username}</td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-black text-green-600 dark:text-green-400">
                                                            {driver.pointsBalance?.toLocaleString()} <span className="text-[10px] text-gray-400 uppercase font-bold">pts</span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-right">
                                                            <button 
                                                                onClick={() => { setSelectedDriverId(driver.id); setActiveTab('ledger'); }}
                                                                className="inline-flex items-center px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                                            >
                                                                View Ledger <ArrowRight className="w-3 h-3 ml-1.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                                            <Receipt className="w-5 h-5 mr-2 text-emerald-500" />
                                            Point Transaction Ledger
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Full history of point awards and redemptions for the selected period.</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Period Net Flow</span>
                                        <span className={`text-xl font-black ${filteredLedger.reduce((a, c) => a + c.amount, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {filteredLedger.reduce((a, c) => a + c.amount, 0) > 0 ? '+' : ''}
                                            {filteredLedger.reduce((a, c) => a + c.amount, 0).toLocaleString()} PTS
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-100 dark:border-slate-700 rounded-2xl">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                                            <tr>
                                                <th className="py-4 pl-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sponsor</th>
                                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                                <th className="px-3 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pr-6">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {filteredLedger.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="whitespace-nowrap py-4 pl-6 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                        {tx.date}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center">
                                                        <Building className="w-3 h-3 mr-1 opacity-50" />
                                                        {tx.sponsorName}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs font-black text-gray-900 dark:text-white">
                                                        {tx.driverName || 'Unknown Driver'}
                                                    </td>
                                                    <td className="px-3 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                        {tx.reason}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                                            tx.type === 'PURCHASE' ? 'bg-orange-100 text-orange-700' : 
                                                            tx.type === 'MANUAL' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className={`whitespace-nowrap px-3 py-4 text-right pr-6 font-black text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <div className="flex items-center justify-end">
                                                            {tx.amount >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                                            {tx.amount.toLocaleString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredLedger.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center text-gray-400 italic text-sm">
                                                        No point changes found for this period/selection.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'points' && (
                    <>
                         <div className="mb-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Aggregate Issuance Trends</h3>
                            <p className="text-sm text-gray-400">Total volume of points distributed across the platform.</p>
                        </div>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={dynamicChartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="points" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-slate-500" />
                                Security Audit Trail
                            </h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{auditLogs.length} Records</span>
                        </div>
                        <div className="overflow-x-auto border border-gray-100 dark:border-slate-700 rounded-2xl">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="py-4 pl-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date / Time</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="whitespace-nowrap py-4 pl-6 text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center">
                                                <Calendar className="w-3 h-3 mr-1.5 opacity-50" /> {log.date}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-xs font-black text-gray-900 dark:text-white">@{log.actor}</td>
                                            <td className="px-3 py-4 text-xs">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.category}</td>
                                            <td className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
