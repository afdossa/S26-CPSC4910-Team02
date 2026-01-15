import React, { useEffect, useState } from 'react';
import { AboutData } from '../types';
import { MOCK_ABOUT_DATA } from '../services/mockData';
import { Server, Users, Code, Calendar } from 'lucide-react';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutData | null>(null);

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
      
      <div className="mt-8 text-center text-sm text-gray-400">
          <p>This application is hosted on AWS using React and a cloud-hosted database.</p>
      </div>
    </div>
  );
};