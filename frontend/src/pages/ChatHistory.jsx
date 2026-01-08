import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatHistory } from '../api';
import { Box, Typography, Card, CardContent, Divider, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Header from '../components/header';
import HistoryIcon from '@mui/icons-material/History';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
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

    const getRoleLabel = (role) => {
        switch (role.toLowerCase()) {
            case 'user': return { label: 'You', color: 'default', icon: <PersonIcon fontSize="small" /> };
            case 'maya': return { label: 'Maya', color: 'warning', icon: <SmartToyIcon fontSize="small" /> };
            case 'guruji': return { label: 'Guruji', color: 'primary', icon: <img src="/svg/guruji.svg" style={{ width: 16, height: 16 }} alt="G" /> };
            default: return { label: role, color: 'default', icon: null };
        }
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

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <div className="spinner-indigo" style={{ width: 40, height: 40 }} />
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
                                            const { label, color, icon } = getRoleLabel(msg.role || 'user');
                                            const isUser = msg.role === 'user';
                                            return (
                                                <Box key={mIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>{label}</Typography>
                                                        {icon}
                                                    </Box>
                                                    <Box sx={{
                                                        maxWidth: '90%',
                                                        bgcolor: isUser ? '#F26A2E' : '#fff',
                                                        color: isUser ? '#fff' : '#333',
                                                        p: 1.5,
                                                        borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                                        border: isUser ? 'none' : '1px solid #eee'
                                                    }}>
                                                        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: msg.content }} />
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
