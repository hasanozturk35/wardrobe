import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import {
    Users, Activity, ShieldAlert, Trash2, ShieldCheck, RefreshCw,
    Database, Download, Eraser, Search,
    LayoutDashboard, FileText, LogOut, ChevronRight,
    TrendingUp, AlertCircle, CheckCircle, Info,
    UserX, Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'overview' | 'users' | 'logs';

const LEVEL_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
    error: { cls: 'bg-red-50 text-red-600 border-red-100',     icon: <AlertCircle size={12} /> },
    warn:  { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: <AlertCircle size={12} /> },
    info:  { cls: 'bg-blue-50 text-blue-600 border-blue-100',   icon: <Info size={12} /> },
    debug: { cls: 'bg-gray-50 text-gray-500 border-gray-100',   icon: <CheckCircle size={12} /> },
};

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [activeTab,    setActiveTab]    = useState<Tab>('overview');
    const [stats,        setStats]        = useState<any>(null);
    const [users,        setUsers]        = useState<any[]>([]);
    const [logs,         setLogs]         = useState<any[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [logLevel,     setLogLevel]     = useState('all');
    const [userSearch,   setUserSearch]   = useState('');

    const isAdmin = user?.role === 'ADMIN';

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-8">
                    <div className="w-20 h-20 bg-black text-white rounded-[1.5rem] flex items-center justify-center mx-auto">
                        <ShieldAlert size={36} strokeWidth={1} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-light">Erişim Reddedildi.</h1>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-3">Yönetici yetkisi gereklidir</p>
                    </div>
                    <button onClick={() => navigate('/wardrobe')}
                        className="px-8 py-3 bg-black text-white text-[10px] font-mono uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-full">
                        Gardıroba Dön
                    </button>
                </motion.div>
            </div>
        );
    }

    useEffect(() => { fetchData(); }, [activeTab, logLevel]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsers(res.data);
            } else if (activeTab === 'logs') {
                const res = await api.get(`/admin/logs?level=${logLevel}&limit=200`);
                setLogs(res.data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        await api.patch(`/admin/users/${userId}/role`, { role: newRole });
        fetchData();
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;
        await api.delete(`/admin/users/${userId}`);
        fetchData();
    };

    const handleDeleteLog = async (logId: string) => {
        await api.delete(`/admin/logs/${logId}`);
        setLogs(prev => prev.filter(l => l.id !== logId));
    };

    const handleClearLogs = async () => {
        if (!confirm('Tüm sistem kayıtlarını silmek istediğine emin misin?')) return;
        await api.delete('/admin/logs/clear');
        setLogs([]);
    };

    const handleExportCSV = async () => {
        const res = await api.get('/admin/logs/export');
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `logs_${new Date().toISOString().split('T')[0]}.csv` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const filteredUsers = users.filter(u =>
        !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Genel Bakış',    icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
        { id: 'users',    label: 'Kullanıcılar',   icon: <Users size={18} strokeWidth={1.5} /> },
        { id: 'logs',     label: 'Aktivite Kaydı', icon: <FileText size={18} strokeWidth={1.5} /> },
    ];

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex">

            {/* ════════════════════════════
                LEFT SIDEBAR
            ════════════════════════════ */}
            <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#111] text-white min-h-screen sticky top-0 z-40">
                {/* Brand */}
                <div className="px-8 py-10 border-b border-white/10">
                    <p className="text-[9px] font-mono uppercase tracking-[0.55em] text-white/30 mb-2">Maison Wardrobe</p>
                    <h2 className="font-serif font-light text-2xl leading-none">Admin<span className="italic text-white/40"> Panel</span></h2>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-mono uppercase tracking-widest transition-all ${
                                activeTab === item.id
                                    ? 'bg-white text-black'
                                    : 'text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="px-4 py-6 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                            <Crown size={14} className="text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-serif text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Yönetici</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/auth'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <LogOut size={14} /> Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* ════════════════════════════
                MAIN CONTENT
            ════════════════════════════ */}
            <main className="flex-1 min-w-0 p-8 lg:p-12">

                {/* Mobile tab bar */}
                <div className="flex lg:hidden gap-2 mb-8 overflow-x-auto pb-2">
                    {NAV.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${
                                activeTab === item.id ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500'
                            }`}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                    >

                        {/* ──────────────── OVERVIEW ──────────────── */}
                        {activeTab === 'overview' && (
                            <div>
                                <div className="mb-10">
                                    <h1 className="text-5xl lg:text-6xl font-serif font-light leading-none tracking-tight text-gray-900 mb-2">
                                        Genel Bakış<span className="italic text-gray-300">.</span>
                                    </h1>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-24">
                                        <RefreshCw className="animate-spin text-gray-300" size={32} strokeWidth={1} />
                                    </div>
                                ) : stats ? (
                                    <div className="space-y-6">
                                        {/* KPI Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            {[
                                                { icon: <Users size={28} strokeWidth={1} />, label: 'Toplam Kullanıcı', value: stats.totalUsers, sub: `Bugün +${stats.newUsersToday} yeni`, highlight: false },
                                                { icon: <Database size={28} strokeWidth={1} />, label: 'Kıyafet Arşivi', value: stats.totalItems, sub: 'Toplam gardırop parçası', highlight: false },
                                                { icon: <TrendingUp size={28} strokeWidth={1} />, label: 'Bugün Kayıt', value: stats.newUsersToday, sub: 'Yeni üye katılımı', highlight: true },
                                            ].map((kpi, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.07, duration: 0.5 }}
                                                    className={`p-8 rounded-[2rem] border flex flex-col gap-6 ${
                                                        kpi.highlight
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white text-gray-900 border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)]'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.highlight ? 'bg-white/10' : 'bg-gray-50'}`}>
                                                        <span className={kpi.highlight ? 'text-white' : 'text-gray-600'}>{kpi.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[9px] font-mono uppercase tracking-widest mb-2 ${kpi.highlight ? 'text-white/40' : 'text-gray-400'}`}>{kpi.label}</p>
                                                        <p className="text-5xl font-serif font-light leading-none">{kpi.value}</p>
                                                        <p className={`text-[10px] font-mono mt-3 ${kpi.highlight ? 'text-white/30' : 'text-gray-400'}`}>{kpi.sub}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Log summary */}
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-8">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-2xl font-serif font-light">Sistem Kayıt Özeti</h3>
                                                <button onClick={() => setActiveTab('logs')}
                                                    className="text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1">
                                                    Tümünü Gör <ChevronRight size={12} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {stats.logSummary?.map((s: any) => {
                                                    const style = LEVEL_STYLES[s.level] || LEVEL_STYLES.debug;
                                                    return (
                                                        <div key={s.level} className={`flex flex-col items-center gap-2 p-5 rounded-2xl border ${style.cls}`}>
                                                            {style.icon}
                                                            <span className="text-3xl font-serif font-light">{s._count._all}</span>
                                                            <span className="text-[9px] font-mono uppercase tracking-widest">{s.level}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Quick actions */}
                                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-8">
                                            <h3 className="text-2xl font-serif font-light mb-6">Hızlı İşlemler</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Kullanıcıları Yönet', icon: <Users size={16} />, action: () => setActiveTab('users') },
                                                    { label: 'CSV Dışa Aktar', icon: <Download size={16} />, action: handleExportCSV },
                                                    { label: 'Logları Temizle', icon: <Eraser size={16} />, action: handleClearLogs },
                                                ].map((a, i) => (
                                                    <button key={i} onClick={a.action}
                                                        className="flex items-center gap-3 px-5 py-4 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl text-[11px] font-mono uppercase tracking-wider text-gray-600 transition-all group">
                                                        <span className="text-gray-400 group-hover:text-white transition-colors">{a.icon}</span>
                                                        {a.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 font-serif italic text-center py-20">Veriler yüklenemedi.</p>
                                )}
                            </div>
                        )}

                        {/* ──────────────── USERS ──────────────── */}
                        {activeTab === 'users' && (
                            <div>
                                <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-5xl lg:text-6xl font-serif font-light leading-none tracking-tight text-gray-900 mb-2">
                                            Kullanıcılar<span className="italic text-gray-300">.</span>
                                        </h1>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{users.length} kayıtlı üye</p>
                                    </div>
                                    <button onClick={fetchData}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-all">
                                        <RefreshCw size={13} /> Yenile
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative mb-6 max-w-sm">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        placeholder="İsim veya e-posta ara..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-[13px] font-serif italic text-gray-700 placeholder:text-gray-300 outline-none focus:border-black transition-colors"
                                    />
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-24">
                                        <RefreshCw className="animate-spin text-gray-300" size={32} strokeWidth={1} />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0">
                                            {/* Header */}
                                            <div className="contents">
                                                {['Kullanıcı', 'Rol', 'Kayıt Tarihi', 'İşlem'].map(h => (
                                                    <div key={h} className="px-6 py-4 border-b border-gray-50 text-[9px] font-mono uppercase tracking-widest text-gray-400">
                                                        {h}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Rows */}
                                            {filteredUsers.map((u, i) => (
                                                <React.Fragment key={u.id}>
                                                    {/* User cell */}
                                                    <div className={`px-6 py-4 flex items-center gap-3 ${i < filteredUsers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                                            <span className="font-serif text-gray-500 text-[14px]">{(u.name || u.email || '?').charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-serif text-[14px] text-gray-900 truncate">{u.name || '—'}</p>
                                                            <p className="text-[10px] font-mono text-gray-400 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    {/* Role */}
                                                    <div className={`px-6 py-4 flex items-center ${i < filteredUsers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                        <span className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                            u.role === 'ADMIN'
                                                                ? 'bg-black text-white border-black'
                                                                : 'bg-gray-50 text-gray-500 border-gray-100'
                                                        }`}>
                                                            {u.role === 'ADMIN' ? 'Admin' : 'Üye'}
                                                        </span>
                                                    </div>
                                                    {/* Date */}
                                                    <div className={`px-6 py-4 flex items-center ${i < filteredUsers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                        <span className="text-[11px] font-mono text-gray-400">
                                                            {new Date(u.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {/* Actions */}
                                                    <div className={`px-6 py-4 flex items-center gap-2 ${i < filteredUsers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                        {u.id !== user?.id && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRoleToggle(u.id, u.role)}
                                                                    title={u.role === 'ADMIN' ? 'Admin yetkisini kaldır' : 'Admin yap'}
                                                                    className="w-8 h-8 bg-gray-50 hover:bg-amber-50 hover:text-amber-600 rounded-full flex items-center justify-center transition-colors text-gray-400"
                                                                >
                                                                    {u.role === 'ADMIN' ? <Crown size={14} /> : <ShieldCheck size={14} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    title="Kullanıcıyı sil"
                                                                    className="w-8 h-8 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-colors text-gray-400"
                                                                >
                                                                    <UserX size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {u.id === user?.id && (
                                                            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300">Sen</span>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {filteredUsers.length === 0 && (
                                            <div className="text-center py-16">
                                                <p className="text-gray-300 font-serif italic">Kullanıcı bulunamadı.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ──────────────── LOGS ──────────────── */}
                        {activeTab === 'logs' && (
                            <div>
                                <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-5xl lg:text-6xl font-serif font-light leading-none tracking-tight text-gray-900 mb-2">
                                            Aktivite<span className="italic text-gray-300">.</span>
                                        </h1>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{logs.length} kayıt</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleExportCSV}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-all">
                                            <Download size={13} /> CSV
                                        </button>
                                        <button onClick={handleClearLogs}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 rounded-full text-[10px] font-mono uppercase tracking-widest text-red-400 hover:border-red-500 hover:text-red-600 transition-all">
                                            <Eraser size={13} /> Temizle
                                        </button>
                                    </div>
                                </div>

                                {/* Level filter */}
                                <div className="flex gap-2 mb-6 flex-wrap">
                                    {['all', 'info', 'warn', 'error', 'debug'].map(lvl => (
                                        <button key={lvl} onClick={() => setLogLevel(lvl)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${
                                                logLevel === lvl ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                                            }`}>
                                            {lvl === 'all' ? 'Tümü' : lvl}
                                        </button>
                                    ))}
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-24">
                                        <RefreshCw className="animate-spin text-gray-300" size={32} strokeWidth={1} />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                                        {logs.length === 0 ? (
                                            <div className="text-center py-20">
                                                <Activity size={36} className="text-gray-200 mx-auto mb-4" strokeWidth={1} />
                                                <p className="text-gray-300 font-serif italic">Kayıt bulunamadı.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {logs.map(log => {
                                                    const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.debug;
                                                    return (
                                                        <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                                                            <div className={`mt-0.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase tracking-widest shrink-0 ${style.cls}`}>
                                                                {style.icon}
                                                                {log.level}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-serif text-gray-800 leading-snug">{log.message}</p>
                                                                {log.context && (
                                                                    <p className="text-[10px] font-mono text-gray-400 mt-1 truncate">{log.context}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                                                                    {new Date(log.timestamp).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <button onClick={() => handleDeleteLog(log.id)}
                                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminDashboard;
