
import React, { useEffect, useState } from 'react';
import { X, Moon, Sun, Database, Server, RefreshCw, AlertTriangle, Trash2, Power } from 'lucide-react';
import { isTestMode, updateConfig, resetToDefaults } from '../services/config';
import { resetDatabase } from '../services/mockData';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
    toggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDark, toggleTheme }) => {
    const [testMode, setTestMode] = useState(isTestMode());
    const [confirmReset, setConfirmReset] = useState(false);

    // Sync local state with global config events
    useEffect(() => {
        const handleConfigChange = () => setTestMode(isTestMode());
        window.addEventListener('config-change', handleConfigChange);
        return () => window.removeEventListener('config-change', handleConfigChange);
    }, []);

    if (!isOpen) return null;

    const handleTestModeToggle = () => {
        const newState = !testMode;
        // Fix: Remove the second argument 'false' on line 33 as updateConfig expects only one argument (Partial<ServiceConfig>)
        updateConfig({
            useMockAuth: newState,
            useMockDB: newState,
            useMockRedshift: newState
        });
    };

    const handleResetData = () => {
        if (confirmReset) {
            resetDatabase(); // Clears mock data and dispatches event
            resetToDefaults(); // Clears config and dispatches event
            setConfirmReset(false);
            onClose();
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000); // Reset confirm state after 3s
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <SettingsIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                        Application Settings
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Appearance Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Appearance</h3>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Adjust the interface brightness</p>
                                </div>
                            </div>
                            <button 
                                onClick={toggleTheme}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <span className={`${isDark ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                            </button>
                        </div>
                    </div>

                    {/* System Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Configuration</h3>
                        
                        {/* Test Mode Toggle */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${testMode ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-gray-50 border-gray-100 dark:bg-slate-700/50 dark:border-slate-600'}`}>
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${testMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {testMode ? <AlertTriangle className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Mock Services (Test Mode)</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {testMode ? 'Using browser storage & mock auth' : 'Using real AWS & Firebase APIs'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleTestModeToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${testMode ? 'bg-red-600' : 'bg-gray-200'}`}
                            >
                                <span className={`${testMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                            </button>
                        </div>

                        {/* Reset Data */}
                        {testMode && (
                             <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg mr-3 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Local Data</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Clear all mock users and transactions</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleResetData}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center ${confirmReset ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
                                >
                                    {confirmReset ? (
                                        <>
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Confirm?
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Reset Data
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-mono">
                        Build v2.1.0 • Team 2 • {testMode ? 'OFFLINE MOCK' : 'ONLINE AWS'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Simple Gear Icon Component for internal use if Lucide import fails or for custom styling
const SettingsIcon = (props: any) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);
