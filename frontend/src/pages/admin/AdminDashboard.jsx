import React, { useState, useEffect } from 'react';
import DashboardOverview from './DashboardOverview';
import SystemPromptEditor from './SystemPromptEditor';
import EditMayaPrompt from './EditMayaPrompt';
import {
    getAllUsers as getUsers,
    getUserDetails,
    getBalance as getUserWallet,
    getTransactionHistory as getUserTransactions,
    toggleWalletSystem
} from '../../api';

const NavButton = ({ active, onClick, icon, label, themeColor }) => {
    // Explicit color mapping to ensure Tailwind picks up the classes
    const activeClasses = {
        indigo: 'bg-indigo-600 shadow-indigo-900/40',
        rose: 'bg-rose-600 shadow-rose-900/40',
        violet: 'bg-violet-600 shadow-violet-900/40',
        orange: 'bg-orange-600 shadow-orange-900/40',
        emerald: 'bg-emerald-600 shadow-emerald-900/40',
        slate: 'bg-slate-700 shadow-slate-900/40'
    };

    return (
        <button
            onClick={onClick}
            className={`w-full group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${active
                ? `${activeClasses[themeColor] || 'bg-slate-700'} text-white shadow-xl -translate-y-0.5`
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
        >
            <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <span className="ml-3.5 font-black text-xs uppercase tracking-[0.15em] relative z-10">{label}</span>
            {active && (
                <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30 rounded-full my-3 mr-1"></div>
            )}
        </button>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [detailTab, setDetailTab] = useState('history');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState({ user: null, wallet: null, transactions: [], profile: null });
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [historyDateFilter, setHistoryDateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [walletEnabled, setWalletEnabled] = useState(true);

    // RAG Tester State
    const [testFile, setTestFile] = useState(null);
    const [testStatus, setTestStatus] = useState("idle");
    const [testDocId, setTestDocId] = useState("");
    const [testInput, setTestInput] = useState("");
    const [testMessages, setTestMessages] = useState([]);
    const [testChatLoading, setTestChatLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.mobile && user.mobile.includes(searchTerm))
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await getUsers();
            const data = response?.data || response;
            const userList = Array.isArray(data) ? data : [];
            setUsers(userList);
            setFilteredUsers(userList);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (mobile) => {
        setSelectedUser(mobile);
        setDetailTab('history');
        setDetailsLoading(true);
        setSelectedSessionId(null);
        setHistoryDateFilter('');
        try {
            const [detailsRes, walletRes, transactionsRes] = await Promise.all([
                getUserDetails(mobile),
                getUserWallet(mobile),
                getUserTransactions(mobile)
            ]);

            const details = detailsRes?.data || detailsRes;
            const wallet = walletRes?.data || walletRes;
            const transactions = transactionsRes?.data || transactionsRes;

            // Combine chats and summaries into sessions for timeline
            const chats = (details?.chats || []).map(c => ({ ...c, type: 'chat' }));
            const summaries = (details?.summaries || []).map(s => ({ ...s, type: 'summary' }));
            const sessions = [...chats, ...summaries].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            setUserDetails({
                user: details?.user || details?.profile || details,
                profile: details?.profile || details?.user || details,
                wallet: wallet,
                transactions: Array.isArray(transactions) ? transactions : [],
                sessions: sessions
            });

            // Auto-select latest session if available
            if (sessions.length > 0) {
                const latest = sessions[0];
                setSelectedSessionId(latest.session_id || 'legacy');
            }
        } catch (err) {
            console.error("Failed to fetch user details", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleToggleWallet = async () => {
        const newState = !walletEnabled;
        setWalletEnabled(newState);
        try {
            await toggleWalletSystem(newState);
        } catch (err) {
            console.error("Failed to persist wallet state", err);
        }
    };

    const handleTestUpload = async () => {
        if (!testFile) return;
        setTestStatus("uploading");
        setTimeout(() => {
            setTestStatus("uploaded");
            setTestDocId("DOC_" + Math.random().toString(36).substr(2, 9).toUpperCase());
        }, 1500);
    };

    const handleTestProcess = async () => {
        setTestStatus("processing");
        setTimeout(() => {
            setTestStatus("ready");
            setTestMessages([{ role: 'system', content: 'Neural pipeline initialized. Context ready for querying.' }]);
        }, 2000);
    };

    const handleTestChat = async () => {
        if (!testInput.trim() || testChatLoading) return;
        const msg = testInput;
        setTestInput("");
        setTestMessages(prev => [...prev, { role: 'user', content: msg }]);
        setTestChatLoading(true);

        setTimeout(() => {
            setTestMessages(prev => [...prev, {
                role: 'bot',
                content: `Response based on document context for: "${msg}"`,
                context: ["Chunk 1: Source text fragment...", "Chunk 2: Relevant data point..."]
            }]);
            setTestChatLoading(false);
        }, 1000);
    };

    const processedSessions = (userDetails.sessions || []).reduce((acc, s) => {
        const sid = s.session_id || 'legacy';
        if (!acc[sid]) {
            acc[sid] = {
                session_id: sid,
                timestamp: s.timestamp,
                chats: [],
                summaries: [],
                topic: 'Consultation'
            };
        }

        if (s.type === 'chat') {
            acc[sid].chats.push(s);
            if (acc[sid].topic === 'Consultation') {
                acc[sid].topic = s.user_message?.slice(0, 40) + (s.user_message?.length > 40 ? '...' : '');
            }
        } else {
            acc[sid].summaries.push(s);
        }

        // Keep the latest timestamp for the session
        if (s.timestamp && (!acc[sid].timestamp || s.timestamp > acc[sid].timestamp)) {
            acc[sid].timestamp = s.timestamp;
        }

        return acc;
    }, {});

    const sortedSessions = Object.values(processedSessions)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .filter(s => {
            if (!historyDateFilter) return true;
            if (!s.timestamp) return false;
            let d;
            if (typeof s.timestamp === 'string') d = new Date(s.timestamp);
            else if (s.timestamp > 10000000000) d = new Date(s.timestamp);
            else d = new Date(s.timestamp * 1000);
            return d.toISOString().split('T')[0] === historyDateFilter;
        });

    return (
        <div className="flex h-screen bg-black font-sans text-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
                <div className="p-8 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600"></div>
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 italic font-black text-white text-xl">G</div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white leading-none">Guruji AI</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Terminal v2.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <NavButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                        label="Dashboard"
                        themeColor="indigo"
                    />

                    <NavButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        label="User Base"
                        themeColor="rose"
                    />

                    <NavButton
                        active={activeTab === 'maya'}
                        onClick={() => setActiveTab('maya')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        label="Maya Portal"
                        themeColor="violet"
                    />

                    <NavButton
                        active={activeTab === 'guruji'}
                        onClick={() => setActiveTab('guruji')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        label="Guruji AI"
                        themeColor="orange"
                    />

                    <NavButton
                        active={activeTab === 'tester'}
                        onClick={() => setActiveTab('tester')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                        label="RAG Testing"
                        themeColor="emerald"
                    />

                    <div className="mt-auto px-3 pb-4">
                        <NavButton
                            active={activeTab === 'system'}
                            onClick={() => setActiveTab('system')}
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            label="Setup"
                            themeColor="slate"
                        />
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'overview' ? (
                    <div className="flex-1 overflow-y-auto bg-black custom-scrollbar">
                        <DashboardOverview />
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="flex-1 flex overflow-hidden lg:flex-row flex-col">
                        {/* User List Panel */}
                        <div className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col z-10 shadow-sm">
                            <div className="p-6 space-y-4">
                                <h2 className="text-2xl font-black text-white tracking-tight">Users</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center p-8 space-y-2">
                                        <div className="w-6 h-6 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-bold text-slate-500">Loading Vault</p>
                                    </div>
                                ) : filteredUsers.map(user => (
                                    <button
                                        key={user.mobile}
                                        onClick={() => handleUserClick(user.mobile)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedUser === user.mobile ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${selectedUser === user.mobile ? 'bg-white/20' : 'bg-slate-800 text-slate-300'}`}>
                                                {user.name ? user.name[0].toUpperCase() : '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-black truncate ${selectedUser === user.mobile ? 'text-white' : 'text-slate-200'}`}>{user.name || 'Anonymous'}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-tighter ${selectedUser === user.mobile ? 'text-white/70' : 'text-slate-500'}`}>{user.mobile}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Details Panel */}
                        <div className="flex-1 bg-black overflow-hidden flex flex-col">
                            {!selectedUser ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                                    <h3 className="text-xl font-black uppercase tracking-widest">Select User</h3>
                                </div>
                            ) : detailsLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
                                        <div className="flex bg-black p-1 rounded-xl">
                                            {['history', 'wallet', 'profile'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setDetailTab(tab)}
                                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${detailTab === tab ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center space-x-3 text-right">
                                            <div>
                                                <p className="text-sm font-black leading-none text-white">{userDetails.user?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500">{userDetails.user?.mobile}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                                                {userDetails.user?.name ? userDetails.user.name[0] : '?'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden flex">
                                        {detailTab === 'history' && (
                                            <>
                                                <div className="w-64 border-r border-slate-800 bg-slate-900/30 flex flex-col overflow-hidden">
                                                    <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Filter by Date</label>
                                                        <input
                                                            type="date"
                                                            value={historyDateFilter}
                                                            onChange={(e) => setHistoryDateFilter(e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        {historyDateFilter && (
                                                            <button
                                                                onClick={() => setHistoryDateFilter('')}
                                                                className="mt-2 text-[8px] font-black text-indigo-400 uppercase tracking-tighter hover:text-indigo-300"
                                                            >
                                                                Clear Filter
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                        {sortedSessions.map(session => (
                                                            <button
                                                                key={session.session_id}
                                                                onClick={() => setSelectedSessionId(session.session_id)}
                                                                className={`w-full text-left p-6 border-b border-slate-800 transition-all ${selectedSessionId === session.session_id ? 'bg-slate-800/50 border-r-2 border-r-indigo-500' : 'hover:bg-slate-800/30'}`}
                                                            >
                                                                <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">
                                                                    {session.timestamp ? (
                                                                        (typeof session.timestamp === 'string')
                                                                            ? new Date(session.timestamp).toLocaleDateString()
                                                                            : (session.timestamp > 10000000000)
                                                                                ? new Date(session.timestamp).toLocaleDateString()
                                                                                : new Date(session.timestamp * 1000).toLocaleDateString()
                                                                    ) : 'Consultation'}
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-300 truncate">{session.topic}</p>
                                                                <p className="text-[10px] text-slate-500 mt-1 font-bold">{session.chats.length} interactions</p>
                                                            </button>
                                                        ))}
                                                        {sortedSessions.length === 0 && (
                                                            <div className="p-8 text-center text-slate-700 uppercase font-black text-[10px] tracking-widest">
                                                                No matching sessions
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                                    {selectedSessionId && processedSessions[selectedSessionId] ? (
                                                        <>
                                                            {processedSessions[selectedSessionId].summaries.map((s, i) => (
                                                                <div key={i} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl italic text-slate-300 text-sm shadow-sm">
                                                                    "{s.summary}"
                                                                </div>
                                                            ))}
                                                            <div className="space-y-6">
                                                                {processedSessions[selectedSessionId].chats.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).map((chat, i) => (
                                                                    <div key={i} className="space-y-4">
                                                                        <div className="flex justify-end">
                                                                            <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-indigo-900/40 text-sm">
                                                                                {chat.user_message}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-start">
                                                                            <div className="max-w-[85%] bg-slate-900 border border-slate-800 p-6 rounded-2xl rounded-tl-none shadow-sm text-sm">
                                                                                <div className="text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: chat.bot_response }} />
                                                                                <div className="mt-4 pt-4 border-t border-slate-800/50 flex space-x-4">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[8px] font-black text-slate-600 uppercase">RAG</span>
                                                                                        <span className="text-indigo-400 font-bold">{chat.metrics?.rag_score}%</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                                            <div className="p-4 bg-slate-900/50 rounded-full">
                                                                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Session Selected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {detailTab === 'wallet' && (
                                            <div className="flex-1 overflow-y-auto p-8 bg-black custom-scrollbar">
                                                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/30 mb-8">
                                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-2">Balance</p>
                                                    <h4 className="text-4xl font-black">₹{userDetails.wallet?.balance?.toFixed(2) || '0.00'}</h4>
                                                </div>
                                                <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/60 shadow-sm">
                                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Transactions</h5>
                                                    <table className="w-full text-left text-sm">
                                                        <thead>
                                                            <tr className="text-slate-600 text-[10px] font-black uppercase">
                                                                <th className="py-2">Date</th>
                                                                <th className="py-2">Descr</th>
                                                                <th className="py-2 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/40">
                                                            {Array.isArray(userDetails.transactions) && userDetails.transactions.map((t, i) => (
                                                                <tr key={i} className="text-slate-300">
                                                                    <td className="py-3 font-mono text-xs text-slate-500">{t.timestamp ? new Date(t.timestamp * 1000).toLocaleDateString() : 'N/A'}</td>
                                                                    <td className="py-3 font-bold">{t.description}</td>
                                                                    <td className={`py-3 text-right font-black ${t.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {t.type === 'credit' ? '+' : '-'}₹{(t.amount || 0).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        {detailTab === 'profile' && (
                                            <div className="flex-1 overflow-y-auto p-12 bg-black flex justify-center custom-scrollbar">
                                                <div className="max-w-xl w-full">
                                                    <h3 className="text-2xl font-black text-white mb-8">Personal DNA</h3>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        {[
                                                            { label: 'Name', value: userDetails.profile?.name },
                                                            { label: 'Mobile', value: userDetails.profile?.mobile },
                                                            { label: 'Email', value: userDetails.profile?.email || 'N/A' },
                                                            { label: 'Birth', value: `${userDetails.profile?.dob || ''} ${userDetails.profile?.tob || ''}` },
                                                            { label: 'Place', value: userDetails.profile?.pob || 'N/A' },
                                                            { label: 'Gender', value: userDetails.profile?.gender || 'N/A' }
                                                        ].map((item, i) => (
                                                            <div key={i} className="space-y-1">
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</label>
                                                                <p className="bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-bold text-slate-300">{item.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'maya' ? (
                    <div className="flex-1 overflow-y-auto p-12 bg-black">
                        <EditMayaPrompt />
                    </div>
                ) : activeTab === 'system' ? (
                    <div className="flex-1 overflow-y-auto p-12 bg-black">
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-2xl font-black text-white mb-6">System Control</h2>
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-200">Wallet Ecosystem</h3>
                                    <p className="text-xs text-slate-500">Enable/Disable transaction modules</p>
                                </div>
                                <button
                                    onClick={handleToggleWallet}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${walletEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 bg-white rounded-full transition-transform ${walletEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'guruji' ? (
                    <div className="flex-1 overflow-y-auto p-12 bg-black">
                        <SystemPromptEditor />
                    </div>
                ) : activeTab === 'tester' ? (
                    <div className="flex-1 overflow-y-auto p-8 bg-black flex justify-center custom-scrollbar">
                        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">1. Neural Seed</h3>
                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${testFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800'}`}>
                                        <input type="file" id="tFile" className="hidden" onChange={(e) => { setTestFile(e.target.files[0]); setTestStatus("idle"); }} />
                                        <label htmlFor="tFile" className="cursor-pointer block">
                                            <p className="text-xs font-bold text-slate-300 mb-1">{testFile ? testFile.name : "Choose Dataset"}</p>
                                            <p className="text-[9px] text-slate-600 uppercase">Max 50MB PDF/DOCX</p>
                                        </label>
                                    </div>
                                    <button onClick={handleTestUpload} disabled={!testFile || testStatus !== 'idle'} className={`w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${testFile && testStatus === 'idle' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800 text-slate-600'}`}>Upload</button>
                                    <button onClick={handleTestProcess} disabled={testStatus !== 'uploaded'} className={`w-full mt-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${testStatus === 'uploaded' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-800 text-slate-600'}`}>Quantize RAG</button>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-600">
                                        <span>Pipeline</span>
                                        <span className={testStatus === 'ready' ? 'text-indigo-400' : ''}>{testStatus}</span>
                                    </div>
                                    {testDocId && <p className="text-[9px] font-mono text-slate-600 mt-2 truncate">{testDocId}</p>}
                                </div>
                            </div>

                            <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm flex flex-col h-[600px] overflow-hidden">
                                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-600">2. Interaction Layer</span>
                                    {testStatus === 'ready' && <div className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span><span className="text-[9px] font-black text-indigo-500 uppercase">Live</span></div>}
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {testMessages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-slate-800 text-slate-200'}`}>
                                                {m.role === 'bot' ? <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content }} /> : m.content}
                                                {m.context && (
                                                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-1">
                                                        {m.context.map((c, idx) => <span key={idx} className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 font-bold">{c}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {testChatLoading && <div className="text-[10px] font-black text-slate-600 animate-pulse uppercase">Syncing...</div>}
                                </div>
                                <div className="p-4 border-t border-slate-800">
                                    <div className="flex space-x-2">
                                        <input type="text" value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleTestChat()} placeholder="Inquire document context..." disabled={testStatus !== 'ready'} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 placeholder-slate-600" />
                                        <button onClick={handleTestChat} disabled={testStatus !== 'ready' || !testInput.trim()} className={`p-3 rounded-xl transition-all ${testStatus === 'ready' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800 text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
