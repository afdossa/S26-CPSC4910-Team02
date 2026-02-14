
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types';
import { getDriversBySponsor, getUserProfile, dropDriver } from '../services/mockData';
import { authService } from '../services/auth';
import { Users, Search, ArrowRight, Loader, UserIcon, ShieldCheck, TrendingUp, AlertCircle, UserX, UserCheck, X, AlertTriangle, Filter, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const SponsorDrivers: React.FC = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [drivers, setDrivers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED' | 'DROPPED'>('ALL');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Action Modal State
    const [confirmingDriver, setConfirmingDriver] = useState<User | null>(null);

    const loadFleet = useCallback(async (sponsorId: string) => {
        const fleet = await getDriversBySponsor(sponsorId);
        setDrivers(fleet);
    }, []);

    useEffect(() => {
        const init = async () => {
            const unsub = authService.onStateChange(async (fbUser) => {
                if (fbUser) {
                    const profile = await getUserProfile(fbUser.uid);
                    if (profile && profile.role === UserRole.SPONSOR && profile.sponsorId) {
                        setCurrentUser(profile);
                        await loadFleet(profile.sponsorId);
                    }
                }
                setLoading(false);
            });
            return unsub;
        };
        init();
    }, [loadFleet]);

    const handleDropAction = async () => {
        if (!confirmingDriver) return;
        
        const driverId = confirmingDriver.id;
        const isCurrentlyDropped = !!confirmingDriver.isDropped;

        setConfirmingDriver(null);
        setProcessingId(driverId);
        try {
            const success = await dropDriver(driverId, !isCurrentlyDropped);
            if (success && currentUser?.sponsorId) {
                await loadFleet(currentUser.sponsorId);
            }
        } catch (err) {
            console.error("Drop driver error:", err);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredDrivers = useMemo(() => {
        return drivers.filter(d => {
            const matchesSearch = d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 d.username.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isBanned = d.isActive === false;
            const isDropped = !!d.isDropped;
            const isActive = !isBanned && !isDropped;

            let matchesStatus = true;
            if (statusFilter === 'ACTIVE') matchesStatus = isActive;
            else if (statusFilter === 'BANNED') matchesStatus = isBanned;
            else if (statusFilter === 'DROPPED') matchesStatus = isDropped;

            return matchesSearch && matchesStatus;
        });
    }, [drivers, searchTerm, statusFilter]);

    const handleExportCSV = () => {
        if (filteredDrivers.length === 0) return;

        const headers = ['Full Name', 'Username', 'Email', 'Points Balance', 'Status'];
        const rows = filteredDrivers.map(d => {
            let status = 'Active';
            if (d.isActive === false) status = 'Admin Banned';
            else if (d.isDropped) status = 'Dropped';

            return [
                `"${d.fullName.replace(/"/g, '""')}"`,
                `"${d.username}"`,
                `"${d.email || ''}"`,
                (d.pointsBalance || 0).toString(),
                `"${status}"`
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        
        link.href = url;
        link.setAttribute('download', `fleet_export_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = useMemo(() => {
        const totalPoints = drivers.reduce((acc, d) => acc + (d.pointsBalance || 0), 0);
        return {
            count: drivers.length,
            activeCount: drivers.filter(d => d.isActive !== false && !d.isDropped).length,
            avgPoints: drivers.length > 0 ? Math.round(totalPoints / drivers.length) : 0,
            totalPoints
        };
    }, [drivers]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Fleet Data...</p>
        </div>
    );

    if (!currentUser || currentUser.role !== UserRole.SPONSOR) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h2>
                <p className="mt-2 text-gray-500">This page is restricted to Sponsor users only.</p>
                <Link to="/dashboard" className="mt-8 inline-block px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Custom Confirmation Modal */}
            {confirmingDriver && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmingDriver(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${confirmingDriver.isDropped ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                {confirmingDriver.isDropped ? <UserCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-2">
                                {confirmingDriver.isDropped ? 'Re-activate Driver?' : 'Drop Driver?'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                                {confirmingDriver.isDropped 
                                    ? `Are you sure you want to re-activate ${confirmingDriver.fullName}? They will regain full access to organization rewards.`
                                    : `Are you sure you want to drop ${confirmingDriver.fullName}? Their history will be retained, but they will no longer be considered an active fleet member.`
                                }
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDropAction}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${confirmingDriver.isDropped ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-amber-600 shadow-amber-100 hover:bg-amber-700'}`}
                                >
                                    Confirm Action
                                </button>
                                <button 
                                    onClick={() => setConfirmingDriver(null)}
                                    className="w-full py-3 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center">
                        <Users className="w-10 h-10 mr-4 text-blue-600" />
                        Our Fleet
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Monitoring {stats.count} drivers in your records ({stats.activeCount} active).</p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredDrivers.length === 0}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-black text-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                    <Link 
                        to="/sponsor/points"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Distribute Points
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Fleet Records</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.count}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Fleet Aggregate Points</p>
                    <div className="flex items-center">
                        <ShieldCheck className="w-5 h-5 text-blue-500 mr-2" />
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalPoints.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1">Average Balance / Driver</p>
                    <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.avgPoints.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Fleet Directory (Historical Records)</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name or handle..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full sm:w-48">
                            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active Only</option>
                                <option value="DROPPED">Dropped Only</option>
                                <option value="BANNED">Admin Banned</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-4 pl-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Handle</th>
                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rewards Potential</th>
                                <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 pr-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredDrivers.map((driver) => {
                                const isBanned = driver.isActive === false;
                                const isDropped = !!driver.isDropped;
                                const isActive = !isBanned && !isDropped;
                                const isProcessing = processingId === driver.id;

                                return (
                                    <tr key={driver.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group ${!isActive ? 'opacity-70 bg-gray-50/50 dark:bg-slate-900/10' : ''}`}>
                                        <td className="whitespace-nowrap py-5 pl-8 flex items-center">
                                            <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-slate-600 overflow-hidden mr-4 border border-gray-100 dark:border-slate-500 shadow-sm relative">
                                                <img src={driver.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                {!isActive && (
                                                    <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                                                        {isBanned ? <UserX className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4 text-white opacity-50" />}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors ${!isActive ? 'line-through decoration-gray-400 text-gray-500' : ''}`}>{driver.fullName}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{driver.email}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-5 text-xs font-medium text-gray-500 dark:text-gray-400">@{driver.username}</td>
                                        <td className="whitespace-nowrap px-3 py-5">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{driver.pointsBalance?.toLocaleString()} PTS</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{isActive ? 'Ready to redeem' : 'Account inactive'}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-5">
                                            <div className="flex flex-col gap-1">
                                                {isActive && (
                                                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                )}
                                                {isBanned && (
                                                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                                                        Admin Banned
                                                    </span>
                                                )}
                                                {isDropped && (
                                                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                                                        Dropped
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap py-5 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    disabled={isProcessing}
                                                    onClick={() => setConfirmingDriver(driver)}
                                                    className={`p-2 rounded-xl border transition-all ${
                                                        isDropped 
                                                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                                        : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                                    }`}
                                                    title={isDropped ? "Re-activate Driver" : "Drop Driver"}
                                                >
                                                    {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : (isDropped ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />)}
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/reports?tab=ledger&driver=${driver.id}`)}
                                                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm group"
                                                >
                                                    View Ledger
                                                    <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredDrivers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <UserIcon className="w-12 h-12 mb-2" />
                                            <p className="text-sm font-black uppercase tracking-widest">No drivers found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
