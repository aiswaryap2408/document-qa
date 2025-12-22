import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, setAuthToken } from '../api';

const Register = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [details, setDetails] = useState({
        name: '',
        gender: 'Male',
        chart_style: 'South Indian',
        dob: '2000-01-01',
        tob: '12:00',
        pob: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [time, setTime] = useState({ hour: '12', minute: '00', period: 'PM' });

    useEffect(() => {
        const storedMobile = localStorage.getItem('mobile');
        if (!storedMobile) {
            navigate('/');
        } else {
            setMobile(storedMobile);
        }

        // Session timeout: 10 minutes = 600,000 ms
        const timeoutId = setTimeout(() => {
            console.log("Registration session expired. Redirecting...");
            navigate('/');
        }, 600000);

        return () => clearTimeout(timeoutId);
    }, [navigate]);

    // Sync 12h dropdowns with 24h 'tob' state
    useEffect(() => {
        let h = parseInt(time.hour);
        if (time.period === 'PM' && h < 12) h += 12;
        if (time.period === 'AM' && h === 12) h = 0;
        const formattedH = h.toString().padStart(2, '0');
        setDetails(prev => ({ ...prev, tob: `${formattedH}:${time.minute}` }));
    }, [time]);

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...details, mobile };
            const res = await registerUser(payload);
            const { access_token } = res.data;

            setAuthToken(access_token);
            localStorage.setItem('token', access_token);
            navigate('/chat');
        } catch (err) {
            console.error("Registration Error:", err);
            const msg = err.response?.data?.detail || err.message;
            setError(`Registration failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Enter Birth and Profile Details here
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleDetailsSubmit}>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
                        <input className="w-full px-3 py-2 border rounded-md" placeholder="Full Name" required value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Email Address</label>
                        <input className="w-full px-3 py-2 border rounded-md" type="email" placeholder="Email Address" required value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center text-sm text-gray-600">
                            <input type="radio" name="gender" value="Male" checked={details.gender === 'Male'} onChange={e => setDetails({ ...details, gender: e.target.value })} className="mr-2" /> Male
                        </label>
                        <label className="flex items-center text-sm text-gray-600">
                            <input type="radio" name="gender" value="Female" checked={details.gender === 'Female'} onChange={e => setDetails({ ...details, gender: e.target.value })} className="mr-2" /> Female
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Date of Birth</label>
                            <input className="w-full px-3 py-2 border rounded-md" type="date" required value={details.dob} onChange={e => setDetails({ ...details, dob: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 ml-1">Time of Birth</label>
                            <div className="flex gap-1">
                                <select
                                    className="flex-1 px-1 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                                    value={time.hour}
                                    onChange={(e) => setTime({ ...time, hour: e.target.value })}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>{i + 1}</option>
                                    ))}
                                </select>
                                <select
                                    className="flex-1 px-1 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                                    value={time.minute}
                                    onChange={(e) => setTime({ ...time, minute: e.target.value })}
                                >
                                    {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <select
                                    className="w-16 px-1 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                                    value={time.period}
                                    onChange={(e) => setTime({ ...time, period: e.target.value })}
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Place of Birth</label>
                        <input className="w-full px-3 py-2 border rounded-md" placeholder="Place of Birth" required value={details.pob} onChange={e => setDetails({ ...details, pob: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Chart Style</label>
                        <select className="w-full px-3 py-2 border rounded-md text-sm" value={details.chart_style} onChange={e => setDetails({ ...details, chart_style: e.target.value })}>
                            <option>South Indian</option>
                            <option>North Indian</option>
                            <option>East Indian</option>
                            <option>Kerala</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-4">
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Generating Horoscope...
                            </>
                        ) : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
