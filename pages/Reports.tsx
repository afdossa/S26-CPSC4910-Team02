import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { MOCK_AUDIT_LOGS } from '../services/mockData';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const SALES_DATA = [
  { name: 'FastLane Logistics', sales: 4000 },
  { name: 'Global Freight', sales: 3000 },
  { name: 'Red River Trucking', sales: 2000 },
  { name: 'Eagle Eye Trans', sales: 2780 },
  { name: 'Blue Sky', sales: 1890 },
];

const POINTS_DATA = [
  { date: 'Jan 1', points: 4000 },
  { date: 'Jan 8', points: 3000 },
  { date: 'Jan 15', points: 5000 },
  { date: 'Jan 22', points: 2780 },
  { date: 'Jan 29', points: 1890 },
  { date: 'Feb 5', points: 2390 },
];

export const Reports: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'sales' | 'points' | 'audit'>('sales');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'audit' || tab === 'sales' || tab === 'points') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const downloadCSV = () => {
        alert("Downloading CSV report...");
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
                    <p className="mt-2 text-sm text-gray-700">Detailed analytics and audit logs.</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={downloadCSV}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select
                        id="tabs"
                        name="tabs"
                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as any)}
                    >
                        <option value="sales">Sales by Sponsor</option>
                        <option value="points">Driver Point Trends</option>
                        <option value="audit">Audit Logs</option>
                    </select>
                </div>
                <div className="hidden sm:block">
                    <nav className="flex space-x-4" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`${activeTab === 'sales' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} px-3 py-2 font-medium text-sm rounded-md`}
                        >
                            Sales by Sponsor
                        </button>
                        <button
                             onClick={() => setActiveTab('points')}
                            className={`${activeTab === 'points' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} px-3 py-2 font-medium text-sm rounded-md`}
                        >
                            Driver Point Trends
                        </button>
                        <button
                             onClick={() => setActiveTab('audit')}
                            className={`${activeTab === 'audit' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} px-3 py-2 font-medium text-sm rounded-md`}
                        >
                            Audit Logs
                        </button>
                    </nav>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200 min-h-[400px]">
                {activeTab === 'sales' && (
                    <>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Total Sales Volume by Sponsor</h3>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={SALES_DATA}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {activeTab === 'points' && (
                    <>
                         <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Aggregate Driver Point Issuance</h3>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={POINTS_DATA}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="points" stroke="#f59e0b" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {activeTab === 'audit' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actor</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {MOCK_AUDIT_LOGS.map((log) => (
                                    <tr key={log.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{log.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.actor}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{log.action}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.target}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};