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
            // Handle Pydantic validation error lists if they come back
            const errorMsg = Array.isArray(msg) ? msg[0].msg : (msg || err.message);
            setError(`Failed to send OTP: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Sign in to Astrology Bot
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleMobileSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <input
                            type="tel"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Mobile Number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Sending...
                            </>
                        ) : 'Send OTP'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
