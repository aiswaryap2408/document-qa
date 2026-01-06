import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Header from '../components/header';
import PrimaryButton from '../components/PrimaryButton';
import GurujiImage from '../components/gurujiImg';

const RegisterSuccess = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('User');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setName(storedName);
        }
    }, []);

    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF9EF', // Light beige background
            minHeight: '100%'
        }}>
            <Header />

            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                px: 3,
                py: 1
            }}>
                {/* Guruji Image Section */}
                <Box sx={{ mt: 1, mb: 2 }}>
                    <GurujiImage />
                </Box>

                {/* Greeting */}
                <Typography variant="h6" sx={{ color: '#333', mb: 2, fontSize: '1.1rem' }}>
                    Namaste <Box component="span" sx={{ color: '#F26A2E', fontWeight: 600 }}>{name}</Box>!
                </Typography>

                {/* Highlight Box */}
                <Box sx={{
                    bgcolor: '#F3DCC0',
                    borderRadius: 2,
                    p: 2,
                    mb: 3,
                }}>
                    <Typography sx={{ color: '#111', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        We made some changes based on the most requested features!
                    </Typography>
                </Box>

                {/* Feature List */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', fontWeight: 500 }}>1.</Typography>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.4 }}>
                            <Box component="span" sx={{ color: '#F26A2E', fontWeight: 600 }}>24x7</Box> astrologer availability.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', fontWeight: 500 }}>2.</Typography>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.4 }}>
                            This is most requested, <Box component="span" sx={{ color: '#F26A2E', fontWeight: 600 }}>AI assisted consultation</Box>. We are <Box component="span" sx={{ color: '#F26A2E', fontWeight: 600 }}>introducing MAYA</Box>, an AI assistant to help you with consultations, and much more.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', fontWeight: 500 }}>3.</Typography>
                        <Typography sx={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.4 }}>
                            Better interface
                        </Typography>
                    </Box>
                </Box>

                {/* Footer Navigation */}
                <Box sx={{
                    mt: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pb: 4
                }}>
                    <PrimaryButton
                        label="Get to know MAYA"
                        sx={{
                            p: 1.2,
                            height: 48,
                            borderRadius: 6,
                            width: { xs: '90%', sm: '250px' },
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            '& .MuiButton-endIcon': {
                                ml: 0.5
                            }
                        }}
                        onClick={() => navigate('/onboarding')}
                        endIcon={<KeyboardDoubleArrowRightIcon sx={{ fontSize: 24 }} />}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default RegisterSuccess;
