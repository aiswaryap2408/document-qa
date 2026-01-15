import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { sendMessage, endChat, getChatHistory, submitFeedback } from '../api';
import axios from 'axios';

import {
    Box,
    Typography,
    IconButton,
    Rating,
    CircularProgress,
    TextField,
    Divider,
    ListItemButton
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import PrimaryButton from '../components/PrimaryButton';
import Header from "../components/header";
import ChatInputFooter from "../components/ChatInputFooter";
import FeedbackDrawer from '../components/FeedbackDrawer';


const SequentialResponse = ({ gurujiJson, onComplete, animate = false }) => {
    const p1 = gurujiJson?.para1 || '';
    const p2 = gurujiJson?.para2 || '';
    const p3 = (gurujiJson?.para3 || '') + "<br><br>" + (gurujiJson?.follow_up || gurujiJson?.followup || "🤔 What's Next?");

    const [step, setStep] = useState(animate ? 0 : 4);
    const [visibleParas, setVisibleParas] = useState(animate ? [p1] : [p1, p2, p3]);
    const textEndRef = useRef(null);

    const scrollToText = () => {
        if (animate) {
            textEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    useEffect(() => {
        if (!gurujiJson || !animate) return;

        const p1 = gurujiJson.para1 || '';
        const p2 = gurujiJson.para2 || '';
        const p3 = (gurujiJson.para3 || '') + "<br><br>" + (gurujiJson.follow_up || gurujiJson.followup || "🤔 What's Next?");

        // Animation Sequence:
        const t1 = setTimeout(() => {
            setStep(1);
            scrollToText();
        }, 2500);

        const t2 = setTimeout(() => {
            setStep(2);
            setVisibleParas([p1, p2]);
            scrollToText();
        }, 5000);

        const t3 = setTimeout(() => {
            setStep(3);
            scrollToText();
        }, 8000);

        const t4 = setTimeout(() => {
            setStep(4);
            setVisibleParas([p1, p2, p3]);
            scrollToText();
            if (onComplete) onComplete();
        }, 11000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [gurujiJson, animate]);

    useEffect(() => {
        if (animate) scrollToText();
    }, [visibleParas, step]);

    const bubbleSx = {
        p: 2,
        borderRadius: '20px 20px 20px 0',
        bgcolor: '#ff8338',
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: 'none',
        position: 'relative',
        mb: 1.5,
        maxWidth: '100%',
    };

    return (
        <Box sx={{ width: '100%' }}>
            {visibleParas.map((para, idx) => (
                <Box key={idx} sx={bubbleSx}>
                    {idx === 0 && (
                        <Typography sx={{
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            mb: 0.5,
                            color: 'rgba(255,255,255,0.9)',
                            letterSpacing: 1
                        }}>
                            Astrology Guruji
                        </Typography>
                    )}
                    <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.6, fontSize: '0.9rem' }}
                        dangerouslySetInnerHTML={{ __html: para }}
                    />
                </Box>
            ))}

            {(step === 1 || step === 3) && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2, ml: 1 }}>
                    <Box sx={{ width: 6, height: 6, bgcolor: '#ff8338', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                    <Box sx={{ width: 6, height: 6, bgcolor: '#ff8338', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                    <Box sx={{ width: 6, height: 6, bgcolor: '#ff8338', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                </Box>
            )}
            <div ref={textEndRef} style={{ height: 1 }} />
        </Box>
    );
};

const MayaIntro = ({ name, content, mayaJson, rawResponse }) => (
    <Box sx={{ px: 3, pt: 4, pb: 1, width: "100%" }}>
        <Box sx={{
            position: "relative",
            border: "2px solid #F36A2F",
            borderRadius: 2,
            p: 2,
            bgcolor: "#fcebd3",
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
            {/* Avatar */}
            <Box sx={{
                position: "absolute",
                top: -28,
                left: "50%",
                transform: "translateX(-50%)",
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "5px solid #F36A2F",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <img src="/svg/guruji_illustrated.svg" style={{ width: 45 }} alt="Maya" />
            </Box>

            {/* Content */}
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.5, color: '#444', mt: 1, whiteSpace: 'pre-line' }}>
                <strong>{name},</strong> {content}
            </Typography>

            {/* JSON Output View for Maya Intro */}
            {(mayaJson || rawResponse) && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#666', mb: 0.5, textTransform: 'uppercase' }}>
                        Receptionist JSON:
                    </Typography>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.5)',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: '#444'
                    }}>
                        {JSON.stringify(mayaJson || rawResponse, null, 2)}
                    </Box>
                </Box>
            )}
        </Box>
    </Box>
);

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "welcome! I'll connect you to our astrologer.\nYou may call him as 'Guruji'", assistant: 'maya' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [userStatus, setUserStatus] = useState('checking'); // 'checking', 'processing', 'ready', 'failed'
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [walletBalance, setWalletBalance] = useState(100);
    const [sessionId, setSessionId] = useState(`SESS_${Date.now()}`);
    const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Load Chat History (Smart Resume Logic)
    useEffect(() => {
        const loadHistory = async () => {
            if (location.state?.newSession) {
                handleNewChat();
                return;
            }
            const mobile = localStorage.getItem('mobile');
            if (mobile) {
                try {
                    const res = await getChatHistory(mobile);
                    if (res.data.sessions && res.data.sessions.length > 0) {
                        const mostRecentSession = res.data.sessions[0];
                        const history = mostRecentSession.messages;
                        if (history && history.length > 0) {
                            const lastMsg = history[history.length - 1];
                            // Relaxed Logic: Always load the most recent session to ensure sync
                            // We can add a larger threshold if needed (e.g. 24 hours), but for sync, always loading is safer.

                            setSessionId(mostRecentSession.session_id);
                            setMessages(prev => {
                                // Only append if empty or just initial greeting
                                if (prev.length > 2) return prev;
                                return [...prev, ...history];
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to load chat history:", err);
                }
            }
        };
        loadHistory();
    }, [location.state?.newSession]); // Added location.state?.newSession to dependencies

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const checkUserStatus = async () => {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                navigate('/');
                return;
            }

            try {
                // Use the configured api instance instead of raw axios
                // Add a cache-buster just in case
                const res = await api.get(`/auth/user-status/${mobile}?t=${Date.now()}`);
                const status = res.data.status;
                setUserStatus(status);
                if (res.data.user_profile?.name) {
                    setUserName(res.data.user_profile.name);
                    localStorage.setItem('userName', res.data.user_profile.name);
                }
                if (res.data.wallet_balance !== undefined) {
                    setWalletBalance(res.data.wallet_balance);
                }

                if (status === 'processing') {
                    const pollInterval = setInterval(async () => {
                        try {
                            const pollRes = await api.get(`/auth/user-status/${mobile}?t=${Date.now()}`);
                            const newStatus = pollRes.data.status;
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
                    }, 3000);
                    return () => clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Status check error:', err);
                // Fallback to ready after a failure to unblock UI if possible
                setUserStatus('ready');
            }
        };

        // Fallback: If still checking after 10 seconds, force ready to allow manual attempt
        const fallbackTimer = setTimeout(() => {
            setUserStatus(prev => prev === 'checking' ? 'ready' : prev);
        }, 10000);

        checkUserStatus();
        return () => clearTimeout(fallbackTimer);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleNewChat = () => {
        setMessages([
            { role: 'assistant', content: "welcome! \n\nI'll connect you to our astrologer.You may call him as 'Guruji'", assistant: 'maya' }
        ]);
        setSessionId(`SESS_${Date.now()}`);
        setSummary(null);
        setFeedback({ rating: 0, comment: '' });
        setFeedbackSubmitted(false);
    };

    const handleEndChat = async (keepFeedback = false) => {
        if (messages.length < 1) return;
        setShowInactivityPrompt(false);
        setLoading(true);
        try {
            const mobile = localStorage.getItem('mobile');
            const res = await endChat(mobile, messages, sessionId);
            setSummary(res.data.summary);
            if (!keepFeedback) {
                setFeedback({ rating: 0, comment: '' });
                setFeedbackSubmitted(false);
            }
        } catch (err) {
            console.error("End Chat Error:", err);
            alert("Failed to summarize chat. You can still logout.");
        } finally {
            setLoading(false);
        }
    };

    const handleDrawerSubmit = async (rating, comment) => {
        setSubmittingFeedback(true);
        try {
            const mobile = localStorage.getItem('mobile');
            await submitFeedback({
                mobile,
                session_id: sessionId,
                rating,
                feedback: comment
            });
            setFeedbackSubmitted(true);
            setFeedback({ rating, comment });

            // Fire and forget endChat
            endChat(mobile, messages, sessionId).catch(e => console.error("Silent end chat error:", e));

        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (feedback.rating === 0) {
            alert("Please provide a rating.");
            return;
        }
        setSubmittingFeedback(true);
        try {
            const mobile = localStorage.getItem('mobile');
            await submitFeedback({
                mobile,
                session_id: sessionId,
                rating: feedback.rating,
                feedback: feedback.comment
            });
            setFeedbackSubmitted(true);
        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    useEffect(() => {
        if (summary || showInactivityPrompt) return;
        const timer = setTimeout(() => {
            if (messages.length >= 2) {
                setShowInactivityPrompt(true);
            }
        }, 10 * 60 * 1000);
        return () => clearTimeout(timer);
    }, [messages, input, summary, showInactivityPrompt]);

    // Background scroll lock when modals are open
    useEffect(() => {
        if (summary || showInactivityPrompt) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [summary, showInactivityPrompt]);

    const handleSend = async (msg = null) => {
        const text = typeof msg === 'string' ? msg : input;
        if (!text.trim() || loading || userStatus !== 'ready') return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        if (typeof msg !== 'string') setInput('');
        setLoading(true);

        try {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Session error. Please log in again.' }]);
                setLoading(false);
                return;
            }
            const history = messages.slice(1);
            const res = await sendMessage(mobile, text, history, sessionId);
            const { answer, metrics, context, assistant, wallet_balance, amount, maya_json, guruji_json } = res.data;

            if (wallet_balance !== undefined) setWalletBalance(wallet_balance);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer,
                assistant: assistant || 'guruji',
                metrics,
                context,
                amount,
                rawResponse: res.data,
                mayaJson: maya_json,
                gurujiJson: guruji_json,
                animate: true
            }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            // minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF6EB',
            height: "100vh",
            // position: 'relative',
            // width: '100%'
        }}>
            <Header backgroundImage="/svg/top_curve_dark.svg" />

            <PrimaryButton
                label="End Consultation"
                onClick={() => setFeedbackDrawerOpen(true)}
                disabled={loading || messages.length < 1}
                startIcon={<CancelIcon sx={{ fontSize: 24 }} />}
                sx={{
                    position: "absolute",
                    top: 135,
                    left: 0,
                    right: 0,
                    m: "auto",
                    width: 200,
                    height: 40,
                    borderRadius: 10,
                    zIndex: 10
                }}
            />

            <FeedbackDrawer
                open={feedbackDrawerOpen}
                onClose={() => setFeedbackDrawerOpen(false)}
                onSubmit={handleDrawerSubmit}
                onAddDakshina={() => {
                    setFeedbackDrawerOpen(false);
                    navigate('/dakshina');
                }}
                onNewJourney={() => {
                    setFeedbackDrawerOpen(false);
                    handleNewChat();
                }}
            />

            {/* Chat Messages Area - Scrollable segment with visible scrollbar */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 3,
                    pb: 1,
                    "&::-webkit-scrollbar": { display: "block" },
                    scrollbarWidth: "thin",
                }}
            >
                {messages.map((msg, i) => {
                    const isFirstMaya = i === 0 && msg.assistant === 'maya';

                    if (isFirstMaya) {
                        return (
                            <MayaIntro
                                key={i}
                                name={userName}
                                content={msg.content}
                                mayaJson={msg.mayaJson}
                                rawResponse={msg.rawResponse}
                            />
                        );
                    }

                    if (msg.gurujiJson) {
                        return (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, width: '100%' }}>
                                <Box sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: 'white',
                                    border: '3px solid #F36A2F',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <img src="/svg/guruji_illustrated.svg" style={{ width: 32 }} alt="G" />
                                </Box>
                                <Box sx={{ flex: 1, maxWidth: '85%' }}>
                                    <SequentialResponse
                                        gurujiJson={msg.gurujiJson}
                                        animate={msg.animate}
                                        onComplete={() => { }}
                                    />
                                    {/* JSON Output View for Guruji Multi-bubble */}
                                    {(msg.gurujiJson || msg.mayaJson) && (
                                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', mb: 0.5, textTransform: 'uppercase' }}>
                                                Debug Data:
                                            </Typography>
                                            {msg.mayaJson && (
                                                <Box sx={{ mb: 1 }}>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700 }}>RECEPTIONIST CLASSIFICATION</Typography>
                                                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#666' }}>
                                                        {JSON.stringify(msg.mayaJson, null, 2)}
                                                    </Box>
                                                </Box>
                                            )}
                                            {msg.gurujiJson && (
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', fontWeight: 700 }}>ASTROLOGER STRUCTURED RESPONSE</Typography>
                                                    <Box sx={{ bgcolor: 'rgba(243,106,47,0.05)', p: 1, borderRadius: 1, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#444', border: '1px solid rgba(243,106,47,0.1)' }}>
                                                        {JSON.stringify(msg.gurujiJson, null, 2)}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    }

                    return (
                        <Box
                            key={i}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '100%',
                                mb: 2
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                maxWidth: '90%'
                            }}>
                                {msg.role === 'assistant' && (
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'white',
                                        border: '3px solid #F36A2F',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.assistant === 'maya' ? (
                                            <Typography sx={{ fontWeight: 800, color: '#F36A2F', fontSize: '0.9rem' }}>M</Typography>
                                        ) : (
                                            <img src="/svg/guruji_illustrated.svg" style={{ width: 32 }} alt="G" />
                                        )}
                                    </Box>
                                )}

                                <Box sx={{
                                    p: 2,
                                    borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                    bgcolor: msg.role === 'user' ? '#2f3148' : '#ff8338',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    border: 'none',
                                    position: 'relative'
                                }}>
                                    {msg.role === 'assistant' && (
                                        <Typography sx={{
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            mb: 0.5,
                                            color: 'rgba(255,255,255,0.9)',
                                            letterSpacing: 1
                                        }}>
                                            {msg.assistant === 'maya' ? 'Maya' : 'Astrology Guruji'}
                                        </Typography>
                                    )}

                                    <Typography
                                        variant="body2"
                                        sx={{ lineHeight: 1.6, fontSize: '0.9rem' }}
                                        dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />

                                    {/* JSON Output View (for regular messages) */}
                                    {(msg.mayaJson && !msg.gurujiJson) && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', mb: 0.5, textTransform: 'uppercase' }}>
                                                Debug Data:
                                            </Typography>
                                            <Box sx={{ mb: 1 }}>
                                                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>RECEPTIONIST CLASSIFICATION</Typography>
                                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'white' }}>
                                                    {JSON.stringify(msg.mayaJson, null, 2)}
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}

                                    {msg.amount > 0 && (
                                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#B45309', bgcolor: '#FEF3C7', px: 1, py: 0.2, borderRadius: 1 }}>
                                                PREMIUM: -{msg.amount} coins
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
                {loading && (
                    <Box sx={{ display: 'flex', gap: 1, p: 2, bgcolor: 'white', borderRadius: '15px 15px 15px 0', width: 'fit-content', border: '1px solid #FFEDD5' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#F36A2F', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                        <Box sx={{ width: 8, height: 8, bgcolor: '#F36A2F', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                        <Box sx={{ width: 8, height: 8, bgcolor: '#F36A2F', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <ChatInputFooter
                onSend={handleSend}
                userStatus={userStatus}
                loading={loading}
                summary={summary}
            />
            {/* Same overlays as before (Inactivity, Summary, Drawer) */}
            {/* ... preserved ... */}

            {/* Inactivity Prompt Overlay */}
            {showInactivityPrompt && !summary && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                    <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 4, textAlign: 'center', maxWidth: 400, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid #F36A2F' }}>
                        <Box sx={{ width: 80, height: 80, bgcolor: '#FFF6EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                            <CancelIcon sx={{ fontSize: 50, color: '#F36A2F' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#333' }}>Still here?</Typography>
                        <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
                            Guruji is ready when you are. Would you like to wrap up this session and receive your summary?
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <ListItemButton onClick={() => setShowInactivityPrompt(false)} sx={{ borderRadius: 2, textAlign: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
                                Continue
                            </ListItemButton>
                            <ListItemButton onClick={() => { setShowInactivityPrompt(false); setFeedbackDrawerOpen(true); }} sx={{ borderRadius: 2, textAlign: 'center', justifyContent: 'center', bgcolor: '#F36A2F', color: 'white', '&:hover': { bgcolor: '#FF7A28' } }}>
                                End & Review
                            </ListItemButton>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Summary & Feedback Modal */}
            {summary && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                    <Box sx={{
                        bgcolor: 'white',
                        p: 4,
                        borderRadius: 5,
                        maxWidth: 500,
                        width: '100%',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}>
                        <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, zIndex: 2 }}>
                            <img src="/svg/header_stars.svg" style={{ width: 100, opacity: 0.1 }} alt="Stars" />
                        </Box>

                        {!feedbackSubmitted ? (
                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#F36A2F' }}>Session Insights</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#999', display: 'block', mb: 3 }}>COMPLETED CONSULTATION</Typography>

                                <Box sx={{ bgcolor: '#FFF6EB', p: 3, borderRadius: 3, borderLeft: '6px solid #F36A2F', mb: 4 }}>
                                    <Typography sx={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#555', lineHeight: 1.7 }}>
                                        "{summary}"
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Typography sx={{ fontWeight: 800, color: '#333', mb: 1 }}>Rate Guruji's Wisdom</Typography>
                                    <Rating
                                        value={feedback.rating}
                                        onChange={(_, v) => setFeedback(prev => ({ ...prev, rating: v }))}
                                        size="large"
                                        sx={{ color: '#F36A2F' }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Add a thought..."
                                        value={feedback.comment}
                                        onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                                        sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfbfb' } }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <ListItemButton onClick={() => setSummary(null)} sx={{ borderRadius: 2, justifyContent: 'center', bgcolor: '#F3F4F6' }}>
                                        Review Chat
                                    </ListItemButton>
                                    <ListItemButton
                                        onClick={handleFeedbackSubmit}
                                        disabled={submittingFeedback || feedback.rating === 0}
                                        sx={{ borderRadius: 2, justifyContent: 'center', bgcolor: '#F36A2F', color: 'white', '&:hover': { bgcolor: '#FF7A28' } }}
                                    >
                                        {submittingFeedback ? <CircularProgress size={20} color="inherit" /> : 'Submit & Close'}
                                    </ListItemButton>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#F36A2F' }}>Session Insights</Typography>
                                <Box sx={{ bgcolor: '#FFF6EB', p: 3, borderRadius: 3, borderLeft: '6px solid #F36A2F', mb: 4, textAlign: 'left' }}>
                                    <Typography sx={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#555', lineHeight: 1.7 }}>
                                        "{summary}"
                                    </Typography>
                                </Box>

                                <Box sx={{ width: 80, height: 80, bgcolor: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                                    <Box sx={{ color: '#4CAF50', fontSize: 40 }}>✓</Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Gratitude!</Typography>
                                <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
                                    Your feedback has been cast into the heavens.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <ListItemButton onClick={handleNewChat} sx={{ borderRadius: 2, justifyContent: 'center', bgcolor: '#F36A2F', color: 'white' }}>
                                        New Journey
                                    </ListItemButton>
                                    <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, justifyContent: 'center', bgcolor: '#f0f0f0' }}>
                                        Logout
                                    </ListItemButton>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}


            <style>{`
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}
`}</style>
        </Box>
    );
};

export default Chat;
