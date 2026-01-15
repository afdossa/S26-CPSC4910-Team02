import React, { useState } from 'react';
import { MOCK_USERS, updateDriverPoints } from '../services/mockData';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, AlertCircle } from 'lucide-react';

export const SponsorPoints: React.FC = () => {
    const drivers = MOCK_USERS.filter(u => u.role === UserRole.DRIVER);
    const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
    const [points, setPoints] = useState<number | ''>(100);
    const [reason, setReason] = useState('Safe Driving Bonus');
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedDriverId || !points || !reason) {
            setNotification({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        const driver = drivers.find(d => d.id === selectedDriverId);
        
        if (driver) {
            // Call the service to update data "persistently" in memory
            const success = updateDriverPoints(
                driver.id, 
                Number(points), 
                reason, 
                'FastLane Logistics' // Hardcoded for this prototype view
            );

            if (success) {
                setNotification({ 
                    message: `Successfully added ${points} points to ${driver.fullName}'s account. New Balance: ${driver.pointsBalance}`, 
                    type: 'success' 
                });
                setPoints(100);
            } else {
                setNotification({ message: 'Failed to update points.', type: 'error' });
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-blue-600 px-6 py-4 flex items-center">
                    <Gift className="w-6 h-6 text-white mr-3" />
                    <h1 className="text-xl font-bold text-white">Manage Driver Points</h1>
                </div>

                <div className="p-6">
                    {notification && (
                        <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {notification.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="driver" className="block text-sm font-medium text-gray-700">Select Driver</label>
                            <select
                                id="driver"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white"
                                value={selectedDriverId}
                                onChange={(e) => setSelectedDriverId(e.target.value)}
                            >
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.fullName} ({driver.username}) - {driver.pointsBalance} pts
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="points" className="block text-sm font-medium text-gray-700">Points Amount</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    id="points"
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border bg-white"
                                    placeholder="0"
                                    value={points}
                                    onChange={(e) => setPoints(Number(e.target.value))}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">pts</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Use negative values to deduct points.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason / Description</label>
                            <input
                                type="text"
                                id="reason"
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 border px-3 bg-white"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Safe Driving Bonus"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Process Transaction
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};