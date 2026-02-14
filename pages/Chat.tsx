
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole } from '../types';
import { getMessages, sendMessage, getDriversBySponsor, getUserProfile, handleRefund } from '../services/mockData';
import { Send, User as UserIcon, MessageSquare, ArrowLeft, Loader, Search, Undo2, Check, X, CheckCircle2, XCircle } from 'lucide-react';
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
    const [processingId, setProcessingId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            if (user.role === UserRole.DRIVER) {
                if (user.sponsorId) {
                    const sponsorUser = await getUserProfile('u2'); 
                    if (sponsorUser) {
                        setContacts([sponsorUser]);
                        setSelectedContact(sponsorUser);
                    }
                }
            } else if (user.role === UserRole.SPONSOR) {
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

    // Fetch messages
    const fetchMsgs = async () => {
        if (!selectedContact) return;
        const msgs = await getMessages(user.id, selectedContact.id);
        setMessages(msgs);
    };

    useEffect(() => {
        fetchMsgs();
        const interval = setInterval(fetchMsgs, 5000);
        
        const handleUpdate = () => fetchMsgs();
        window.addEventListener('message-update', handleUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('message-update', handleUpdate);
        };
    }, [selectedContact, user.id]);

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
        await fetchMsgs();
        setSending(false);
    };

    const onRefundAction = async (msgId: string, transactionId: string, approved: boolean) => {
        // No confirmation needed for snappy responses
        setProcessingId(msgId);
        try {
            const success = await handleRefund(transactionId, approved, user.fullName);
            if (success) {
                await fetchMsgs();
            }
        } catch (error) {
            console.error("Refund error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" /><p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Communications...</p></div>;

    if (user.role === UserRole.DRIVER && !user.sponsorId) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">No Active Sponsor</h2>
                <p className="mt-2 text-gray-500 font-medium">You need to join an organization to start chatting.</p>
                <Link to="/dashboard" className="mt-6 inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center shrink-0">
                <Link to="/dashboard" className="md:hidden mr-4 text-gray-500 hover:text-blue-600 transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
                <h1 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> Communications</h1>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Contacts Sidebar */}
                <div className={`w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col hidden md:flex transition-colors`}>
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input type="text" placeholder="Search contacts..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-2xl text-sm bg-gray-50 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {contacts.map(contact => (
                            <button 
                                key={contact.id} 
                                onClick={() => setSelectedContact(contact)} 
                                className={`w-full p-4 flex items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all border-b border-gray-100 dark:border-slate-700/50 relative group ${selectedContact?.id === contact.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                                {selectedContact?.id === contact.id && <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-600 rounded-r-full" />}
                                <div className="h-11 w-11 rounded-2xl bg-gray-200 dark:bg-slate-600 flex-shrink-0 overflow-hidden shadow-sm ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all">
                                    <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="ml-3 text-left overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest truncate">@{contact.username}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Main Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {selectedContact ? (
                        <>
                            <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center shadow-sm z-10 transition-colors">
                                <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-slate-600 overflow-hidden shadow-sm">
                                    <img src={selectedContact.avatarUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-black dark:text-white leading-tight">{selectedContact.fullName}</h3>
                                    <p className="text-[10px] text-green-600 font-bold uppercase flex items-center mt-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span> Active Now
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar" ref={scrollRef}>
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === user.id;
                                    const isRefundRequest = msg.metadata?.type === 'REFUND_ACTION';
                                    const refundStatus = msg.metadata?.status || 'PENDING';
                                    const isCurrentProcessing = processingId === msg.id;
                                    
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm relative group ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-slate-700 transition-colors'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                
                                                {isRefundRequest && (
                                                    <div className={`mt-4 pt-4 border-t ${isMe ? 'border-blue-500' : 'border-gray-50 dark:border-slate-700'} space-y-3`}>
                                                        {refundStatus === 'PENDING' ? (
                                                            <>
                                                                <div className={`flex items-center gap-2 ${isMe ? 'text-blue-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                                    <Undo2 className="w-4 h-4" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                                        {user.role === UserRole.SPONSOR ? 'Decision Required' : 'Awaiting Sponsor Approval'}
                                                                    </span>
                                                                </div>
                                                                {!isMe && user.role === UserRole.SPONSOR && (
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            disabled={!!processingId}
                                                                            onClick={() => onRefundAction(msg.id, msg.metadata.transactionId, true)}
                                                                            className="flex-1 py-1.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                                                        >
                                                                            {isCurrentProcessing ? <Loader className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Approve</>}
                                                                        </button>
                                                                        <button 
                                                                            disabled={!!processingId}
                                                                            onClick={() => onRefundAction(msg.id, msg.metadata.transactionId, false)}
                                                                            className="flex-1 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
                                                                        >
                                                                            {isCurrentProcessing ? <Loader className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" /> Deny</>}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${
                                                                refundStatus === 'APPROVED' 
                                                                ? (isMe ? 'text-green-200' : 'text-green-600 dark:text-green-400') 
                                                                : (isMe ? 'text-red-200' : 'text-red-600 dark:text-red-400')
                                                            }`}>
                                                                {refundStatus === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                                Decision: {refundStatus}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className={`flex items-center justify-end gap-1.5 mt-2 opacity-60`}>
                                                    <p className={`text-[9px] font-black uppercase ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                    {isMe && <Check className="w-2.5 h-2.5 text-blue-100" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-3 opacity-20">
                                        <div className="p-4 rounded-3xl bg-blue-600/10">
                                            <MessageSquare className="w-12 h-12 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-widest">Start of conversation</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors">
                                <form onSubmit={handleSend} className="flex gap-3 max-w-5xl mx-auto">
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="Type your message..." 
                                        className="flex-1 px-5 py-4 bg-gray-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none text-sm dark:text-white transition-all shadow-inner" 
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim() || sending} 
                                        className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-blue-200 dark:shadow-none"
                                    >
                                        {sending ? <Loader className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-20 select-none">
                            <div className="bg-gray-100 dark:bg-slate-800 p-8 rounded-[40px] mb-6">
                                <UserIcon className="w-24 h-24" />
                            </div>
                            <p className="text-xl font-black uppercase tracking-[0.2em]">Select a contact</p>
                            <p className="text-xs font-bold uppercase mt-2">Pick a driver or sponsor to begin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
