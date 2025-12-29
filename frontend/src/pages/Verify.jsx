import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, setAuthToken } from '../api';

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
            setInfo(`OTP Resent! (Use ${res.data.otp || '9876'})`);
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
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 4);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
            setOtp(newOtp);
            // Focus the next empty box or last box
            const nextIndex = Math.min(pastedData.length, 3);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Verify OTP
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                {info && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center">
                        {info}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
                    <div className="text-center text-sm text-gray-500">
                        Enter OTP sent to {mobile}
                    </div>
                    <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                required
                            />
                        ))}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || resending}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Verifying...
                            </>
                        ) : 'Verify'}
                    </button>

                    <div className="flex justify-center mt-4 text-sm">
                        <span className="text-gray-500 mr-2">Didn't receive code?</span>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading || resending}
                            className="text-indigo-600 font-bold hover:underline disabled:opacity-50"
                        >
                            {resending ? (
                                <>
                                    <span className="spinner spinner-indigo"></span>
                                    Resending...
                                </>
                            ) : 'Resend OTP'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Verify;
