import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getUserDetails, testUpload, testProcess, testChat } from '../../api';
import SystemPromptEditor from './SystemPromptEditor';
import EditMayaPrompt from './EditMayaPrompt';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'system', or 'tester'
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailTab, setDetailTab] = useState('history'); // 'history', 'wallet', 'profile'
    const [groupedSessions, setGroupedSessions] = useState({}); // { 'YYYY-MM-DD': { chats: [], summaries: [] } }
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Chat Tester State
    const [testFile, setTestFile] = useState(null);
    const [testFileName, setTestFileName] = useState("");
    const [testDocId, setTestDocId] = useState("");
    const [testProcessing, setTestProcessing] = useState(false);
    const [testMessages, setTestMessages] = useState([]);
    const [testInput, setTestInput] = useState("");
    const [testChatLoading, setTestChatLoading] = useState(false);
    const [testStatus, setTestStatus] = useState("idle"); // idle, uploaded, processing, ready

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (mobile) => {
        setSelectedUser(mobile);
        setSelectedDate(null);
        setDetailTab('history');
        setDetailsLoading(true);
        try {
            const res = await getUserDetails(mobile);
            const details = res.data;
            setUserDetails(details);

            // Group by date
            const groups = {};

            (details.chats || []).forEach(chat => {
                const date = new Date(chat.timestamp * 1000).toLocaleDateString('en-CA'); // YYYY-MM-DD
                if (!groups[date]) groups[date] = { chats: [], summaries: [] };
                groups[date].chats.push(chat);
            });

            (details.summaries || []).forEach(summary => {
                const date = new Date(summary.timestamp * 1000).toLocaleDateString('en-CA');
                if (!groups[date]) groups[date] = { chats: [], summaries: [] };
                groups[date].summaries.push(summary);
            });

            // Sort dates descending
            const sortedGroups = Object.keys(groups)
                .sort((a, b) => b.localeCompare(a))
                .reduce((acc, key) => {
                    acc[key] = groups[key];
                    return acc;
                }, {});

            setGroupedSessions(sortedGroups);

            // Auto-select latest date if available
            const dates = Object.keys(sortedGroups);
            if (dates.length > 0) {
                setSelectedDate(dates[0]);
            }
        } catch (err) {
            console.error("Failed to fetch user details", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile.includes(searchTerm)
    );

    const sortedDates = Object.keys(groupedSessions);

    // --- Chat Tester Handlers ---
    const handleTestUpload = async () => {
        if (!testFile) return;
        setTestStatus("uploading");
        try {
            const formData = new FormData();
            formData.append('file', testFile);
            const res = await testUpload(formData);
            setTestFileName(res.data.filename);
            setTestStatus("uploaded");
        } catch (err) {
            console.error("Test upload failed", err);
            setTestStatus("error");
        }
    };

    const handleTestProcess = async () => {
        if (!testFileName) return;
        setTestStatus("processing");
        try {
            const res = await testProcess(testFileName);
            setTestDocId(res.data.doc_id);
            setTestStatus("ready");
            setTestMessages([{ role: 'system', content: `Indexed ${res.data.chunks} chunks. Ready to chat!` }]);
        } catch (err) {
            console.error("Test process failed", err);
            setTestStatus("error");
        }
    };

    const handleTestChat = async () => {
        if (!testInput.trim()) return;
        const userMsg = testInput;
        setTestInput("");
        setTestMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setTestChatLoading(true);

        try {
            const res = await testChat(userMsg, testDocId);
            setTestMessages(prev => [...prev, { role: 'bot', content: res.data.response, context: res.data.context_used }]);
        } catch (err) {
            console.error("Test chat failed", err);
            setTestMessages(prev => [...prev, { role: 'error', content: "Failed to get response." }]);
        } finally {
            setTestChatLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        A
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-1 rounded-md hover:bg-red-50"
                >
                    Logout
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 p-4 space-y-2 flex flex-col overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-3 ${activeTab === 'users' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span className="hidden lg:inline">User Management</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-3 ${activeTab === 'system' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="hidden lg:inline">System Config</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('maya')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-3 ${activeTab === 'maya' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="hidden lg:inline">Maya (Receptionist)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tester')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-3 ${activeTab === 'tester' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <span className="hidden lg:inline">RAG Tester</span>
                    </button>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === 'users' ? (
                        <div className="flex-1 flex overflow-hidden">
                            {/* User List Panel */}
                            <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
                                <div className="p-4 border-b border-gray-200 space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900">Users</h2>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Name or mobile..."
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                                    {loading ? (
                                        <div className="p-8 text-center text-gray-400 animate-pulse">Loading users...</div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm italic">No users found</div>
                                    ) : filteredUsers.map(user => (
                                        <button
                                            key={user.mobile}
                                            onClick={() => handleUserClick(user.mobile)}
                                            className={`w-full text-left p-4 transition-all duration-200 flex items-center space-x-3 ${selectedUser === user.mobile ? 'bg-red-50 border-r-4 border-red-500' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedUser === user.mobile ? 'bg-red-500 text-white shadow-md' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {user.name ? user.name[0].toUpperCase() : '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${selectedUser === user.mobile ? 'text-red-700' : 'text-gray-900'}`}>{user.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{user.mobile}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Details/Session Panel */}
                            <div className="flex-1 flex overflow-hidden bg-gray-50/50">
                                {!selectedUser ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
                                        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-600">Select a User</h3>
                                        <p className="text-sm max-w-xs text-center mt-2">Pick someone from the list to view their deep dive session history.</p>
                                    </div>
                                ) : detailsLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="flex flex-col items-center">
                                            <div className="spinner spinner-indigo w-12 h-12 mb-4"></div>
                                            <p className="text-sm font-medium text-gray-500">Retrieving chat records...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Detail Tabs */}
                                        <div className="bg-white border-b border-gray-200 px-6 flex space-x-8 z-10 shrink-0">
                                            {[
                                                { id: 'history', label: 'Session History', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                                                { id: 'wallet', label: 'Wallet & Transactions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                                                { id: 'profile', label: 'User Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setDetailTab(tab.id)}
                                                    className={`py-4 text-xs font-bold uppercase tracking-widest flex items-center space-x-2 border-b-2 transition-all ${detailTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
                                                    <span>{tab.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-1 flex overflow-hidden">
                                            {detailTab === 'history' && (
                                                <>
                                                    {/* Interaction Dates List */}
                                                    <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
                                                        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Dates</span>
                                                        </div>
                                                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                                                            {sortedDates.length === 0 ? (
                                                                <div className="p-8 text-center text-gray-400 text-xs italic">No interactions yet</div>
                                                            ) : sortedDates.map(date => (
                                                                <button
                                                                    key={date}
                                                                    onClick={() => setSelectedDate(date)}
                                                                    className={`w-full text-left p-4 text-sm font-medium transition-all ${selectedDate === date ? 'bg-orange-50 text-orange-700 border-r-4 border-orange-500' : 'text-gray-600 hover:bg-gray-50'}`}
                                                                >
                                                                    {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    <div className="flex space-x-2 mt-1">
                                                                        <span className="text-[9px] bg-gray-100 px-1 rounded">{groupedSessions[date].chats.length} chats</span>
                                                                        {groupedSessions[date].summaries.length > 0 && <span className="text-[9px] bg-yellow-100 px-1 rounded">Summary</span>}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Date Details Area */}
                                                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                                        {selectedDate ? (
                                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                                {/* Session Header */}
                                                                <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                                                                    <div>
                                                                        <h4 className="text-lg font-bold text-gray-900">
                                                                            {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-500">Interaction details for {userDetails.profile?.name}</p>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-tight">
                                                                            {groupedSessions[selectedDate].chats.length} Messages
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Conversations & Summaries Scrollable Area */}
                                                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50/30">
                                                                    {/* Summaries first for context */}
                                                                    {groupedSessions[selectedDate].summaries.length > 0 && (
                                                                        <div className="space-y-4">
                                                                            <h5 className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest border-b border-yellow-100 pb-1">AI Summaries</h5>
                                                                            {groupedSessions[selectedDate].summaries.map((s, idx) => (
                                                                                <div key={idx} className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl shadow-sm italic text-gray-700 text-sm leading-relaxed relative">
                                                                                    <div className="absolute -top-2 -left-2 bg-yellow-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">Summary</div>
                                                                                    "{s.summary}"
                                                                                    <div className="text-[9px] text-yellow-500 mt-2 text-right font-medium">
                                                                                        {new Date(s.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Chats */}
                                                                    <div className="space-y-6">
                                                                        <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1">Conversation Feed</h5>
                                                                        {groupedSessions[selectedDate].chats.map((chat, idx) => (
                                                                            <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                                <div className="flex justify-end">
                                                                                    <div className="max-w-[85%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md text-sm">
                                                                                        <p className="font-semibold mb-1 text-[10px] text-indigo-200 uppercase">User</p>
                                                                                        {chat.user_message}
                                                                                        <p className="text-[9px] text-indigo-200 mt-2 text-right">
                                                                                            {new Date(chat.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-start">
                                                                                    <div className="max-w-[85%] bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                                                                                        <p className="font-semibold mb-1 text-[10px] text-red-500 uppercase tracking-wide">Guruji's Insights</p>
                                                                                        {chat.bot_response}

                                                                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                                                                            {chat.metrics && (
                                                                                                <div className="flex space-x-3">
                                                                                                    <span className="text-[9px] font-bold text-green-600">RAG: {chat.metrics.rag_score}%</span>
                                                                                                    <span className="text-[9px] font-bold text-purple-600">Model: {chat.metrics.modelling_score}%</span>
                                                                                                </div>
                                                                                            )}
                                                                                            <p className="text-[9px] text-gray-400">
                                                                                                {new Date(chat.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                <p className="text-sm">Select a date from the timeline to view history</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {detailTab === 'wallet' && (
                                                <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-gray-50 custom-scrollbar">
                                                    {/* Wallet Overview */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                                                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Available Balance</p>
                                                            <h4 className="text-3xl font-black mb-4">₹{userDetails.wallet?.balance?.toFixed(2) || '0.00'}</h4>
                                                            <div className="flex items-center space-x-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded">
                                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                                <span>Active Wallet</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm col-span-2">
                                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Stats</h5>
                                                            <div className="flex justify-between items-center h-full">
                                                                <div>
                                                                    <p className="text-2xl font-bold text-gray-900">{userDetails.transactions?.length || 0}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Transactions</p>
                                                                </div>
                                                                <div className="h-10 w-px bg-gray-100"></div>
                                                                <div>
                                                                    <p className="text-2xl font-bold text-green-600">₹{userDetails.transactions?.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0).toFixed(2) || '0.00'}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Credited</p>
                                                                </div>
                                                                <div className="h-10 w-px bg-gray-100"></div>
                                                                <div>
                                                                    <p className="text-2xl font-bold text-red-500">₹{userDetails.transactions?.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0).toFixed(2) || '0.00'}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Spent</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Transaction History */}
                                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-12 flex flex-col max-h-[500px]">
                                                        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center shrink-0">
                                                            <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Transaction History</h5>
                                                        </div>
                                                        <div className="overflow-y-auto custom-scrollbar flex-1">
                                                            <table className="w-full text-left text-sm relative">
                                                                <thead className="sticky top-0 z-20">
                                                                    <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                                                        <th className="px-6 py-3">Date</th>
                                                                        <th className="px-6 py-3">Description</th>
                                                                        <th className="px-6 py-3">Type</th>
                                                                        <th className="px-6 py-3">Status</th>
                                                                        <th className="px-6 py-3 text-right">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {userDetails.transactions?.map((t, i) => (
                                                                        <tr key={i} className="hover:bg-gray-50/30 transition-all">
                                                                            <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{new Date(t.timestamp * 1000).toLocaleString()}</td>
                                                                            <td className="px-6 py-4 font-medium text-gray-900">{t.description}</td>
                                                                            <td className="px-6 py-4">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${t.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                    {t.type}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${t.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                                    {t.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className={`px-6 py-4 text-right font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                                                                {t.type === 'credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            {(userDetails.transactions?.length === 0) && (
                                                                <div className="p-12 text-center text-gray-400 text-xs italic">No transactions found</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {detailTab === 'profile' && (
                                                <div className="flex-1 overflow-y-auto p-12 bg-white flex justify-center custom-scrollbar">
                                                    <div className="max-w-2xl w-full">
                                                        <div className="flex items-center space-x-6 mb-12">
                                                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-4 ring-white">
                                                                {userDetails.profile?.name ? userDetails.profile.name[0] : '?'}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{userDetails.profile?.name}</h3>
                                                                <p className="text-sm font-medium text-gray-400">Registered on {new Date(userDetails.profile?.created_at * 1000).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-8">
                                                            {[
                                                                { label: 'Mobile Number', value: userDetails.profile?.mobile, icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                                                                { label: 'Email Address', value: userDetails.profile?.email, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                                                                { label: 'Date of Birth', value: userDetails.profile?.dob, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                                                                { label: 'Time of Birth', value: userDetails.profile?.tob, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                                                { label: 'Place of Birth', value: userDetails.profile?.pob, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                                                                { label: 'Gender', value: userDetails.profile?.gender, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                                                            ].map((item, idx) => (
                                                                <div key={idx} className="space-y-1">
                                                                    <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
                                                                        <span>{item.label}</span>
                                                                    </div>
                                                                    <p className="text-sm font-bold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{item.value || 'N/A'}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'maya' ? (
                        <div className="flex-1 overflow-y-auto p-12 bg-white">
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Maya Receptionist Config</h2>
                                <EditMayaPrompt />
                            </div>
                        </div>
                    ) : activeTab === 'system' ? (
                        <div className="flex-1 overflow-y-auto p-12 bg-white">
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">System Configuration</h2>
                                <SystemPromptEditor />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-12 bg-gray-50 flex justify-center custom-scrollbar">
                            <div className="max-w-4xl w-full">
                                <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">RAG Pipeline Tester</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Control Panel */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">1. Document Setup</h3>

                                            <div className="space-y-4">
                                                <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${testFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-red-400'}`}>
                                                    <input
                                                        type="file"
                                                        id="testFile"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            setTestFile(e.target.files[0]);
                                                            setTestStatus("idle");
                                                        }}
                                                    />
                                                    <label htmlFor="testFile" className="cursor-pointer block">
                                                        <svg className={`w-8 h-8 mx-auto mb-2 ${testFile ? 'text-green-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                        <p className="text-xs font-bold text-gray-600 truncate px-2">{testFile ? testFile.name : "Select Document"}</p>
                                                    </label>
                                                </div>

                                                <button
                                                    onClick={handleTestUpload}
                                                    disabled={!testFile || testStatus === "uploading" || testStatus === "uploaded" || testStatus === "ready"}
                                                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${testFile && testStatus === "idle" ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {testStatus === "uploading" ? "Uploading..." : "Upload File"}
                                                </button>

                                                <button
                                                    onClick={handleTestProcess}
                                                    disabled={testStatus !== "uploaded"}
                                                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${testStatus === "uploaded" ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {testStatus === "processing" ? "Processing..." : "Process for RAG"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                                    <span className="text-gray-400">Pipeline State</span>
                                                    <span className={`px-2 py-0.5 rounded ${testStatus === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{testStatus}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                                    <span className="text-gray-400">Doc ID</span>
                                                    <span className="text-gray-900 font-mono text-[9px] truncate ml-2" title={testDocId}>{testDocId || 'None'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                                        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest">2. Validation Chat</h5>
                                            {testStatus === 'ready' && <span className="text-[10px] font-bold text-green-500 uppercase flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Context Locked</span>}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                            {testMessages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                                                    <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                    <p className="text-sm font-medium italic">Upload and process a document to start testing.</p>
                                                </div>
                                            ) : testMessages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' :
                                                        msg.role === 'system' ? 'bg-gray-100 text-gray-500 italic text-[10px]' :
                                                            msg.role === 'error' ? 'bg-red-50 text-red-600' :
                                                                'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                        }`}>
                                                        {msg.role === 'bot' ? (
                                                            <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                        ) : (
                                                            msg.content
                                                        )}
                                                        {msg.context && (
                                                            <div className="mt-3 pt-2 border-t border-gray-50">
                                                                <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Context Chunks:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {msg.context.map((c, idx) => (
                                                                        <span key={idx} className="bg-indigo-50 text-indigo-600 text-[8px] px-1.5 py-0.5 rounded border border-indigo-100">{c}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {testChatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                                                        <div className="flex space-x-1">
                                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    placeholder={testStatus === 'ready' ? "Ask something about the doc..." : "Waiting for document..."}
                                                    disabled={testStatus !== 'ready' || testChatLoading}
                                                    value={testInput}
                                                    onChange={(e) => setTestInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleTestChat()}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                                <button
                                                    onClick={handleTestChat}
                                                    disabled={testStatus !== 'ready' || testChatLoading || !testInput.trim()}
                                                    className={`p-3 rounded-xl transition-all ${testStatus === 'ready' && !testChatLoading && testInput.trim() ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Added CSS for custom scrollbar and HTML table rendering */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 3px solid #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                /* Table styles for HTML content in chat */
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 12px 0;
                    font-size: 12px;
                }
                table thead { 
                    background: #f3f4f6; 
                    font-weight: 600;
                }
                table th, table td { 
                    padding: 8px 12px; 
                    border: 1px solid #e5e7eb; 
                    text-align: left;
                }
                table tbody tr:hover { 
                    background: #f9fafb; 
                }
                table th {
                    color: #374151;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.5px;
                }
                table td b {
                    font-weight: 600;
                    color: #1f2937;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
