
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole } from '../types';
import { getMessages, sendMessage, getDriversBySponsor, getSponsor, getUserProfile } from '../services/mockData';
import { Send, User as UserIcon, MessageSquare, ArrowLeft, Loader, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatProps {
    user: User;
}

export const Chat: React.FC<ChatProps> = ({ user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            if (user.role === UserRole.DRIVER) {
                // Driver View: Can only chat with their sponsor (if they have one)
                if (user.sponsorId) {
                    // We need to find the user account associated with the Sponsor Org
                    // For mock purposes, we assume the sponsor account is 'u2' or find by role/org
                    // In a real app, the Sponsor Org would have a main contact user ID
                    const sponsorOrg = getSponsor(user.sponsorId);
                    // Find a sponsor user to chat with. 
                    // NOTE: In this mock, 'u2' is the sponsor user. 
                    // Real implementation would look up the admin of the org.
                    const sponsorUser = await getUserProfile('u2'); // Hardcoded primary sponsor for demo
                    if (sponsorUser) {
                        setContacts([sponsorUser]);
                        setSelectedContact(sponsorUser);
                    }
                }
            } else if (user.role === UserRole.SPONSOR) {
                // Sponsor View: Can chat with any of their drivers
                if (user.sponsorId) {
                    const drivers = await getDriversBySponsor(user.sponsorId);
                    setContacts(drivers);
                    if (drivers.length > 0) {
                        setSelectedContact(drivers[0]);
                    }
                }
            }
            setLoading(false);
        };
        init();
    }, [user]);

    // Fetch messages when contact changes
    useEffect(() => {
        if (!selectedContact) return;
        
        const fetchMsgs = async () => {
            const msgs = await getMessages(user.id, selectedContact.id);
            setMessages(msgs);
        };
        
        fetchMsgs();
        
        // Poll for new messages every 3 seconds (simple mock real-time)
        const interval = setInterval(fetchMsgs, 3000);
        return () => clearInterval(interval);
    }, [selectedContact, user.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        setSending(true);
        await sendMessage(user.id, selectedContact.id, newMessage);
        setNewMessage('');
        
        // Refresh immediately
        const msgs = await getMessages(user.id, selectedContact.id);
        setMessages(msgs);
        setSending(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading messages...</p>
        </div>
    );

    if (user.role === UserRole.DRIVER && !user.sponsorId) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Active Sponsor</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">You need to join a sponsor organization to start chatting.</p>
                <Link to="/dashboard" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-slate-900">
            {/* Header / Mobile Back */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center">
                    <Link to="/dashboard" className="md:hidden mr-4 text-gray-500">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        {user.role === UserRole.SPONSOR ? 'Driver Communications' : 'Sponsor Support'}
                    </h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar (Contact List) - Hidden on mobile if viewing chat in future, but simplified here */}
                {user.role === UserRole.SPONSOR && (
                    <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col hidden md:flex">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search drivers..." 
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {contacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full p-4 flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700/50 ${selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden">
                                        <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="ml-3 text-left">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{contact.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">@{contact.username}</p>
                                    </div>
                                </button>
                            ))}
                            {contacts.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-sm">No drivers found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 flex flex-col h-full relative">
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center shadow-sm z-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                                    <img src={selectedContact.avatarUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{selectedContact.fullName}</h3>
                                    <p className="text-xs text-green-600 font-medium flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span> Active
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50" ref={scrollRef}>
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                        <MessageSquare className="w-12 h-12 mb-2" />
                                        <p className="text-sm">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.senderId === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                                    isMe 
                                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-slate-600'
                                                }`}>
                                                    <p className="text-sm">{msg.text}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 dark:shadow-none"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <UserIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a driver to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
