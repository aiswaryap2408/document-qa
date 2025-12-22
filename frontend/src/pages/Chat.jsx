import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, endChat } from '../api';

const Chat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Namaste! I am your Astrology Guruji. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            const { content, metrics, context } = res.data;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content,
                metrics,
                context,
                showContext: false
            }]);
        } catch (err) {
            console.error("Chat Error:", err);
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

    return (
        <div className="flex flex-col h-screen bg-gray-50 relative">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AG</span>
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Astrology Guruji
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleEndChat}
                        disabled={loading || summary}
                        className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        End Chat
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm chat-bubble ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                            <div
                                className="text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: msg.content }}
                            />

                            {msg.metrics && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center gap-4">
                                    <div className="flex gap-3 text-[10px] font-medium text-gray-400 capitalize">
                                        <span>RAG Context: {msg.metrics.rag_score}%</span>
                                        <span>Modelling: {msg.metrics.modelling_score}%</span>
                                    </div>
                                    <button
                                        onClick={() => toggleContext(i)}
                                        className="text-[10px] text-indigo-500 hover:underline font-bold"
                                    >
                                        {msg.showContext ? 'Hide Source' : 'View Source'}
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
            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask about your destiny..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading || summary}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim() || summary}
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
