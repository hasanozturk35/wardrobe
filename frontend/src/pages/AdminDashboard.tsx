import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Users, Activity, ShieldAlert, Trash2, ShieldCheck, RefreshCw, BarChart3, Database, Download, Eraser, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'logs'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [logFilter, setLogFilter] = useState('all');

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
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
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
        <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-32 px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-6xl font-serif font-light text-gray-900 tracking-tighter mb-4">Admin Command</h1>
                        <p className="text-gray-400 font-serif italic text-lg opacity-80 uppercase tracking-widest text-[10px]">L'Espace de Gestion Exceptionnel</p>
                    </div>
                    <div className="flex bg-white/50 backdrop-blur-xl border border-gray-100 p-1.5 rounded-full shadow-sm">
                        <button 
                            onClick={() => setActiveTab('stats')}
                            className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-black text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Members
                        </button>
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-black text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            System Logs
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading && users.length === 0 && logs.length === 0 ? (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="h-[60vh] flex items-center justify-center"
                        >
                            <RefreshCw className="animate-spin text-gray-200" size={40} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {activeTab === 'stats' && stats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-10 bg-white rounded-[3rem] shadow-sm border border-gray-50 flex flex-col items-center group hover:shadow-xl transition-all duration-700">
                                        <div className="w-16 h-16 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-2xl flex items-center justify-center text-black mb-6 transition-colors duration-500">
                                            <Users size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Visionaries</span>
                                        <h3 className="text-5xl font-serif font-light">{stats.totalUsers}</h3>
                                    </div>

                                    <div className="p-10 bg-white rounded-[3rem] shadow-sm border border-gray-50 flex flex-col items-center group hover:shadow-xl transition-all duration-700">
                                        <div className="w-16 h-16 bg-gray-50 group-hover:bg-indigo-500 group-hover:text-white rounded-2xl flex items-center justify-center text-black mb-6 transition-colors duration-500">
                                            <Database size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Curated Items</span>
                                        <h3 className="text-5xl font-serif font-light">{stats.totalItems}</h3>
                                    </div>

                                    <div className="p-10 bg-white rounded-[3rem] shadow-sm border border-gray-50 flex flex-col items-center group hover:shadow-xl transition-all duration-700">
                                        <div className="w-16 h-16 bg-gray-50 group-hover:bg-rose-500 group-hover:text-white rounded-2xl flex items-center justify-center text-black mb-6 transition-colors duration-500">
                                            <Activity size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Momentum</span>
                                        <h3 className="text-5xl font-serif font-light">+{stats.newUsersToday}</h3>
                                    </div>

                                    <div className="col-span-1 md:col-span-3 bg-white rounded-[4rem] p-16 shadow-lg border border-gray-50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex justify-between items-start mb-12 relative z-10">
                                            <h3 className="text-3xl font-serif">Platform Analytics</h3>
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <BarChart3 className="text-gray-900" size={24} />
                                            </div>
                                        </div>
                                        
                                        <div className="h-64 flex items-end justify-between gap-6 relative z-10 px-4">
                                            {[65, 45, 85, 30, 55, 75, 90].map((h, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                                                    className="flex-1 bg-gray-50 rounded-t-3xl relative group cursor-pointer"
                                                >
                                                    <div className="absolute inset-0 bg-black rounded-t-3xl scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {h * 12}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-8 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] px-6">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-gray-50">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-12 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Visionary</th>
                                                <th className="px-12 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Role</th>
                                                <th className="px-12 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Joined</th>
                                                <th className="px-12 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50/30 transition-all group">
                                                    <td className="px-12 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-serif text-xl border border-white">
                                                                {u.name?.[0] || u.email[0].toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-serif text-xl text-gray-900">{u.name || 'Anonymous'}</span>
                                                                <span className="text-xs text-gray-400 font-serif italic">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-8">
                                                        <span className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-12 py-8 text-sm text-gray-400 font-serif italic">
                                                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-12 py-8 text-right">
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleUpdateRole(u.id, u.role)}
                                                                className="w-12 h-12 bg-white border border-gray-100 shadow-sm hover:bg-black hover:text-white rounded-2xl transition-all flex items-center justify-center"
                                                                title="Yetki Değiştir"
                                                            >
                                                                {u.role === 'ADMIN' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="w-12 h-12 bg-white border border-rose-100 shadow-sm hover:bg-rose-500 hover:text-white rounded-2xl text-rose-500 transition-all flex items-center justify-center"
                                                                title="Sil"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
                                        <div className="flex gap-2">
                                            {['all', 'info', 'warn', 'error'].map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => setLogFilter(level)}
                                                    className={`px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${logFilter === level ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handleExportCSV}
                                                className="flex items-center gap-3 px-8 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                            >
                                                <Download size={14} />
                                                Export CSV
                                            </button>
                                            <button 
                                                onClick={handleClearLogs}
                                                className="flex items-center gap-3 px-8 py-3 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eraser size={14} />
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        {logs.length === 0 ? (
                                            <div className="py-32 text-center opacity-30">
                                                <Filter size={64} strokeWidth={0.5} className="mx-auto mb-6" />
                                                <p className="font-serif italic text-2xl">Keine Logs für diesen Filter gefunden.</p>
                                            </div>
                                        ) : (
                                            logs.map(log => (
                                                <motion.div 
                                                    layout
                                                    key={log.id} 
                                                    className="group bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 flex items-start gap-8 hover:shadow-xl transition-all duration-500"
                                                >
                                                    <div className={`p-5 rounded-[1.5rem] shadow-sm ${log.level === 'error' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : log.level === 'warn' ? 'bg-amber-50 text-amber-500 shadow-amber-100' : 'bg-gray-50 text-gray-400 shadow-gray-100'}`}>
                                                        <Activity size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-100">
                                                                    {log.context || 'Platform System'}
                                                                </span>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${log.level === 'error' ? 'bg-rose-500 animate-pulse' : log.level === 'warn' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <span className="text-[10px] font-serif italic text-gray-300">
                                                                    {new Date(log.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' })}
                                                                </span>
                                                                <button 
                                                                    onClick={() => handleDeleteLog(log.id)}
                                                                    className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="font-serif text-2xl text-gray-900 leading-tight tracking-tight">{log.message}</p>
                                                        {log.userId && (
                                                            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                                <Users size={12} />
                                                                Source UID: {log.userId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
