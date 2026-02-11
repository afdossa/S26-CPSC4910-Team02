
import React, { useEffect, useState } from 'react';
import { AboutData } from '../types';
import { MOCK_ABOUT_DATA } from '../services/mockData';
import { Server, Users, Code, Calendar } from 'lucide-react';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutData | null>(null);

  useEffect(() => {
    setData(MOCK_ABOUT_DATA);
  }, []);

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
    </div>
  );
};
