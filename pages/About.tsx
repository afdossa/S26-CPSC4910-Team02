import React, { useEffect, useState } from 'react';
import { AboutData } from '../types';
import { MOCK_ABOUT_DATA } from '../services/mockData';
import { getConfig, updateConfig } from '../services/config';
import { Server, Users, Code, Calendar, Database, AlertCircle, CheckCircle } from 'lucide-react';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutData | null>(null);
  const [config, setConfig] = useState(getConfig());

  // Listen for config changes
  useEffect(() => {
    const handleConfigChange = () => setConfig(getConfig());
    window.addEventListener('config-change', handleConfigChange);
    return () => window.removeEventListener('config-change', handleConfigChange);
  }, []);

  // Simulate fetching data from AWS DB
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchData = async () => {
        // In real app: const res = await fetch('/api/about');
        // Simulate network delay
        setTimeout(() => {
            setData(MOCK_ABOUT_DATA);
        }, 500);
    };
    fetchData();
  }, []);

  const toggleService = (key: keyof typeof config) => {
    const newVal = !config[key];
    updateConfig({ [key]: newVal });
    setConfig({ ...config, [key]: newVal });
  };

  const StatusBadge = ({ active, mockName, realName }: { active: boolean, mockName: string, realName: string }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {active ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            {active ? `MOCK (${mockName})` : `LIVE (${realName})`}
        </span>
  );

  if (!data) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          About the Project
        </h1>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
          Senior Computing Practicum - {data.releaseDate}
        </p>
      </div>

      <div className="mt-16 bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-slate-50">
           <h3 className="text-lg leading-6 font-medium text-gray-900">System Information</h3>
           <p className="mt-1 max-w-2xl text-sm text-gray-500">Data retrieved from live database configuration.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Team Identifier
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{data.teamNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Code className="w-5 h-5 mr-2 text-green-500" />
                        Current Version
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{data.versionNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                        Release Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{data.releaseDate}</dd>
                </div>
                 <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Server className="w-5 h-5 mr-2 text-orange-500" />
                        Product Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{data.productName}</dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{data.description}</dd>
                </div>
            </dl>
        </div>
      </div>
      
      {/* Service Control Panel for Devs/Testers */}
      <div className="mt-8 bg-white shadow rounded-lg p-6 border-t-4 border-indigo-500">
         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
             <Server className="w-5 h-5 mr-2 text-indigo-500" />
             Developer Service Control Panel
         </h3>
         <p className="text-sm text-gray-500 mb-6">
             Configure which services are actively connected for this session. Use these toggles to switch between simulated "Mock" data and "Live" AWS/Firebase services.
         </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             
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

      <div className="mt-8 text-center text-sm text-gray-400">
          <p>This application is hosted on AWS using React and a cloud-hosted database.</p>
      </div>
    </div>
  );
};