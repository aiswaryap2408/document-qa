import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from "../components/header";

const Dakshina = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');

    const handleAmountSelect = (val) => {
        setAmount(val);
    };

    const handleProceed = () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        console.log(`Proceeding to payment with amount: ${amount}`);
        // Payment integration placeholder
        alert(`Proceeding to payment for ₹${amount}`);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF6EB',
        }}>
            <Header backgroundImage="/svg/top_curve_dark.svg" />

            <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <IconButton onClick={() => navigate('/chat')} sx={{ mb: 2, color: '#F36A2F' }}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#333', mb: 1, textAlign: 'center' }}>
                        Add Dakshina
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 4, textAlign: 'center' }}>
                        Your contribution supports our service.
                    </Typography>

                    {/* Predefined Amounts (Optional UX enhancement) */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {['11', '21', '51', '101'].map((val) => (
                            <Grid item xs={3} key={val}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => handleAmountSelect(val)}
                                    sx={{
                                        borderColor: amount === val ? '#F36A2F' : '#ddd',
                                        bgcolor: amount === val ? '#FFF0E3' : 'transparent',
                                        color: amount === val ? '#F36A2F' : '#666',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        '&:hover': {
                                            borderColor: '#F36A2F',
                                            bgcolor: '#FFF0E3'
                                        }
                                    }}
                                >
                                    ₹{val}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    <TextField
                        fullWidth
                        label="Enter Amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        InputProps={{
                            sx: { borderRadius: 2, bgcolor: 'white' }
                        }}
                        sx={{ mb: 4 }}
                    />

                    <Button
                        fullWidth
                        onClick={handleProceed}
                        sx={{
                            bgcolor: '#F36A2F',
                            color: 'white',
                            py: 1.5,
                            borderRadius: 10,
                            fontSize: '1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 15px rgba(243,106,47,0.3)',
                            mb: 2,
                            '&:hover': {
                                bgcolor: '#FF7A28',
                                boxShadow: '0 6px 20px rgba(243,106,47,0.4)',
                            }
                        }}
                    >
                        Proceed to Payment
                    </Button>

                    <Button
                        fullWidth
                        onClick={() => navigate('/chat', { state: { newSession: true } })}
                        sx={{
                            color: '#F36A2F',
                            py: 1,
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            border: '1px solid #F36A2F',
                            '&:hover': {
                                bgcolor: 'rgba(243,106,47,0.05)',
                            }
                        }}
                    >
                        Start New Journey
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Dakshina;
