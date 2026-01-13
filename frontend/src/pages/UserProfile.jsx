import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Card, CardContent, Divider, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Header from '../components/header';

const UserProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                navigate('/');
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/user-status/${mobile}`);
                if (res.data.user_profile) {
                    setUser(res.data.user_profile);
                } else {
                    setError('Profile not found.');
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError('Failed to load profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const InfoRow = ({ icon, label, value }) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ color: '#F26A2E', mr: 2, mt: 0.5 }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                    {value || 'Not provided'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF6EB',
            overflow: 'hidden'
        }}>
            {/* Header Section - Wrapped to provide a solid background for the top logo area */}
            <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 100, bgcolor: '#FFF6EB' }}>
                <Header />
            </Box>

            {/* Scrollable Content */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                position: 'relative',
                zIndex: 10,
                mt: -10, // Pull up to overlap the curve
                px: 2,
                pb: 5
            }}>
                {/* Profile Header Block */}
                <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
                    <Box
                        sx={{
                            width: 100,
                            height: 100,
                            bgcolor: '#fff',
                            borderRadius: '50%',
                            mx: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            border: '4px solid #fff'
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 60, color: '#F26A2E' }} />
                    </Box>
                    <Typography variant="h5" sx={{ mt: 2, fontWeight: 700, color: '#111' }}>
                        {user?.name || 'User Profile'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        {user?.mobile}
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <div className="spinner-indigo" style={{ width: 40, height: 40 }} />
                    </Box>
                ) : error ? (
                    <Typography color="error" textAlign="center" sx={{ mt: 4 }}>{error}</Typography>
                ) : (
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'visible', maxWidth: 'md', mx: 'auto' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ mb: 3, color: '#F26A2E', fontWeight: 600, borderBottom: '2px solid #FFF0E6', pb: 1, display: 'inline-block' }}>
                                Personal & Birth Details
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow icon={<EmailIcon />} label="Email" value={user.email} />
                                    <InfoRow icon={<PhoneIcon />} label="Mobile" value={user.mobile} />
                                    <InfoRow icon={<PersonIcon />} label="Gender" value={user.gender} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow icon={<CalendarMonthIcon />} label="Date of Birth" value={user.dob} />
                                    <InfoRow icon={<AccessTimeIcon />} label="Time of Birth" value={user.tob} />
                                    <InfoRow icon={<PlaceIcon />} label="Place of Birth" value={user.pob} />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f0f0f0' }}>
                                <InfoRow
                                    icon={<Typography variant="h6" sx={{ lineHeight: 1 }}>🗺️</Typography>}
                                    label="Chart Style"
                                    value={user.chart_style}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
};

export default UserProfile;
