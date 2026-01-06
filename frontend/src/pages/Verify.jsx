import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, setAuthToken } from '../api';
import { Box, Typography } from '@mui/material';
import Header from '../components/header';
import PrimaryButton from '../components/PrimaryButton';
import GurujiImage from '../components/gurujiImg';

const Verify = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const inputRefs = useRef([]);

    useEffect(() => {
        const storedMobile = localStorage.getItem('mobile');
        if (!storedMobile) {
            navigate('/');
        } else {
            setMobile(storedMobile);
        }

        // Session timeout: 5 minutes = 300,000 ms
        const timeoutId = setTimeout(() => {
            console.log("Verify session expired. Redirecting...");
            navigate('/');
        }, 300000);

        return () => clearTimeout(timeoutId);
    }, [navigate]);

    const handleResendOtp = async () => {
        setResending(true);
        setError('');
        setInfo('');
        try {
            const res = await sendOtp(mobile);
            setInfo(`OTP Resent!`);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to resend OTP.';
            setError(`Resend failed: ${msg}`);
        } finally {
            setResending(false);
        }
    };

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, "").slice(0, 4);
        if (pastedData) {
            const newOtp = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
            setOtp(newOtp);
            const nextIndex = Math.min(pastedData.length, 3);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleOtpSubmit = async (e) => {
        if (e) e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        setError('');
        setInfo('');
        try {
            const res = await verifyOtp(mobile, otpString);
            const { access_token, is_new_user } = res.data;

            setAuthToken(access_token);
            localStorage.setItem('token', access_token);

            if (is_new_user) {
                navigate('/register');
            } else {
                navigate('/chat');
            }
        } catch (err) {
            console.error("Verification error:", err);
            const msg = err.response?.data?.detail;
            const errorMsg = Array.isArray(msg) ? msg[0].msg : (msg || 'Invalid OTP.');
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            <Box mt={2} textAlign="center">
                <Typography fontSize={16} mt={1} mb={2}>
                    Welcome to{" "}
                    <Typography component="span" fontWeight={600} color="#dc5d35">
                        Findastro
                    </Typography>
                    !
                </Typography>

                <GurujiImage />
            </Box>

            {/* OTP Section */}
            <Box
                sx={{
                    mt: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    px: 2,
                    mb: 10,
                }}
            >
                <Typography
                    sx={{
                        mb: 1,
                        color: "#dc5d35",
                        fontWeight: 600,
                        fontSize: "1rem",
                    }}
                >
                    Enter OTP
                </Typography>

                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {info && (
                    <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
                        {info}
                    </Typography>
                )}

                {/* OTP Inputs */}
                <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 3 }, mb: 2 }}>
                    {otp.map((value, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            value={value}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            maxLength={1}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            style={{
                                width: 'min(65px, 18vw)',
                                height: 'min(75px, 20vw)',
                                textAlign: "center",
                                fontSize: 'min(24px, 6vw)',
                                borderRadius: 8,
                                border: "none",
                                outline: "none",
                                boxShadow: "0 -6px 12px rgba(0, 0, 0, 0.15)",
                                backgroundColor: "#fff",
                            }}
                        />
                    ))}
                </Box>

                {/* Resend */}
                <Box
                    sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 1,
                    }}
                >
                    <Typography
                        sx={{
                            color: "#dc5d35",
                            fontWeight: 600,
                            cursor: "pointer",
                            mr: { xs: 0, sm: 5 },
                            fontSize: 14,
                        }}
                        onClick={handleResendOtp}
                    >
                        {resending ? 'Resending...' : 'Resend OTP'}
                    </Typography>
                </Box>

                <PrimaryButton
                    label={loading ? "Verifying..." : "Continue"}
                    onClick={handleOtpSubmit}
                    disabled={loading || resending}
                />
            </Box>
        </>
    );
};

export default Verify;
