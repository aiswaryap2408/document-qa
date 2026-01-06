import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, endChat, getChatHistory } from '../api';
import axios from 'axios';

import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';

const Chat = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Namaste! I am Maya, the receptionist. How can I help you reach Guruji today! 🙏', assistant: 'maya' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [userStatus, setUserStatus] = useState('checking'); // 'checking', 'processing', 'ready', 'failed'
    const [walletBalance, setWalletBalance] = useState(100);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Load Chat History
    useEffect(() => {
        const loadHistory = async () => {
            const mobile = localStorage.getItem('mobile');
            if (mobile) {
                try {
                    const res = await getChatHistory(mobile);
                    if (res.data.history && res.data.history.length > 0) {
                        // Keep the greeting, append history
                        // Note: If history is loaded, we might want to check if the last message was a greeting
                        // But for now, simple append is safe as greeting isn't in DB.
                        setMessages(prev => {
                            // Avoid duplicates if strict mode causes double mount
                            const newHistory = res.data.history;
                            if (prev.length > 1) return prev; // Already loaded?
                            return [...prev, ...newHistory];
                        });
                    }
                } catch (err) {
                    console.error("Failed to load chat history:", err);
                }
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check user registration status on mount
    useEffect(() => {
        const checkUserStatus = async () => {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                navigate('/');
                return;
            }

            try {
                const res = await axios.get(`http://localhost:8088/auth/user-status/${mobile}`);
                const status = res.data.status;

                console.log('User status:', status);
                setUserStatus(status);
                if (res.data.wallet_balance !== undefined) {
                    setWalletBalance(res.data.wallet_balance);
                }

                // If still processing, poll every 2 seconds
                if (status === 'processing') {
                    const pollInterval = setInterval(async () => {
                        try {
                            const pollRes = await axios.get(`http://localhost:8088/auth/user-status/${mobile}`);
                            const newStatus = pollRes.data.status;
                            console.log('Polling status:', newStatus);
                            setUserStatus(newStatus);
                            if (pollRes.data.wallet_balance !== undefined) {
                                setWalletBalance(pollRes.data.wallet_balance);
                            }

                            if (newStatus === 'ready' || newStatus === 'failed') {
                                clearInterval(pollInterval);
                            }
                        } catch (err) {
                            console.error('Status polling error:', err);
                        }
                    }, 2000);

                    return () => clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Status check error:', err);
                setUserStatus('ready'); // Fallback to ready if check fails
            }
        };

        checkUserStatus();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('mobile');
        navigate('/');
    };

    const handleEndChat = async () => {
        if (messages.length < 2) {
            alert("Chat needs some interaction before ending.");
            return;
        }

        setLoading(true);
        try {
            const mobile = localStorage.getItem('mobile');
            // We pass the full history for summarization
            const res = await endChat(mobile, messages);
            setSummary(res.data.summary);
        } catch (err) {
            console.error("End Chat Error:", err);
            alert("Failed to summarize chat. You can still logout.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const mobile = localStorage.getItem('mobile');
            console.log("DEBUG: Sending chat for mobile:", mobile);

            if (!mobile) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Session error: Mobile number not found. Please log out and log back in.' }]);
                setLoading(false);
                return;
            }

            const history = messages.slice(1);

            const res = await sendMessage(mobile, input, history);
            const { answer, metrics, context, assistant, wallet_balance, amount, maya_json } = res.data;

            if (wallet_balance !== undefined) {
                setWalletBalance(wallet_balance);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer,
                assistant: assistant || 'guruji',
                metrics,
                context,
                amount,
                showContext: false,
                rawResponse: res.data, // Store the full JSON response
                mayaJson: maya_json // Store Maya's triage JSON separately
            }]);
        } catch (err) {
            console.error("Chat Error:", err);
            // Remove handover notification on error
            setMessages(prev => prev.filter(m => !m.isHandover));
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the stars.' }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleContext = (index) => {
        setMessages(prev => prev.map((msg, i) =>
            i === index ? { ...msg, showContext: !msg.showContext } : msg
        ));
    };

    const toggleJsonResponse = (index) => {
        setMessages(prev => prev.map((msg, i) =>
            i === index ? { ...msg, showJsonResponse: !msg.showJsonResponse } : msg
        ));
    };

    const toggleMayaJson = (index) => {
        setMessages(prev => prev.map((msg, i) =>
            i === index ? { ...msg, showMayaJson: !msg.showMayaJson } : msg
        ));
    };

    return (
        <div className="flex flex-col flex-1 relative overflow-hidden">
            {/* Status Banner */}
            {userStatus === 'processing' && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <span>🔮 Preparing your cosmic profile... Almost ready!</span>
                    </div>
                </div>
            )}
            {userStatus === 'failed' && (
                <div className="bg-red-500 text-white px-6 py-3 text-center text-sm font-medium">
                    ⚠️ Registration processing failed. Please contact support or try registering again.
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b px-3 sm:px-6 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => setDrawerOpen(true)} className="text-gray-600 hover:text-indigo-600 mr-1">
                        <MenuIcon />
                    </button>
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">AG</span>
                    </div>
                    <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 truncate">
                        Astrology Guruji
                    </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-2 shadow-sm">
                        <span className="text-amber-600 font-bold text-xs">🪙 {walletBalance}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs sm:text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Navigation Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '75vw', sm: 300 } }
                }}
            >
                <div
                    style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                    role="presentation"
                    onClick={() => setDrawerOpen(false)}
                    onKeyDown={() => setDrawerOpen(false)}
                >
                    {/* Drawer Header */}
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                                AG
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-lg">Astrology Guruji</div>
                                <div className="text-xs text-gray-500">Your Cosmic Guide</div>
                            </div>
                        </div>
                    </div>

                    <List sx={{ pt: 2 }}>
                        <ListItem disablePadding onClick={() => navigate('/chat')}>
                            <ListItemButton sx={{ py: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40, color: '#4F46E5' }}><HomeIcon /></ListItemIcon>
                                <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding onClick={() => navigate('/profile')}>
                            <ListItemButton sx={{ py: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40, color: '#4F46E5' }}><PersonIcon /></ListItemIcon>
                                <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding onClick={() => navigate('/history')}>
                            <ListItemButton sx={{ py: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40, color: '#4F46E5' }}><HistoryIcon /></ListItemIcon>
                                <ListItemText primary="History" primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding onClick={handleLogout}>
                            <ListItemButton sx={{ py: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40, color: '#9CA3AF' }}><LogoutIcon /></ListItemIcon>
                                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500, color: '#6B7280' }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </div>
            </Drawer>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'} mb-2`}>
                        {/* Regular User/Assistant Messages */}
                        <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                            {msg.role === 'assistant' && (
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${msg.assistant === 'maya' ? 'bg-purple-100 border-purple-200' : 'bg-indigo-100 border-indigo-200'}`}>
                                    {msg.assistant === 'maya' ? (
                                        <span className="text-sm text-purple-600 font-bold">M</span>
                                    ) : (
                                        <img src="/svg/guruji_illustrated.svg" alt="G" className="w-6 h-6 object-contain" />
                                    )}
                                </div>
                            )}

                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm chat-bubble ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : msg.assistant === 'maya'
                                    ? 'bg-purple-50 text-purple-900 border border-purple-100 rounded-bl-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                {/* Assistant Identity Tag */}
                                {msg.role === 'assistant' && (
                                    <div className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${msg.assistant === 'maya' ? 'text-purple-500' : 'text-indigo-500'}`}>
                                        {msg.assistant === 'maya' ? 'Receptionist Maya' : 'Guruji'}
                                    </div>
                                )}

                                <div
                                    className="text-sm leading-normal"
                                    dangerouslySetInnerHTML={{ __html: msg.content }}
                                />

                                {msg.amount > 0 && (
                                    <div className="mt-2 text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                        <span>✨ Premium Analysis</span>
                                        <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-700">-{msg.amount} coins</span>
                                    </div>
                                )}

                                {msg.metrics && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center gap-4">
                                        <div className="flex gap-3 text-[10px] font-medium text-gray-400 capitalize">
                                            <span>RAG: {msg.metrics.rag_score}%</span>
                                            <span>AI: {msg.metrics.modelling_score}%</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleContext(i)}
                                                className="text-[10px] text-indigo-500 hover:underline font-bold"
                                            >
                                                {msg.showContext ? 'Hide Source' : 'View Source'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Maya JSON Response Toggle */}
                                {msg.role === 'assistant' && msg.mayaJson && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={() => toggleMayaJson(i)}
                                            className="text-[10px] text-pink-500 hover:underline font-bold"
                                        >
                                            {msg.showMayaJson ? '🔽 Hide Maya JSON' : '🔼 Show Maya JSON'}
                                        </button>
                                    </div>
                                )}

                                {/* JSON Response Toggle */}
                                {msg.role === 'assistant' && msg.rawResponse && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={() => toggleJsonResponse(i)}
                                            className="text-[10px] text-purple-500 hover:underline font-bold"
                                        >
                                            {msg.showJsonResponse ? '🔽 Hide Full JSON' : '🔼 Show Full JSON'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {msg.showContext && msg.context && (
                                <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 max-w-[90%] animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase mb-2">Retrieved Context Chunks</h4>
                                    <div className="space-y-2">
                                        {msg.context.map((chunk, j) => (
                                            <div key={j} className="text-[10px] text-gray-600 bg-white p-2 rounded border border-indigo-50 italic">
                                                "{chunk.text.substring(0, 150)}..."
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Maya JSON Response Display */}
                            {msg.showMayaJson && msg.mayaJson && (
                                <div className="mt-2 p-3 bg-pink-50 rounded-xl border border-pink-200 max-w-[90%] animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-bold text-pink-700 uppercase mb-2">🧘‍♀️ Maya's Triage Decision</h4>
                                    <pre className="text-[9px] text-gray-700 bg-white p-3 rounded border border-pink-100 overflow-x-auto">
                                        {JSON.stringify(msg.mayaJson, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* JSON Response Display */}
                            {msg.showJsonResponse && msg.rawResponse && (
                                <div className="mt-2 p-3 bg-purple-50 rounded-xl border border-purple-200 max-w-[90%] animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-bold text-purple-700 uppercase mb-2">📋 Raw JSON Response</h4>
                                    <pre className="text-[9px] text-gray-700 bg-white p-3 rounded border border-purple-100 overflow-x-auto">
                                        {JSON.stringify(msg.rawResponse, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            < div className="p-4 bg-white border-t" >
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        placeholder={userStatus === 'ready' ? "Ask about your destiny..." : "Please wait while we prepare your profile..."}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading || summary || userStatus !== 'ready'}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim() || summary || userStatus !== 'ready'}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Summary Modal/Overlay */}
            {summary && (
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300 overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Summary</h2>
                            <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-semibold">Spiritual Consolation Complete</p>

                            <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-100 mb-8">
                                <p className="text-gray-700 leading-relaxed text-sm italic">"{summary}"</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSummary(null)}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Review Chat
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-200"
                                >
                                    Log out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
