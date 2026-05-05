import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Users, Activity, ShieldAlert, Trash2, ShieldCheck, RefreshCw, BarChart3, Database, Download, Eraser, Filter, User, Camera, Edit3, Check, X, Shirt, BookOpen, Eye, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminDashboard: React.FC = () => {
    const { user, updateUser, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'logs' | 'profile'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [logFilter, setLogFilter] = useState('all');

    // Profile state
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(user?.name || '');
    const [savingName, setSavingName] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [profileStats, setProfileStats] = useState<{ outfitCount: number; wardrobeCount: number; publicCount: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Executive Admin Guard
    const isAdminByEmail = user?.email?.toLowerCase().startsWith('admin@');
    if (user?.role !== 'ADMIN' && !isAdminByEmail) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="text-center space-y-12 relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-black text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl"
                    >
                        <ShieldAlert size={40} strokeWidth={1} />
                    </motion.div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-serif font-light tracking-tightest">Access Denied.</h1>
                        <p className="text-gray-400 font-serif italic text-xl uppercase tracking-widest text-[10px]">Erişim için yönetici yetkisi gereklidir.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/wardrobe')} 
                        className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Back to Archive
                    </button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchData();
    }, [activeTab, logFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'stats') {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsers(res.data);
            } else if (activeTab === 'logs') {
                const res = await api.get(`/admin/logs?level=${logFilter}`);
                setLogs(res.data);
            } else if (activeTab === 'profile') {
                const [profileRes, statsRes] = await Promise.all([
                    api.get('/users/profile'),
                    api.get('/users/stats'),
                ]);
                updateUser({ name: profileRes.data.name, avatarUrl: profileRes.data.avatarUrl });
                setNameValue(profileRes.data.name || '');
                setProfileStats(statsRes.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveName = async () => {
        if (!nameValue.trim()) return;
        setSavingName(true);
        try {
            const res = await api.patch('/users/profile', { name: nameValue.trim() });
            updateUser({ name: res.data.name });
            setEditingName(false);
        } catch { } finally {
            setSavingName(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setUploadingAvatar(true);
        try {
            const form = new FormData();
            form.append('avatar', file);
            const res = await api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            updateUser({ avatarUrl: res.data.avatarUrl });
        } catch {
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            fetchData();
        } catch (error) {
            alert('Yetki değiştirilemedi');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Kullanıcıyı tamamen silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchData();
        } catch (error) {
            alert('Kullanıcı silinemedi');
        }
    };

    const handleDeleteLog = async (logId: string) => {
        try {
            await api.delete(`/admin/logs/${logId}`);
            setLogs(logs.filter(l => l.id !== logId));
        } catch (error) {
            alert('Log silinemedi');
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('TÜM sistem kayıtlarını silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;
        try {
            await api.delete('/admin/logs/clear');
            setLogs([]);
        } catch (error) {
            alert('Loglar temizlenemedi');
        }
    };

    const handleExportCSV = async () => {
        try {
            const res = await api.get('/admin/logs/export');
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            alert('CSV dışa aktarılamadı');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-48 px-8 lg:px-20 relative overflow-x-hidden">
            {/* Ambient Lighting Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-amber-50/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Elite Command Header */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 mb-8"
                        >
                            <span className="w-12 h-[1px] bg-black opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">System Command</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-8xl font-serif font-light leading-none tracking-tightest text-gray-900 mb-6"
                        >
                            Executive <br />
                            <span className="italic font-normal text-gray-400">Dashboard.</span>
                        </motion.h1>
                    </div>

                    <div className="flex bg-white/50 backdrop-blur-3xl border border-white/60 p-2 rounded-[2.5rem] shadow-elite">
                        {['stats', 'users', 'logs', 'profile'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${activeTab === tab ? 'bg-black text-white shadow-2xl scale-105' : 'text-gray-400 hover:text-black'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="h-[40vh] flex items-center justify-center"
                        >
                            <RefreshCw className="animate-spin text-gray-200" size={48} strokeWidth={1} />
                        </motion.div>
                    )}

                    {!loading && (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7 }}
                        >
                            {activeTab === 'stats' && stats && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    <div className="lg:col-span-4 p-16 bg-white rounded-[4rem] shadow-elite border border-white flex flex-col items-center group hover:scale-[1.02] transition-all duration-700">
                                        <div className="w-20 h-20 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-[2rem] flex items-center justify-center text-black mb-10 transition-all duration-500 shadow-sm">
                                            <Users size={32} strokeWidth={1} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4">Visionaries</span>
                                        <h3 className="text-7xl font-serif">{stats.totalUsers}</h3>
                                    </div>

                                    <div className="lg:col-span-4 p-16 bg-white rounded-[4rem] shadow-elite border border-white flex flex-col items-center group hover:scale-[1.02] transition-all duration-700">
                                        <div className="w-20 h-20 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-[2rem] flex items-center justify-center text-black mb-10 transition-all duration-500 shadow-sm">
                                            <Database size={32} strokeWidth={1} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4">Archive Items</span>
                                        <h3 className="text-7xl font-serif">{stats.totalItems}</h3>
                                    </div>

                                    <div className="lg:col-span-4 p-16 bg-black text-white rounded-[4rem] shadow-3xl flex flex-col items-center group hover:scale-[1.02] transition-all duration-700 relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-sm">
                                                <Activity size={32} strokeWidth={1} />
                                            </div>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-4">Momentum</span>
                                            <h3 className="text-7xl font-serif">+{stats.newUsersToday}</h3>
                                            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Growth Index</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-12 bg-white rounded-[5rem] p-24 shadow-elite border border-gray-50 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-20 relative z-10">
                                            <h3 className="text-5xl font-serif tracking-tight">System Trajectory</h3>
                                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                                                <BarChart3 className="text-gray-900" size={28} strokeWidth={1} />
                                            </div>
                                        </div>
                                        
                                        <div className="h-80 flex items-end justify-between gap-10 relative z-10 px-10">
                                            {[65, 45, 85, 30, 55, 75, 90].map((h, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1.5 }}
                                                    className="flex-1 bg-gray-50 rounded-[2rem] relative group cursor-crosshair"
                                                >
                                                    <div className="absolute inset-0 bg-black rounded-[2rem] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-700" />
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-12 text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] px-12">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-10">
                                    <div className="flex justify-between items-center px-10">
                                        <h3 className="text-4xl font-serif">Platform Members</h3>
                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                                            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                                            Live Database Connection
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[4rem] overflow-hidden shadow-elite border border-gray-50">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50/20">
                                                    <th className="px-16 py-12 text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Identity / Archive</th>
                                                    <th className="px-16 py-12 text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Security Clearance</th>
                                                    <th className="px-16 py-12 text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 text-right">Operational Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {users.map(u => (
                                                    <tr key={u.id} className="hover:bg-gray-50/40 transition-all group">
                                                        <td className="px-16 py-12">
                                                            <div className="flex items-center gap-8">
                                                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center font-serif text-4xl border border-white shadow-sm group-hover:scale-105 transition-transform duration-500">
                                                                    {u.name?.[0] || u.email[0].toUpperCase()}
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <span className="font-serif text-3xl text-gray-900 leading-none">{u.name || 'Anonymous'}</span>
                                                                    <span className="text-[11px] text-gray-400 font-serif lowercase tracking-wider">{u.email}</span>
                                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mt-1">UUID: {u.id.substring(0, 8)}...</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-16 py-12">
                                                            <div className="flex flex-col gap-3">
                                                                <span className={`w-fit px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] ${u.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {u.role}
                                                                </span>
                                                                <span className="text-[10px] font-serif italic text-gray-300">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-16 py-12 text-right">
                                                            <div className="flex justify-end gap-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                                                <button 
                                                                    onClick={() => handleUpdateRole(u.id, u.role)}
                                                                    className="w-16 h-16 bg-white border border-gray-100 shadow-sm hover:bg-black hover:text-white rounded-[2.2rem] transition-all flex items-center justify-center group/btn"
                                                                    title="Change Role"
                                                                >
                                                                    {u.role === 'ADMIN' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    className="w-16 h-16 bg-white border border-rose-100 shadow-sm hover:bg-rose-500 hover:text-white rounded-[2.2rem] text-rose-300 transition-all flex items-center justify-center"
                                                                    title="Revoke Access"
                                                                >
                                                                    <Trash2 size={24} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="space-y-16">
                                    <div className="flex flex-col lg:flex-row justify-between items-end gap-12 bg-white/40 backdrop-blur-xl p-12 rounded-[4rem] border border-white shadow-elite">
                                        <div className="space-y-6 flex-1">
                                            <h3 className="text-4xl font-serif">Historical Archive</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {['all', 'info', 'warn', 'error'].map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setLogFilter(level)}
                                                        className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${logFilter === level ? 'bg-black text-white shadow-2xl scale-105' : 'bg-white/50 text-gray-400 hover:bg-white hover:text-black shadow-sm'}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <button 
                                                onClick={handleExportCSV}
                                                className="flex items-center gap-4 px-10 py-5 bg-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-xl transition-all shadow-sm border border-gray-50"
                                            >
                                                <Download size={18} />
                                                Report .csv
                                            </button>
                                            <button 
                                                onClick={handleClearLogs}
                                                className="flex items-center gap-4 px-10 py-5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-rose-200 shadow-xl transition-all"
                                            >
                                                <Eraser size={18} />
                                                Purge All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-8 relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-20 top-0 bottom-0 w-[1px] bg-gray-100 hidden lg:block" />

                                        {logs.length === 0 ? (
                                            <div className="py-64 text-center opacity-10">
                                                <Filter size={160} strokeWidth={0.3} className="mx-auto mb-12" />
                                                <p className="font-serif italic text-5xl">Archive Empty.</p>
                                            </div>
                                        ) : (
                                            logs.map((log, idx) => (
                                                <motion.div 
                                                    layout
                                                    key={log.id} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative lg:pl-32"
                                                >
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-[76px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-100 border-4 border-white shadow-sm z-20 group-hover:bg-black group-hover:scale-150 transition-all duration-500 hidden lg:block" />

                                                    <div className="bg-white p-12 lg:p-16 rounded-[4rem] shadow-elite border border-gray-50 flex items-start gap-12 hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                                                        <div className={`p-8 rounded-[2.5rem] shadow-sm shrink-0 ${log.level === 'error' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : log.level === 'warn' ? 'bg-amber-50 text-amber-500 shadow-amber-100' : 'bg-indigo-50 text-indigo-300 shadow-indigo-100'}`}>
                                                            <Activity size={32} strokeWidth={1} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap justify-between items-center mb-8 gap-6">
                                                                <div className="flex items-center gap-6">
                                                                    <span className="px-6 py-2 bg-gray-50 rounded-full text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 border border-gray-100">
                                                                        {log.context || 'SYSTEM CORE'}
                                                                    </span>
                                                                    <span className={`w-2 h-2 rounded-full ${log.level === 'error' ? 'bg-rose-500 animate-pulse outline outline-rose-100 outline-offset-4' : log.level === 'warn' ? 'bg-amber-500' : 'bg-indigo-400'}`} />
                                                                </div>
                                                                <div className="flex items-center gap-10">
                                                                    <div className="text-right hidden sm:block">
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Timestamp</p>
                                                                        <p className="text-xl font-serif italic text-gray-400">
                                                                            {new Date(log.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' })}
                                                                        </p>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleDeleteLog(log.id)}
                                                                        className="p-4 opacity-0 group-hover:opacity-100 text-gray-200 hover:text-rose-500 transition-all duration-500 bg-gray-50 rounded-2xl"
                                                                    >
                                                                        <Trash2 size={24} strokeWidth={1} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="font-serif text-4xl text-gray-900 leading-tight tracking-tight mb-8 break-words">{log.message}</p>
                                                            {log.userId && (
                                                                <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl w-fit">
                                                                    <Users size={16} className="text-indigo-200" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Origin Identity</span>
                                                                        <span className="text-[10px] font-serif text-gray-400">{log.userId}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="max-w-2xl mx-auto space-y-12">
                                    {/* Avatar + identity */}
                                    <div className="bg-white rounded-[4rem] p-16 shadow-elite border border-gray-50 flex flex-col sm:flex-row items-center gap-12">
                                        <div className="relative shrink-0">
                                            <div className="w-36 h-36 rounded-full border-4 border-gray-50 shadow-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {(avatarPreview || (user?.avatarUrl ? `${API_URL}${user.avatarUrl}` : null)) ? (
                                                    <img src={avatarPreview || `${API_URL}${user!.avatarUrl}`} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={52} className="text-gray-300" />
                                                )}
                                                {uploadingAvatar && (
                                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-1 right-1 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <Camera size={16} />
                                            </button>
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <AnimatePresence mode="wait">
                                                {editingName ? (
                                                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                        className="flex items-center gap-3 mb-3">
                                                        <input autoFocus value={nameValue}
                                                            onChange={e => setNameValue(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                                                            className="text-3xl font-serif border-b-2 border-black bg-transparent outline-none w-56" />
                                                        <button onClick={saveName} disabled={savingName}
                                                            className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50">
                                                            {savingName ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
                                                        </button>
                                                        <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }}
                                                            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                                            <X size={15} />
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                        className="flex items-center gap-3 mb-3">
                                                        <h2 className="text-3xl font-serif text-gray-900">{user?.name || 'İsimsiz'}</h2>
                                                        <button onClick={() => setEditingName(true)}
                                                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 hover:text-black transition-colors">
                                                            <Edit3 size={14} />
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <p className="text-sm text-gray-400 tracking-wide mb-3">{user?.email}</p>
                                            <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-black text-white px-4 py-1.5 rounded-full">Admin</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {profileStats && (
                                        <div className="grid grid-cols-3 gap-6">
                                            {[
                                                { icon: Shirt,    label: 'Gardırop', value: profileStats.wardrobeCount },
                                                { icon: BookOpen, label: 'Kombin',   value: profileStats.outfitCount },
                                                { icon: Eye,      label: 'Açık',     value: profileStats.publicCount },
                                            ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="bg-white rounded-[3rem] p-10 shadow-elite border border-gray-50 flex flex-col items-center gap-3">
                                                    <Icon size={20} className="text-gray-300" />
                                                    <span className="text-4xl font-serif">{value}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Üyelik + çıkış */}
                                    <div className="bg-white rounded-[3rem] border border-gray-50 shadow-elite overflow-hidden">
                                        <div className="px-10 py-6 border-b border-gray-50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Hesap</p>
                                        </div>
                                        <div className="px-10 py-6">
                                            <p className="text-xs font-semibold text-gray-600">Üyelik tarihi</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={logout}
                                        className="w-full flex items-center justify-center gap-2 py-5 rounded-[3rem] border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-all text-[10px] font-black uppercase tracking-widest">
                                        <LogOut size={14} /> Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .shadow-elite { box-shadow: 0 10px 60px rgba(0,0,0,0.02); }
                .shadow-3xl { box-shadow: 0 50px 100px rgba(0,0,0,0.4); }
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
