import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatHistory } from '../api';
import { Box, Typography, Card, CardContent, Divider, Chip } from '@mui/material';
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
    const [history, setHistory] = useState([]);
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
                if (res.data && res.data.history) {
                    // Sort by timestamp desc (newest first)
                    const sorted = res.data.history.sort((a, b) => b.timestamp - a.timestamp);
                    setHistory(sorted);
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
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
            <Header />

            <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: 'md', mx: 'auto', width: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ color: '#F26A2E' }} /> Chat History
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        Your past conversations and insights
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <div className="spinner-indigo" style={{ width: 40, height: 40 }} />
                    </Box>
                ) : error ? (
                    <Typography color="error" textAlign="center">{error}</Typography>
                ) : history.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: '#888' }}>
                        <QuestionAnswerIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography>No conversation history found.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {history.map((msg, index) => {
                            const { label, color, icon } = getRoleLabel(msg.role || 'user');
                            return (
                                <Card key={index} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <CardContent sx={{ p: '16px !important' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Chip
                                                icon={icon}
                                                label={label}
                                                size="small"
                                                color={color}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#999' }}>
                                                {dayjs.unix(msg.timestamp).fromNow()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#333', whiteSpace: 'pre-line' }}>
                                            {/* Truncate very long messages if needed, or show full logic */}
                                            {msg.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatHistory;
