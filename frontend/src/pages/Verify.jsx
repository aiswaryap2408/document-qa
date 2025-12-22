import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, setAuthToken } from '../api';

const Verify = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

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

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfo('');
        try {
            const res = await verifyOtp(mobile, otp);
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
                    <input
                        type="text"
                        required
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest text-2xl"
                        placeholder="1234"
                        maxLength={4}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
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
