import React, { useState } from 'react';
import { MOCK_APPLICATIONS } from '../services/mockData';
import { DriverApplication } from '../types';
import { Check, X, ArrowLeft, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SponsorApplications: React.FC = () => {
    const [apps, setApps] = useState<DriverApplication[]>(MOCK_APPLICATIONS);

    const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
        // In a real app, this would make an API call
        setApps(apps.filter(a => a.id !== id));
        alert(`Application for user has been ${action.toLowerCase()}.`);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center">
                    <Inbox className="w-8 h-8 text-gray-700 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Driver Applications</h1>
                        <p className="text-gray-500">Review and approve new drivers for your organization.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                {apps.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Inbox className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p>No pending applications found.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {apps.map((app) => (
                            <li key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{app.applicantName}</h3>
                                    <p className="text-sm text-gray-500">{app.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">Applied on {app.date}</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleAction(app.id, 'APPROVED')}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(app.id, 'REJECTED')}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <X className="w-4 h-4 mr-1 text-red-500" /> Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};