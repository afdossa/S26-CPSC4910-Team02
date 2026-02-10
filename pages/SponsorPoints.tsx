
import React, { useState, useEffect } from 'react';
import { MOCK_USERS, updateDriverPoints, getSponsor, updateSponsorFloor } from '../services/mockData';
import { User, UserRole } from '../types';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, AlertCircle, Settings, Users, CheckSquare, Square } from 'lucide-react';

export const SponsorPoints: React.FC<{user: User}> = ({ user }) => {
    const drivers = MOCK_USERS.filter(u => u.role === UserRole.DRIVER && u.sponsorId === user.sponsorId);
    
    // Dynamically get Sponsor Info based on logged-in user
    const [sponsorName, setSponsorName] = useState('My Organization');
    
    // State
    const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
    const [points, setPoints] = useState<number | ''>(100);
    const [reason, setReason] = useState('Safe Driving Bonus');
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
    const [floorPoints, setFloorPoints] = useState<number>(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load initial settings
    useEffect(() => {
        if (user.sponsorId) {
            const sponsor = getSponsor(user.sponsorId);
            if (sponsor) {
                setSponsorName(sponsor.name);
                setFloorPoints(sponsor.pointsFloor || 0);
            }
        }
    }, [user.sponsorId]);

    const toggleDriver = (id: string) => {
        const newSelected = new Set(selectedDriverIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDriverIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedDriverIds.size === drivers.length) {
            setSelectedDriverIds(new Set());
        } else {
            setSelectedDriverIds(new Set(drivers.map(d => d.id)));
        }
    };

    const handleFloorUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (user.sponsorId) {
            const success = updateSponsorFloor(user.sponsorId, Number(floorPoints));
            if (success) {
                setNotification({ message: 'Points Floor setting updated successfully.', type: 'success' });
                setIsSettingsOpen(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedDriverIds.size === 0 || !points || !reason) {
            setNotification({ message: 'Please select at least one driver and fill in all fields.', type: 'error' });
            return;
        }

        if (!user.sponsorId) {
             setNotification({ message: 'Error: You are not associated with a sponsor organization.', type: 'error' });
             return;
        }

        let successCount = 0;
        let failCount = 0;
        let failReasons: string[] = [];

        for (const driverId of selectedDriverIds) {
            const result = await updateDriverPoints(
                driverId, 
                Number(points), 
                reason, 
                sponsorName,
                user.sponsorId,
                'MANUAL', // Mark as Manual
                user.fullName // Pass the actor name (current user)
            );

            if (result.success) {
                successCount++;
            } else {
                failCount++;
                const driverName = drivers.find(d => d.id === driverId)?.username;
                failReasons.push(`${driverName}: ${result.message}`);
            }
        }

        if (failCount === 0) {
            setNotification({ 
                message: `Successfully processed points for ${successCount} driver(s).`, 
                type: 'success' 
            });
            // Reset form but keep floor settings
            setReason('');
            setSelectedDriverIds(new Set());
        } else if (successCount === 0) {
            setNotification({ 
                message: `Failed to process. Reasons: ${failReasons.join(', ')}`, 
                type: 'error' 
            });
        } else {
             setNotification({ 
                message: `Partial Success. Updated ${successCount}, Failed ${failCount}. Reasons: ${failReasons.join(', ')}`, 
                type: 'warning' 
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Column: Actions */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <Gift className="w-6 h-6 text-white mr-3" />
                                <h1 className="text-xl font-bold text-white">Distribute Points</h1>
                            </div>
                            <span className="text-blue-100 text-sm">{selectedDriverIds.size} Selected</span>
                        </div>

                        <div className="p-6">
                            {notification && (
                                <div className={`mb-4 p-4 rounded-md text-sm whitespace-pre-line ${
                                    notification.type === 'success' ? 'bg-green-50 text-green-800' : 
                                    notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                                    'bg-red-50 text-red-800'
                                }`}>
                                    {notification.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Driver Selection List */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Select Drivers</label>
                                        <button 
                                            type="button" 
                                            onClick={toggleAll}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {selectedDriverIds.size === drivers.length && drivers.length > 0 ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="border rounded-md max-h-64 overflow-y-auto bg-gray-50 p-2 space-y-2">
                                        {drivers.map(driver => (
                                            <div 
                                                key={driver.id} 
                                                onClick={() => toggleDriver(driver.id)}
                                                className={`flex items-center p-3 rounded-md cursor-pointer border transition-colors ${
                                                    selectedDriverIds.has(driver.id) 
                                                    ? 'bg-blue-50 border-blue-200' 
                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="flex-shrink-0 mr-3">
                                                    {selectedDriverIds.has(driver.id) 
                                                        ? <CheckSquare className="w-5 h-5 text-blue-600" />
                                                        : <Square className="w-5 h-5 text-gray-400" />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{driver.fullName}</p>
                                                    <p className="text-xs text-gray-500">{driver.username} • {driver.pointsBalance?.toLocaleString()} pts</p>
                                                </div>
                                            </div>
                                        ))}
                                        {drivers.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No drivers associated with your organization found.</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    </div>

                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
                                        <input
                                            type="text"
                                            id="reason"
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 border px-3 bg-white"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="e.g. Safe Driving Bonus"
                                        />
                                    </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Negative values deduct points. Transactions limited by the Floor setting.
                                </p>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={selectedDriverIds.size === 0}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                            ${selectedDriverIds.size === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
                                        `}
                                    >
                                        Process Transaction ({selectedDriverIds.size} Drivers)
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="md:col-span-1">
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                         <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center">
                                <Settings className="w-4 h-4 mr-2" /> Sponsor Settings
                            </h3>
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-blue-600 hover:text-blue-800 text-xs">
                                {isSettingsOpen ? 'Close' : 'Edit'}
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Points Floor</label>
                                {isSettingsOpen ? (
                                    <form onSubmit={handleFloorUpdate} className="flex space-x-2">
                                        <input 
                                            type="number" 
                                            value={floorPoints}
                                            onChange={(e) => setFloorPoints(Number(e.target.value))}
                                            className="block w-full text-sm border-gray-300 rounded-md border px-2 py-1"
                                        />
                                        <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-1 rounded">Save</button>
                                    </form>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">{floorPoints}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Drivers cannot be deducted below this point value.
                                </p>
                            </div>
                            
                            <hr className="my-4 border-gray-200" />
                            
                            <div className="mb-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Organization</label>
                                <p className="text-sm font-semibold text-gray-900">{sponsorName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Tips</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        Use bulk selection to apply monthly bonuses or uniform penalties to your entire fleet at once.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};