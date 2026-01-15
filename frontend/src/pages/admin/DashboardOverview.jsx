import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../api';

const StatCard = ({ title, value, subtext, icon, color, trend }) => {
    // Explicit theme mapping for dark mode consistency
    const themeMap = {
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', iconBg: 'bg-indigo-950/50' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', iconBg: 'bg-rose-950/50' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', iconBg: 'bg-violet-950/50' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'bg-emerald-950/50' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', iconBg: 'bg-orange-950/50' },
        slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', iconBg: 'bg-slate-800/50' }
    };
    const theme = themeMap[color] || themeMap.slate;

    return (
        <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-800/60 shadow-2xl hover:bg-slate-900/60 transition-all duration-500 group overflow-hidden relative backdrop-blur-sm">
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150 blur-2xl`}></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
                    {subtext && <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-tight">{subtext}</p>}
                    {trend && (
                        <div className={`flex items-center space-x-1.5 mt-4 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <div className={`p-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={trend > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                                </svg>
                            </div>
                            <span className="text-[10px] font-black tracking-widest">{Math.abs(trend)}%</span>
                            <span className="text-[10px] font-black text-slate-700">LVL UP</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 ${theme.iconBg} ${theme.text} rounded-2xl shadow-inner border border-white/5`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        totalConversations: 0,
        averageRAGScore: 0,
        walletVolume: 0,
        activeSubscriptions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                const data = response?.data || response;
                if (data) {
                    setStats({
                        totalUsers: data.totalUsers ?? 0,
                        activeToday: data.activeToday ?? 0,
                        totalConversations: data.totalConversations ?? 0,
                        averageRAGScore: data.averageRAGScore ?? 0,
                        walletVolume: data.walletVolume ?? 0,
                        activeSubscriptions: data.activeSubscriptions ?? 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 bg-black animate-in fade-in duration-700">
                <div className="w-16 h-16 border-4 border-slate-900 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] mt-10 animate-pulse">Synchronizing Neural Core</p>
            </div>
        );
    }

    return (
        <div className="p-12 space-y-16 max-w-7xl mx-auto bg-black">
            <div className="flex flex-col md:flex-row md:items-end justify-between space-y-6 md:space-y-0">
                <div>
                    <div className="flex items-center space-x-3 mb-2 underline-offset-8">
                        <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Live Architecture</span>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Intelligence Hub</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em] mt-4 max-w-md">Global system telemetry & real-time neural insights across all active nodes.</p>
                </div>
                <div className="flex space-x-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                    {['24H', '7D', '30D', 'ALL'].map(t => (
                        <button key={t} className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${t === '7D' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <StatCard
                    title="User Base"
                    value={(stats.totalUsers || 0).toLocaleString()}
                    subtext="Neural Entities Registered"
                    trend={12}
                    color="indigo"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <StatCard
                    title="Active Sessions"
                    value={stats.activeToday.toString()}
                    subtext="Concurrent Waveforms"
                    trend={-4}
                    color="rose"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Inference Volume"
                    value={(stats.totalConversations || 0).toLocaleString()}
                    subtext="Processed Data Streams"
                    trend={24}
                    color="violet"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                />
                <StatCard
                    title="RAG Precision"
                    value={`${stats.averageRAGScore}%`}
                    subtext="Contextual Fidelity Rate"
                    color="emerald"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                />
                <StatCard
                    title="Vault Volume"
                    value={`₹${(stats.walletVolume || 0).toLocaleString()}`}
                    subtext="Aggregate Asset Value"
                    trend={18}
                    color="orange"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Enrollment"
                    value={stats.activeSubscriptions.toString()}
                    subtext="Premium Tier Identities"
                    trend={3}
                    color="slate"
                    icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
            </div>

            <div className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-5000"></div>
                <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-violet-500/5 rounded-full blur-[100px] -ml-20 -mb-20"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-16">
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">System Health: Nominal</div>
                        <h4 className="text-4xl font-black tracking-tighter mb-6 leading-tight">Autonomous Data Surveillance</h4>
                        <p className="text-slate-400 font-medium leading-relaxed text-lg">
                            The ecosystem is currently operating at <span className="text-white font-bold opacity-100 italic">peak architectural capacity</span>.
                            RAG retrieval matrices are stable (avg 240ms).
                            No cryptographic or structural anomalies detected in the last epoch.
                        </p>
                    </div>
                    <div className="flex -space-x-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-20 h-20 rounded-3xl border-4 border-slate-900 bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-600 shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-20 h-20 rounded-3xl border-4 border-slate-950 bg-indigo-600 flex items-center justify-center font-black text-white shadow-[0_10px_30px_rgba(79,70,229,0.5)] z-20">
                            +12
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
};

export default DashboardOverview;
