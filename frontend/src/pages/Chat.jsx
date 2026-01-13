import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, endChat, getChatHistory, submitFeedback } from '../api';
import axios from 'axios';

import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    IconButton,
    Rating,
    CircularProgress,
    TextField,
    Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import PrimaryButton from '../components/PrimaryButton';
import Header from "../components/header";
import ChatInputFooter from "../components/ChatInputFooter";

const MayaIntro = ({ name, content }) => (
    <Box sx={{ px: 3, pt: 2, pb: 1, width: "100%" }}>
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
            <Typography sx={{ mb: 1.5, fontWeight: 700, color: '#333', textAlign: 'center', mt: 1 }}>
                Namaste!
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#444' }}>
                {content}
            </Typography>
        </Box>
    </Box>
);

const Chat = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'I am Maya, the receptionist. How can I help you reach Guruji today! 🙏', assistant: 'maya' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [userStatus, setUserStatus] = useState('checking'); // 'checking', 'processing', 'ready', 'failed'
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
    }, []);

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
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/user-status/${mobile}`);
                const status = res.data.status;
                setUserStatus(status);
                if (res.data.wallet_balance !== undefined) {
                    setWalletBalance(res.data.wallet_balance);
                }

                if (status === 'processing') {
                    const pollInterval = setInterval(async () => {
                        try {
                            const pollRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/user-status/${mobile}`);
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
                    }, 2000);
                    return () => clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Status check error:', err);
                setUserStatus('ready');
            }
        };
        checkUserStatus();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleNewChat = () => {
        setMessages([
            { role: 'assistant', content: 'I am Maya, the receptionist. How can I help you reach Guruji today! 🙏', assistant: 'maya' }
        ]);
        setSessionId(`SESS_${Date.now()}`);
        setSummary(null);
        setFeedback({ rating: 0, comment: '' });
        setFeedbackSubmitted(false);
        setDrawerOpen(false);
    };

    const handleEndChat = async () => {
        if (messages.length < 1) return;
        setShowInactivityPrompt(false);
        setLoading(true);
        try {
            const mobile = localStorage.getItem('mobile');
            const res = await endChat(mobile, messages, sessionId);
            setSummary(res.data.summary);
            setFeedback({ rating: 0, comment: '' });
            setFeedbackSubmitted(false);
        } catch (err) {
            console.error("End Chat Error:", err);
            alert("Failed to summarize chat. You can still logout.");
        } finally {
            setLoading(false);
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
        if (summary || showInactivityPrompt || drawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [summary, showInactivityPrompt, drawerOpen]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading || userStatus !== 'ready') return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Session error. Please log in again.' }]);
                setLoading(false);
                return;
            }
            const history = messages.slice(1);
            const res = await sendMessage(mobile, input, history, sessionId);
            const { answer, metrics, context, assistant, wallet_balance, amount, maya_json } = res.data;

            if (wallet_balance !== undefined) setWalletBalance(wallet_balance);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer,
                assistant: assistant || 'guruji',
                metrics,
                context,
                amount,
                rawResponse: res.data,
                mayaJson: maya_json
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
                onClick={handleEndChat}
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

                    // bgcolor: '#F36A2F',
                    // boxShadow: '0 4px 12px rgba(243,106,47,0.3)',
                    // '&:hover': { bgcolor: '#FF7A28' }
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
                        return <MayaIntro key={i} content={msg.content} />;
                    }

                    return (
                        <Box
                            key={i}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '100%'
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
                                    bgcolor: msg.role === 'user' ? '#F36A2F' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#333',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    border: msg.role === 'user' ? 'none' : '1px solid #FFEDD5',
                                    position: 'relative'
                                }}>
                                    {msg.role === 'assistant' && (
                                        <Typography sx={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            mb: 0.5,
                                            color: msg.assistant === 'maya' ? '#9333ea' : '#F36A2F',
                                            letterSpacing: 0.5
                                        }}>
                                            {msg.assistant === 'maya' ? 'Receptionist Maya' : 'Astrology Guruji'}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="body2"
                                        sx={{ lineHeight: 1.6, fontSize: '0.9rem' }}
                                        dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />
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

            {/* Input Section - Cleaned up to remove dark SVG background */}
            <Box sx={{
                flexShrink: 0,
                width: '100%',
                bgcolor: '#FFF6EB',
                pt: 1, // Reduced padding as background SVG is gone
                pb: 3, // Slightly more padding at bottom
                px: 2,
                display: 'flex',
                justifyContent: 'center',
            }}>
                <Box sx={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        bgcolor: 'white',
                        p: 0.5,
                        pl: 2,
                        borderRadius: 10,
                        boxShadow: '0 8px 32px rgba(243,106,47,0.15)',
                        border: '2px solid #F36A2F'
                    }}>
                        <input
                            type="text"
                            placeholder={userStatus === 'ready' ? "Ask the stars..." : "Preparing..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading || summary || userStatus !== 'ready'}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                border: 'none',
                                outline: 'none',
                                fontSize: '0.95rem',
                                background: 'transparent'
                            }}
                        />
                        <IconButton
                            onClick={handleSend}
                            disabled={loading || !input.trim() || summary || userStatus !== 'ready'}
                            sx={{
                                bgcolor: '#F36A2F',
                                color: 'white',
                                '&:hover': { bgcolor: '#FF7A28' },
                                '&:disabled': { bgcolor: '#FFD7C2' },
                                width: 44,
                                height: 44,
                                m: 0.5
                            }}
                        >
                            <KeyboardDoubleArrowRightIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

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
                            <ListItemButton onClick={handleEndChat} sx={{ borderRadius: 2, textAlign: 'center', justifyContent: 'center', bgcolor: '#F36A2F', color: 'white', '&:hover': { bgcolor: '#FF7A28' } }}>
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
                                <Box sx={{ width: 80, height: 80, bgcolor: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                                    <Box sx={{ color: '#4CAF50', fontSize: 40 }}>✓</Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Gratitude!</Typography>
                                <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
                                    Your feedback has been cast into the heavens. May your journey be enlightened.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
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

            {/* Navigation Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '80vw', sm: 320 }, bgcolor: '#FFF6EB' }
                }}
            >
                <Box sx={{ p: 4, bgcolor: '#F36A2F', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ width: 60, height: 60, bgcolor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.3)' }}>
                            <img src="/svg/guruji_illustrated.svg" style={{ width: 45 }} alt="Logo" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>Astrology<br />Guruji</Typography>
                        </Box>
                    </Box>
                </Box>

                <List sx={{ p: 2 }}>
                    <ListItem disablePadding onClick={handleNewChat} sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 2, py: 1.5 }}>
                            <ListItemIcon><AddCommentIcon sx={{ color: '#F36A2F' }} /></ListItemIcon>
                            <ListItemText primary="New Consultation" primaryTypographyProps={{ fontWeight: 800, color: '#F36A2F' }} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding onClick={() => navigate('/chat')} sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 2, py: 1.5 }}>
                            <ListItemIcon><HomeIcon /></ListItemIcon>
                            <ListItemText primary="Home" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding onClick={() => navigate('/history')} sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 2, py: 1.5 }}>
                            <ListItemIcon><HistoryIcon /></ListItemIcon>
                            <ListItemText primary="Past Journeys" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding onClick={() => navigate('/profile')} sx={{ mb: 1 }}>
                        <ListItemButton sx={{ borderRadius: 2, py: 1.5 }}>
                            <ListItemIcon><PersonIcon /></ListItemIcon>
                            <ListItemText primary="My Profile" />
                        </ListItemButton>
                    </ListItem>
                    <Divider sx={{ my: 2, opacity: 0.5 }} />
                    <ListItem disablePadding onClick={handleLogout}>
                        <ListItemButton sx={{ borderRadius: 2, py: 1.5 }}>
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Sign Out" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>

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
