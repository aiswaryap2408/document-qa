import React, { useState, useEffect } from 'react';
import { getBalance, getTransactionHistory } from '../../api';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, IconButton, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import Header from '../../components/header';

const Wallet = () => {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const mobile = localStorage.getItem('mobile');
    const navigate = useNavigate();

    useEffect(() => {
        if (!mobile) {
            navigate('/');
            return;
        }
        fetchWalletData();
    }, [mobile]);

    const fetchWalletData = async () => {
        try {
            const balanceRes = await getBalance(mobile);
            setBalance(balanceRes.data.balance || 0);

            const historyRes = await getTransactionHistory(mobile);
            setHistory(historyRes.data.history || []);
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF6EB',
            overflow: 'hidden'
        }}>
            <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 100, bgcolor: '#FFF6EB' }}>
                <Header />
            </Box>

            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                position: 'relative',
                zIndex: 10,
                mt: -10,
                px: 2,
                pb: 5
            }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 120,
                        height: 120,
                        bgcolor: '#F26A2E',
                        borderRadius: '50%',
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(242,106,46,0.3)',
                        mb: 2
                    }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 60, color: '#fff' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#111' }}>My Wallet</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>Secure cosmic credit management</Typography>
                </Box>

                <Card sx={{
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #F26A2E 0%, #FF8338 100%)',
                    color: 'white',
                    p: 3,
                    mb: 4,
                    boxShadow: '0 10px 30px rgba(242,106,46,0.2)'
                }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.8, letterSpacing: 1.5 }}>Available Balance</Typography>
                    <Typography variant="h2" sx={{ fontWeight: 900, my: 1 }}>₹{balance.toFixed(2)}</Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/wallet/recharge')}
                        sx={{
                            mt: 2,
                            bgcolor: 'white',
                            color: '#F26A2E',
                            fontWeight: 800,
                            borderRadius: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': { bgcolor: '#FFF0E6' }
                        }}
                    >
                        Recharge Wallet
                    </Button>
                </Card>

                <Box sx={{ mb: 2, px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon sx={{ color: '#F26A2E' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#333' }}>Transaction History</Typography>
                </Box>

                <Box sx={{ spaceY: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <div className="spinner-indigo" style={{ width: 30, height: 30 }} />
                        </Box>
                    ) : history.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 3, border: '1px dashed #ccc' }}>
                            <Typography sx={{ color: '#888', fontStyle: 'italic' }}>No cosmic interactions yet.</Typography>
                        </Box>
                    ) : (
                        history.map((tx, idx) => (
                            <Box key={idx} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 3,
                                mb: 1.5,
                                border: '1px solid #FFF0E6',
                                transition: 'all 0.2s',
                                '&:active': { transform: 'scale(0.98)' }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 40, h: 40, borderRadius: 2,
                                        bgcolor: tx.type === 'credit' ? '#E8F5E9' : '#FFEBEE',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {tx.type === 'credit' ?
                                            <Typography sx={{ color: '#2E7D32', fontWeight: 900 }}>+</Typography> :
                                            <Typography sx={{ color: '#C62828', fontWeight: 900 }}>-</Typography>
                                        }
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>{tx.description}</Typography>
                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{
                                        fontWeight: 900,
                                        color: tx.type === 'credit' ? '#2E7D32' : '#C62828'
                                    }}>
                                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        fontWeight: 800,
                                        color: tx.status === 'success' ? '#4CAF50' : '#F44336',
                                        textTransform: 'uppercase',
                                        fontSize: '0.65rem'
                                    }}>
                                        {tx.status}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Wallet;
