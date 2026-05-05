import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Edit3, Check, X, LogOut, Shirt, BookOpen, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
    outfitCount: number;
    wardrobeCount: number;
    publicCount: number;
}

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(user?.name || '');
    const [savingName, setSavingName] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get('/users/stats').then(r => setStats(r.data)).catch(() => {});
        api.get('/users/profile').then(r => {
            updateUser({ name: r.data.name, avatarUrl: r.data.avatarUrl });
            setNameValue(r.data.name || '');
        }).catch(() => {});
    }, []);

    const saveName = async () => {
        if (!nameValue.trim()) return;
        setSavingName(true);
        try {
            const res = await api.patch('/users/profile', { name: nameValue.trim() });
            updateUser({ name: res.data.name });
            setEditingName(false);
        } catch {
        } finally {
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
            const res = await api.post('/users/avatar', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser({ avatarUrl: res.data.avatarUrl });
        } catch {
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const avatarSrc = avatarPreview
        || (user?.avatarUrl ? `${API_URL}${user.avatarUrl}` : null);

    const statItems = [
        { icon: Shirt,    label: 'Gardırop',       value: stats?.wardrobeCount ?? '—' },
        { icon: BookOpen, label: 'Kombin',          value: stats?.outfitCount   ?? '—' },
        { icon: Eye,      label: 'Herkese Açık',   value: stats?.publicCount   ?? '—' },
    ];

    return (
        <div className="min-h-screen bg-[#fafaf8] pb-40">
            {/* Hero banner */}
            <div className="h-48 bg-gradient-to-br from-neutral-900 via-neutral-800 to-stone-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
            </div>

            <div className="max-w-2xl mx-auto px-6">
                {/* Avatar */}
                <div className="relative -mt-16 mb-6 w-fit">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-neutral-200 flex items-center justify-center">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-neutral-400" />
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                        <Camera size={15} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                {/* Name + email */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <AnimatePresence mode="wait">
                            {editingName ? (
                                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        value={nameValue}
                                        onChange={e => setNameValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                                        className="text-2xl font-serif border-b-2 border-black bg-transparent outline-none w-56"
                                    />
                                    <button onClick={saveName} disabled={savingName}
                                        className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50">
                                        {savingName ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                                    </button>
                                    <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }}
                                        className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-2">
                                    <h1 className="text-2xl font-serif text-neutral-900">
                                        {user?.name || 'İsimsiz'}
                                    </h1>
                                    <button onClick={() => setEditingName(true)}
                                        className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400 hover:text-black">
                                        <Edit3 size={13} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <p className="text-sm text-neutral-400 tracking-wide">{user?.email}</p>
                    {user?.role === 'ADMIN' && (
                        <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">
                            Admin
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {statItems.map(({ icon: Icon, label, value }) => (
                        <motion.div key={label}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col items-center gap-2">
                            <Icon size={18} className="text-neutral-400" />
                            <span className="text-2xl font-serif text-neutral-900">{value}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Account section */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-neutral-50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Hesap</p>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-neutral-700">Üyelik tarihi</p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-neutral-200 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    <LogOut size={14} />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
}
