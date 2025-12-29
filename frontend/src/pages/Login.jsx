import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp } from '../api';

const Login = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleMobileSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic 10-digit validation
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
        <div className="min-h-screen h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="text-center pt-6 pb-2">
                <h1 className="text-2xl font-bold text-amber-900">Astrology Guruji</h1>
                <p className="text-xs text-amber-700 mt-1">AI powered Astrologer consultations</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
                {/* Guru Illustration - Reduced Size */}
                <div className="mb-4">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl">
                        <div className="text-center">
                            {/* Simplified Guru Icon */}
                            <div className="relative">
                                <div className="w-36 h-36 rounded-full bg-orange-500 flex items-center justify-center">
                                    <svg className="w-24 h-24 text-amber-50" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                    </svg>
                                    <div className="absolute top-9 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-red-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-lg font-semibold text-amber-900 mb-4">
                    Welcome to <span className="text-orange-600">Astrology Guruji!</span>
                </h2>

                {/* Login Form */}
                <div className="w-full max-w-sm">
                    <p className="text-center text-sm text-orange-700 font-medium mb-3">
                        Login / Sign-in with your phone number:
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-3 border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleMobileSubmit} className="space-y-3">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                                +91
                            </div>
                            <input
                                type="tel"
                                required
                                className="w-full pl-16 pr-4 py-3 border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                                placeholder="Enter mobile number"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                maxLength={10}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Sending OTP...
                                </>
                            ) : 'Get OTP'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
