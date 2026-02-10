
import React, { useState, useEffect } from 'react';
import { getGlobalSettings, updateGlobalSettings } from '../services/mockData';
import { GlobalSettings } from '../types';
import { ArrowLeft, Save, Globe, Shield, UserPlus, AlertTriangle, CheckCircle, Mail, Key, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await getGlobalSettings();
            setSettings(data);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage(null);
        try {
            const success = await updateGlobalSettings(settings);
            if (success) {
                setMessage({ text: 'Global system settings updated successfully.', type: 'success' });
            } else {
                setMessage({ text: 'Failed to update settings.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'An unexpected error occurred.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const toggleSetting = (key: keyof GlobalSettings) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [key]: !settings[key]
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading system configuration...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-4 font-bold text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center">
                    <Globe className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">System Configuration</h1>
                        <p className="text-gray-500 text-sm">Manage global behavior and platform-wide rules.</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center animate-in fade-in slide-in-from-top-4 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Platform Status */}
                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                            Platform Status & Access
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Maintenance Mode</p>
                                <p className="text-xs text-gray-500">Enable to lock the platform for all non-admin users.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleSetting('maintenanceMode')}
                                className={`${settings?.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${settings?.maintenanceMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Public Registration</p>
                                <p className="text-xs text-gray-500">Allow new drivers to create accounts on the login page.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleSetting('isRegistrationEnabled')}
                                className={`${settings?.isRegistrationEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${settings?.isRegistrationEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Point Rules */}
                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                            <Key className="w-4 h-4 mr-2 text-amber-500" />
                            Redemption Rules
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Minimum Redemption Threshold</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    value={settings?.minRedemptionPoints || ''}
                                    onChange={(e) => setSettings({ ...settings!, minRedemptionPoints: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="absolute right-4 top-3 text-gray-400 font-bold text-xs uppercase">Points</div>
                            </div>
                            <p className="mt-1 text-[10px] text-gray-400">Drivers cannot checkout from the catalog if their balance is below this amount.</p>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Allow Password Resets</p>
                                <p className="text-xs text-gray-500">Enable the "Forgot Password" functionality for non-admin users.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleSetting('allowDriverPasswordResets')}
                                className={`${settings?.allowDriverPasswordResets ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${settings?.allowDriverPasswordResets ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Support Information */}
                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-blue-500" />
                            Support & Contact
                        </h3>
                    </div>
                    <div className="p-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">System Contact Email</label>
                        <input
                            type="email"
                            value={settings?.systemContactEmail || ''}
                            onChange={(e) => setSettings({ ...settings!, systemContactEmail: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="support@example.com"
                        />
                        <p className="mt-1 text-[10px] text-gray-400">This email is displayed to banned users or during maintenance.</p>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        Save Global System Settings
                    </button>
                </div>
            </form>
        </div>
    );
};
