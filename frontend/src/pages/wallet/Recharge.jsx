import React, { useState } from 'react';
import { rechargeWallet } from '../../api';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Grid, Card, CardContent, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentsIcon from '@mui/icons-material/Payments';
import Header from '../../components/header';

const Recharge = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const mobile = localStorage.getItem('mobile');
    const navigate = useNavigate();

    const presets = [100, 200, 500, 1000];

    const handleRecharge = async () => {
        if (!amount || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const res = await rechargeWallet({
                mobile,
                amount: parseFloat(amount)
            });
            if (res.data.status === 'success') {
                alert("Recharge Successful!");
                navigate('/wallet');
            }
        } catch (error) {
            console.error("Recharge failed:", error);
            alert("Payment failed. Please try again.");
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
                px: 3,
                pb: 5
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => navigate('/wallet')} sx={{ color: '#F26A2E', mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#333' }}>Add Credits</Typography>
                </Box>

                <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 2 }}>
                            <Box sx={{ width: 50, height: 50, bgcolor: '#FFF0E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PaymentsIcon sx={{ color: '#F26A2E' }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F26A2E', textTransform: 'uppercase' }}>Universal Recharge</Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>Instant balance update</Typography>
                            </Box>
                        </Box>

                        <Typography sx={{ mb: 1, fontWeight: 700, color: '#333', fontSize: '0.9rem' }}>Enter Amount (₹)</Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            InputProps={{
                                sx: {
                                    borderRadius: 3,
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    '& .MuiOutlinedInput-notchedOutline': { border: '2px solid #FFF0E6' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#F26A2E' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#F26A2E' }
                                }
                            }}
                        />

                        <Box sx={{ mt: 3, mb: 4 }}>
                            <Typography sx={{ mb: 1.5, fontWeight: 700, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase' }}>Quick Refill</Typography>
                            <Grid container spacing={2}>
                                {presets.map(p => (
                                    <Grid item xs={6} key={p}>
                                        <Button
                                            fullWidth
                                            variant={amount == p ? "contained" : "outlined"}
                                            onClick={() => setAmount(p)}
                                            sx={{
                                                borderRadius: 2,
                                                py: 1,
                                                fontWeight: 800,
                                                borderColor: '#FFF0E6',
                                                bgcolor: amount == p ? '#F26A2E' : 'transparent',
                                                color: amount == p ? 'white' : '#F26A2E',
                                                '&:hover': { borderColor: '#F26A2E', bgcolor: amount == p ? '#F26A2E' : '#FFF0E6' }
                                            }}
                                        >
                                            +₹{p}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            disabled={loading || !amount}
                            onClick={handleRecharge}
                            sx={{
                                py: 2,
                                borderRadius: 3,
                                bgcolor: '#F26A2E',
                                fontWeight: 900,
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: '0 8px 25px rgba(242,106,46,0.3)',
                                '&:hover': { bgcolor: '#FF8338' },
                                '&.Mui-disabled': { bgcolor: '#FFD7C4', color: 'white' }
                            }}
                        >
                            {loading ? 'Manifesting Credits...' : 'Proceed to Payment'}
                        </Button>
                    </CardContent>
                </Card>

                <Box sx={{ p: 2, bgcolor: '#FFF0E6', borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#A0522D', fontWeight: 600 }}>
                        Secure Payment Gateway • Instant Credits • 24/7 Support
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Recharge;
