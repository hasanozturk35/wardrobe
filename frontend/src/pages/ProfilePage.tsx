import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Edit3, Check, X, LogOut, Shirt, BookOpen, Eye,
    User, Mail, Calendar, Shield, Heart,
    ChevronRight, Lock, ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getImageUrl } from '../config';

type Tab = 'profil' | 'ayarlar';

interface Stats {
    outfitCount: number;
    wardrobeCount: number;
    publicCount: number;
}

interface PublicOutfit {
    id: string;
    name: string | null;
    coverUrl: string | null;
    _count: { likes: number; comments: number };
    createdAt: string;
}

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuthStore();
    const navigate = useNavigate();

    const [tab,             setTab]             = useState<Tab>('profil');
    const [stats,           setStats]           = useState<Stats | null>(null);
    const [outfits,         setOutfits]         = useState<PublicOutfit[]>([]);
    const [editingName,     setEditingName]     = useState(false);
    const [nameValue,       setNameValue]       = useState(user?.name || '');
    const [savingName,      setSavingName]      = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview,   setAvatarPreview]   = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get('/users/stats').then(r => setStats(r.data)).catch(() => {});
        api.get('/users/profile').then(r => {
            updateUser({ name: r.data.name, avatarUrl: r.data.avatarUrl });
            setNameValue(r.data.name || '');
        }).catch(() => {});
        if (user?.id) {
            api.get(`/users/${user.id}/public`).then(r => {
                setOutfits(r.data?.outfits || []);
            }).catch(() => {});
        }
    }, []);

    const saveName = async () => {
        if (!nameValue.trim()) return;
        setSavingName(true);
        try {
            const res = await api.patch('/users/profile', { name: nameValue.trim() });
            updateUser({ name: res.data.name });
            setEditingName(false);
        } catch {} finally { setSavingName(false); }
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
        } catch { setAvatarPreview(null); }
        finally { setUploadingAvatar(false); }
    };

    const avatarSrc = avatarPreview || (user?.avatarUrl ? getImageUrl(user.avatarUrl) : null);

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
        : null;

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-32">

            {/* ── Cover Banner ── */}
            <div className="relative h-52 lg:h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700" />
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {/* Decorative text */}
                <div className="absolute bottom-6 right-8 text-right">
                    <p className="text-white/15 text-[9px] font-mono uppercase tracking-[0.6em]">Maison Wardrobe</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6">

                {/* ── Avatar + Identity Row ── */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 mb-8 relative z-10">
                    {/* Avatar */}
                    <div className="relative w-fit shrink-0">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[1.75rem] border-4 border-white shadow-2xl overflow-hidden bg-stone-200 flex items-center justify-center">
                            {avatarSrc ? (
                                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={44} className="text-stone-400" />
                            )}
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[1.4rem]">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={14} />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 pb-1">
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
                                            className="font-serif text-2xl border-b-2 border-black bg-transparent outline-none w-52 text-gray-900"
                                        />
                                        <button onClick={saveName} disabled={savingName}
                                            className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50">
                                            {savingName ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                                        </button>
                                        <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }}
                                            className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2">
                                        <h1 className="font-serif text-2xl text-gray-900 leading-none">
                                            {user?.name || 'İsimsiz Kullanıcı'}
                                        </h1>
                                        <button onClick={() => setEditingName(true)}
                                            className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-400 hover:text-black">
                                            <Edit3 size={13} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {user?.role === 'ADMIN' && (
                                <span className="text-[9px] font-mono uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">Admin</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                                <Mail size={11} /> {user?.email}
                            </span>
                            {memberSince && (
                                <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                                    <Calendar size={11} /> {memberSince}'den beri üye
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { icon: <Shirt size={18} className="text-stone-400" />, label: 'Gardırop', value: stats?.wardrobeCount ?? '—', href: '/wardrobe' },
                        { icon: <BookOpen size={18} className="text-stone-400" />, label: 'Kombin', value: stats?.outfitCount ?? '—', href: '/lookbook' },
                        { icon: <Eye size={18} className="text-stone-400" />, label: 'Paylaşım', value: stats?.publicCount ?? '—', href: '/community' },
                    ].map(s => (
                        <motion.button
                            key={s.label}
                            onClick={() => navigate(s.href)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col items-center gap-2 hover:border-stone-400 hover:shadow-md transition-all group"
                        >
                            {s.icon}
                            <span className="text-3xl font-serif font-light text-gray-900">{s.value}</span>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 group-hover:text-black transition-colors">{s.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex gap-0 border-b border-stone-100 mb-8">
                    {([['profil', 'Profilim'], ['ayarlar', 'Ayarlar']] as const).map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`pb-4 pr-8 text-[10px] font-mono uppercase tracking-[0.35em] border-b-[1.5px] -mb-[1px] transition-all duration-300 ${
                                tab === id ? 'border-black text-black' : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >

                        {/* ─────────── TAB: PROFİL ─────────── */}
                        {tab === 'profil' && (
                            <div className="space-y-8">

                                {/* Public outfits grid */}
                                {outfits.length > 0 ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <h2 className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Paylaşılan Kombinler</h2>
                                            <button onClick={() => navigate('/community')}
                                                className="text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-black transition-colors flex items-center gap-1">
                                                Tümünü Gör <ChevronRight size={11} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {outfits.slice(0, 9).map(outfit => (
                                                <motion.div
                                                    key={outfit.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative group cursor-pointer"
                                                    onClick={() => navigate('/community')}
                                                >
                                                    {outfit.coverUrl ? (
                                                        <img
                                                            src={getImageUrl(outfit.coverUrl)}
                                                            alt={outfit.name || 'Kombin'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <BookOpen size={24} className="text-stone-300" strokeWidth={1} />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white">
                                                            <span className="flex items-center gap-1 text-[11px] font-mono">
                                                                <Heart size={12} fill="white" /> {outfit._count.likes}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
                                        <BookOpen size={32} className="text-stone-200 mx-auto mb-4" strokeWidth={1} />
                                        <p className="font-serif text-xl text-stone-400 mb-2">Henüz kombin paylaşılmadı.</p>
                                        <p className="text-[11px] font-mono text-stone-300 uppercase tracking-wider mb-6">Lookbook'tan kombini topluluğa paylaş</p>
                                        <button onClick={() => navigate('/lookbook')}
                                            className="px-6 py-2.5 bg-black text-white text-[10px] font-mono uppercase tracking-widest hover:bg-stone-800 transition-colors rounded-full">
                                            Lookbook'a Git
                                        </button>
                                    </div>
                                )}

                                {/* Quick links */}
                                <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
                                    {[
                                        { icon: <Shirt size={16} className="text-stone-400" />, label: 'Gardırobum', sub: `${stats?.wardrobeCount ?? 0} parça`, href: '/wardrobe' },
                                        { icon: <BookOpen size={16} className="text-stone-400" />, label: 'Lookbook', sub: `${stats?.outfitCount ?? 0} kombin`, href: '/lookbook' },
                                        { icon: <Eye size={16} className="text-stone-400" />, label: 'Topluluk', sub: 'Keşfet ve paylaş', href: '/community' },
                                    ].map(item => (
                                        <button key={item.label} onClick={() => navigate(item.href)}
                                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group text-left">
                                            <div className="w-9 h-9 bg-stone-50 group-hover:bg-stone-900 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-serif text-[14px] text-gray-900">{item.label}</p>
                                                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{item.sub}</p>
                                            </div>
                                            <ChevronRight size={15} className="text-stone-300 group-hover:text-black transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─────────── TAB: AYARLAR ─────────── */}
                        {tab === 'ayarlar' && (
                            <div className="space-y-6">

                                {/* Profile settings */}
                                <div>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-3 px-1">Profil Bilgileri</p>
                                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
                                        {/* Name */}
                                        <div className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                                                <User size={16} className="text-stone-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">Ad Soyad</p>
                                                <AnimatePresence mode="wait">
                                                    {editingName ? (
                                                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                            className="flex items-center gap-2">
                                                            <input
                                                                autoFocus
                                                                value={nameValue}
                                                                onChange={e => setNameValue(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                                                                className="font-serif text-[15px] border-b border-black bg-transparent outline-none flex-1"
                                                            />
                                                            <button onClick={saveName} disabled={savingName}
                                                                className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50">
                                                                {savingName ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
                                                            </button>
                                                            <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }}
                                                                className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center">
                                                                <X size={12} />
                                                            </button>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                            className="font-serif text-[15px] text-gray-900">
                                                            {user?.name || 'İsimsiz'}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            {!editingName && (
                                                <button onClick={() => setEditingName(true)}
                                                    className="text-[9px] font-mono uppercase tracking-widest text-stone-400 hover:text-black transition-colors">
                                                    Düzenle
                                                </button>
                                            )}
                                        </div>

                                        {/* Email (read-only) */}
                                        <div className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Mail size={16} className="text-stone-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">E-Posta</p>
                                                <p className="font-serif text-[15px] text-gray-900">{user?.email}</p>
                                            </div>
                                            <Lock size={14} className="text-stone-300" />
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Camera size={16} className="text-stone-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">Profil Fotoğrafı</p>
                                                <p className="font-serif text-[13px] text-stone-400 italic">
                                                    {uploadingAvatar ? 'Yükleniyor...' : 'Fotoğraf yükle'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[9px] font-mono uppercase tracking-widest text-stone-400 hover:text-black transition-colors">
                                                Değiştir
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Account settings */}
                                <div>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-3 px-1">Hesap</p>
                                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
                                        <div className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Calendar size={16} className="text-stone-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">Üyelik Tarihi</p>
                                                <p className="font-serif text-[15px] text-gray-900">{memberSince || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 px-6 py-4">
                                            <div className="w-9 h-9 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Shield size={16} className="text-stone-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">Hesap Türü</p>
                                                <p className="font-serif text-[15px] text-gray-900">{user?.role === 'ADMIN' ? 'Yönetici' : 'Standart Üye'}</p>
                                            </div>
                                            {user?.role === 'ADMIN' && (
                                                <button onClick={() => navigate('/admin')}
                                                    className="text-[9px] font-mono uppercase tracking-widest text-stone-400 hover:text-black transition-colors flex items-center gap-1">
                                                    Admin Panel <ExternalLink size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Danger zone */}
                                <div>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-3 px-1">Oturum</p>
                                    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                        <button
                                            onClick={() => { logout(); navigate('/auth'); }}
                                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors group text-left"
                                        >
                                            <div className="w-9 h-9 bg-stone-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                                <LogOut size={16} className="text-stone-400 group-hover:text-red-500 transition-colors" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-serif text-[15px] text-gray-900 group-hover:text-red-600 transition-colors">Çıkış Yap</p>
                                                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Oturumu kapat</p>
                                            </div>
                                            <ChevronRight size={15} className="text-stone-300 group-hover:text-red-400 transition-colors" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
