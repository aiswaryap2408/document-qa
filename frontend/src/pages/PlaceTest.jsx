import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import Header from "../components/header";

const PlaceTest = () => {
    const [placeId, setPlaceId] = useState('birth_place');
    const [placeName, setPlaceName] = useState('kozhikode');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const getPlaceGoogleParameters = async (sPlaceId, sPlaceName) => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Use backend proxy to avoid CORS issues
            const url = `${import.meta.env.VITE_API_BASE_URL}/api/places/details?place_id=${encodeURIComponent(sPlaceId)}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            setResponse(data);
            console.log('Response:', data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = () => {
        getPlaceGoogleParameters(placeId, placeName);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFF6EB',
        }}>
            <Header backgroundImage="/svg/top_curve_dark.svg" />

            <Box sx={{ flex: 1, p: 4, maxWidth: 800, mx: 'auto', width: '100%' }}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: '#F36A2F' }}>
                    Google Places API Test
                </Typography>

                <Paper sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
                    <TextField
                        fullWidth
                        label="Place ID"
                        value={placeId}
                        onChange={(e) => setPlaceId(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Place Name"
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleTest}
                        disabled={loading}
                        sx={{
                            bgcolor: '#F36A2F',
                            '&:hover': { bgcolor: '#FF7A28' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Test API Call'}
                    </Button>
                </Paper>

                {error && (
                    <Paper sx={{ p: 3, mb: 3, bgcolor: '#FEE2E2', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, color: '#DC2626', fontWeight: 700 }}>
                            Error
                        </Typography>
                        <Typography sx={{ color: '#991B1B', fontFamily: 'monospace' }}>
                            {error}
                        </Typography>
                    </Paper>
                )}

                {response && (
                    <Paper sx={{ p: 3, bgcolor: '#F0FDF4', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#16A34A', fontWeight: 700 }}>
                            Response
                        </Typography>
                        <Box sx={{
                            bgcolor: '#1F2937',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 500
                        }}>
                            <pre style={{
                                color: '#10B981',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </Box>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default PlaceTest;
