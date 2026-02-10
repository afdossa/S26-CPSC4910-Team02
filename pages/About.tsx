
import React, { useEffect, useState } from 'react';
import { AboutData } from '../types';
import { MOCK_ABOUT_DATA } from '../services/mockData';
import { getConfig, updateConfig } from '../services/config';
import { Server, Users, Code, Calendar, AlertCircle, CheckCircle, Power, Activity } from 'lucide-react';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutData | null>(null);
  const [config, setConfig] = useState(getConfig());

  useEffect(() => {
    const handleConfigChange = () => setConfig(getConfig());
    window.addEventListener('config-change', handleConfigChange);
    return () => window.removeEventListener('config-change', handleConfigChange);
  }, []);

  useEffect(() => {
    setData(MOCK_ABOUT_DATA);
  }, []);

  const toggleService = (key: keyof typeof config) => {
    updateConfig({ [key]: !config[key] });
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

  const StatusBadge = ({ active, mockName, realName }: { active: boolean, mockName: string, realName: string }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}`}>
            {active ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            {active ? `MOCK (${mockName})` : `LIVE (${realName})`}
        </span>
  );

  if (!data) return <div className="p-20 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">About Project</h1>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-400">Senior Practicum - {data.releaseDate}</p>
      </div>

      <div className="mt-16 bg-white dark:bg-slate-800 overflow-hidden shadow-xl rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Information</h3>
        </div>
        <div className="px-6 py-8">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                <div className="flex items-start">
                    <Users className="w-6 h-6 mr-4 text-blue-500" />
                    <div>
                        <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest">Team Identifier</dt>
                        <dd className="mt-1 text-lg text-gray-900 dark:text-white font-black">{data.teamNumber}</dd>
                    </div>
                </div>
                <div className="flex items-start">
                    <Code className="w-6 h-6 mr-4 text-green-500" />
                    <div>
                        <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest">Current Version</dt>
                        <dd className="mt-1 text-lg text-gray-900 dark:text-white font-black">{data.versionNumber}</dd>
                    </div>
                </div>
                <div className="flex items-start">
                    <Calendar className="w-6 h-6 mr-4 text-purple-500" />
                    <div>
                        <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest">Release Date</dt>
                        <dd className="mt-1 text-lg text-gray-900 dark:text-white font-black">{data.releaseDate}</dd>
                    </div>
                </div>
                <div className="flex items-start">
                    <Server className="w-6 h-6 mr-4 text-orange-500" />
                    <div>
                        <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest">Product Name</dt>
                        <dd className="mt-1 text-lg text-gray-900 dark:text-white font-black">{data.productName}</dd>
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Description</dt>
                    <dd className="text-gray-600 dark:text-gray-300 leading-relaxed">{data.description}</dd>
                </div>
            </dl>
        </div>
      </div>
      
      <div className="mt-12 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border-t-4 border-indigo-500">
         <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-indigo-500" /> Developer Control Panel
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage real-time service connections and system state.</p>
            </div>
            <button 
                onClick={toggleMaster}
                className={`flex items-center px-6 py-2 rounded-xl font-bold text-sm transition-all ${isMasterTestMode ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
            >
                <Power className="w-4 h-4 mr-2" /> {isMasterTestMode ? 'Enable Prod' : 'Enable Mock'}
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="border border-gray-100 dark:border-slate-700 rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/30">
                 <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold text-gray-700 dark:text-white text-sm">Auth Source</h4>
                     <StatusBadge active={config.useMockAuth} mockName="Local" realName="Firebase" />
                 </div>
                 <button onClick={() => toggleService('useMockAuth')} className="w-full py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-gray-50">Toggle Auth</button>
             </div>
             <div className="border border-gray-100 dark:border-slate-700 rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/30">
                 <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold text-gray-700 dark:text-white text-sm">DB Source</h4>
                     <StatusBadge active={config.useMockDB} mockName="Local" realName="AWS RDS" />
                 </div>
                 <button onClick={() => toggleService('useMockDB')} className="w-full py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-gray-50">Toggle DB</button>
             </div>
             <div className="border border-gray-100 dark:border-slate-700 rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/30">
                 <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold text-gray-700 dark:text-white text-sm">ETL Pipeline</h4>
                     <StatusBadge active={config.useMockRedshift} mockName="Mock" realName="Glue" />
                 </div>
                 <button onClick={() => toggleService('useMockRedshift')} className="w-full py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-gray-50">Toggle ETL</button>
             </div>
         </div>
      </div>
    </div>
  );
};
