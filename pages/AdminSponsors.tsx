import React, { useState } from 'react';
import { MOCK_SPONSORS, addSponsor } from '../services/mockData';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building, Plus } from 'lucide-react';

export const AdminSponsors: React.FC = () => {
    const [name, setName] = useState('');
    const [ratio, setRatio] = useState(0.01);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addSponsor(name, ratio);
        setName('');
        setRatio(0.01);
        alert('Sponsor added successfully');
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>

            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Sponsors</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Create new sponsor organizations and view existing partners.
                        </p>
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="shadow sm:rounded-md sm:overflow-hidden bg-white mb-6">
                        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-6 gap-6">
                                    <div className="col-span-6 sm:col-span-4">
                                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                                        <input
                                            type="text"
                                            name="company_name"
                                            id="company_name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 border px-3 bg-white"
                                            required
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-2">
                                        <label htmlFor="ratio" className="block text-sm font-medium text-gray-700">Point/$ Ratio</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            name="ratio"
                                            id="ratio"
                                            value={ratio}
                                            onChange={(e) => setRatio(Number(e.target.value))}
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 border px-3 bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 text-right">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Sponsor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {MOCK_SPONSORS.map((sponsor) => (
                                <li key={sponsor.id}>
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                                <Building className="w-6 h-6" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{sponsor.name}</div>
                                                <div className="text-sm text-gray-500">ID: {sponsor.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Ratio: {sponsor.pointDollarRatio}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};