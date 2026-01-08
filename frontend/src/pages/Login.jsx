import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp } from '../api';
import { Box, Typography, TextField, ThemeProvider } from "@mui/material";
import Header from "../components/header";
import PrimaryButton from "../components/PrimaryButton";
import GurujiImage from "../components/gurujiImg";
import theme from "../theme/theme";

const Login = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleMobileSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!/^\d{10}$/.test(mobile)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);
        try {
            await sendOtp(mobile);
            localStorage.setItem('mobile', mobile);
            navigate('/verify');
        } catch (err) {
            console.error("API Error details:", err);
            const msg = err.response?.data?.detail;
            const errorMsg = Array.isArray(msg) ? msg[0].msg : (msg || err.message);
            setError(`Failed to send OTP: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            {/* Content */}
            <Box textAlign="center" px={3} pb={4} sx={{ flexGrow: 1 }}>
                <Box mt={2}>
                    <GurujiImage />

                    <Typography fontSize={16} mt={1} color="text.primary">
                        Welcome to <strong style={{ color: "#dc5d35" }}>Findastro</strong>!
                    </Typography>

                </Box>

                <Typography
                    mt={4}
                    mb={2}
                    fontSize={15}
                    fontWeight={700}
                    color="primary"
                >
                    Login / Sign-in with your phone number:
                </Typography>

                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {/* Phone Input */}
                <Box
                    sx={{
                        display: "flex",
                        border: "2px solid #f2a28a",
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "#fff",
                        mx: 'auto',
                        mx: 3,
                        mb: 2,
                        // maxWidth: 300,

                    }}
                >
                    <Box px={2} py={1.5} fontSize={14} color="text.primary">
                        +91
                    </Box>
                    <TextField
                        variant="standard"
                        fullWidth
                        InputProps={{ disableUnderline: true }}
                        placeholder="Enter mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        inputProps={{ maxLength: 10 }}
                        sx={{ mt: 1 }}
                    />
                </Box>

                <PrimaryButton
                    label={loading ? "Sending..." : "Get OTP"}
                    sx={{ mt: 0, width: { xs: '80%', sm: '220px' } }}
                    onClick={handleMobileSubmit}
                    disabled={loading}
                />

            </Box>
        </>
    );
};

export default Login;
