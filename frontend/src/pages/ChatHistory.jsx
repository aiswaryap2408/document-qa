import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatHistory } from '../api';
import { Box, Typography, Card, CardContent, Divider, Chip, Accordion, AccordionSummary, AccordionDetails, Button, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Header from '../components/header';
import HistoryIcon from '@mui/icons-material/History';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AddCommentIcon from '@mui/icons-material/AddComment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ChatHistory = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                navigate('/');
                return;
            }

            try {
                const res = await getChatHistory(mobile);
                if (res.data && res.data.sessions) {
                    setSessions(res.data.sessions);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
                setError('Failed to load chat history.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    const getRoleLabel = (msg) => {
        const role = msg.role || 'user';
        const assistant = msg.assistant || '';

        if (role === 'user') {
            return { label: 'You', color: 'default', icon: <PersonIcon fontSize="small" /> };
        }

        if (assistant === 'maya' || role === 'maya') {
            return { label: 'Maya', color: 'warning', icon: <SmartToyIcon fontSize="small" /> };
        }

        if (assistant === 'guruji' || role === 'guruji') {
            return { label: 'Guruji', color: 'primary', icon: <img src="/svg/guruji_illustrated.svg" style={{ width: 16, height: 16 }} alt="G" /> };
        }

        return { label: role, color: 'default', icon: null };
    };

    const formatContent = (content) => {
        if (!content) return "";

        // Check if content is a JSON string (Guruji's new format)
        if (content.trim().startsWith('{')) {
            try {
                const data = JSON.parse(content);
                const parts = [];
                if (data.para1) parts.push(data.para1);
                if (data.para2) parts.push(data.para2);
                if (data.para3) parts.push(data.para3);
                if (data.follow_up || data.followup) {
                    parts.push(`<br>🤔 <b>${data.follow_up || data.followup}</b>`);
                }
                return parts.join("<br><br>");
            } catch (e) {
                // Not valid JSON or parsing failed, fallback to raw
                return content;
            }
        }
        return content;
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#F9FAFB',
            overflow: 'hidden'
        }}>
            <Header />

            <Box sx={{
                flex: 1,
                p: { xs: 2, sm: 3 },
                maxWidth: 'md',
                mx: 'auto',
                width: '100%',
                overflowY: 'auto',
                pb: 10 // Extra padding at bottom for better scroll feel
            }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ color: '#F26A2E' }} /> Consultation History
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        Browse your past spiritual journeys with Guruji
                    </Typography>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddCommentIcon />}
                        onClick={() => navigate('/chat', { state: { newSession: true } })}
                        sx={{
                            bgcolor: '#F26A2E',
                            color: 'white',
                            borderRadius: '30px',
                            px: 4,
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 8px 20px rgba(242, 106, 46, 0.2)',
                            '&:hover': {
                                bgcolor: '#d95a23',
                                boxShadow: '0 10px 25px rgba(242, 106, 46, 0.3)',
                            }
                        }}
                    >
                        Start New Consultation
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <div className="spinner spinner-indigo" style={{ width: 40, height: 40 }} />
                    </Box>
                ) : error ? (
                    <Typography color="error" textAlign="center">{error}</Typography>
                ) : sessions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: '#888' }}>
                        <QuestionAnswerIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography>No consultation history found.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sessions.map((session, sIndex) => (
                            <Accordion
                                key={session.session_id}
                                sx={{
                                    borderRadius: '12px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    overflow: 'hidden'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ bgcolor: '#fff', '&.Mui-expanded': { borderBottom: '1px solid #eee' } }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <Typography sx={{ fontWeight: 700, color: '#F26A2E', fontSize: '0.9rem' }}>
                                            {session.topic}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                            {dayjs.unix(session.timestamp).format('DD MMM YYYY, hh:mm A')} ({dayjs.unix(session.timestamp).fromNow()})
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: '#fafafa', p: 2 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                        pr: 1 // Padding for scrollbar
                                    }}>
                                        {session.messages.map((msg, mIndex) => {
                                            const { label, color, icon } = getRoleLabel(msg);
                                            const isUser = msg.role === 'user';
                                            return (
                                                <Box key={mIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>{label}</Typography>
                                                        {icon}
                                                    </Box>
                                                    <Box
                                                        className="chat-bubble"
                                                        sx={{
                                                            maxWidth: '95%',
                                                            bgcolor: isUser ? '#2f3148' : (msg.assistant === 'maya' ? '#FFF6EB' : '#ff8338'),
                                                            color: isUser || (msg.assistant === 'guruji' || msg.role === 'guruji') ? '#fff' : '#333',
                                                            p: 1.5,
                                                            borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                                            border: isUser ? 'none' : '1px solid rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatHistory;
