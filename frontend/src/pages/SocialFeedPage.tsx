import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Plus, X, Loader2, Send, ShoppingBag,
         ExternalLink, UserCheck, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { API_URL, getImageUrl } from '../config';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import UserProfileSheet from '../components/social/UserProfileSheet';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string | null; avatarUrl: string | null };
}

interface ProductLink {
    label: string;
    brand: string;
    url: string;
    imageUrl?: string;
}

interface FeedItem {
    id: string;
    name: string | null;
    description: string | null;
    coverUrl: string | null;
    createdAt: string;
    occasion?: string | null;
    productLinks?: ProductLink[] | null;
    user: { id: string; name: string | null; avatarUrl: string | null };
    items: any[];
    _count: { likes: number; comments: number };
}

const OCCASIONS = [
    { value: '', label: 'Tümü', emoji: '✨' },
    { value: 'Kahve', label: 'Kahve', emoji: '☕' },
    { value: 'Ofis', label: 'Ofis', emoji: '💼' },
    { value: 'Date', label: 'Date', emoji: '🌙' },
    { value: 'Günlük', label: 'Günlük', emoji: '👟' },
    { value: 'Gece', label: 'Gece', emoji: '🎉' },
    { value: 'Spor', label: 'Spor', emoji: '🏃' },
    { value: 'Bahar', label: 'Bahar', emoji: '🌸' },
    { value: 'Kış', label: 'Kış', emoji: '❄️' },
];

const Avatar: React.FC<{ src?: string | null; name?: string | null; size?: number; onClick?: () => void }> = ({ src, name, size = 40, onClick }) => (
    <button
        onClick={onClick}
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden bg-gray-100 shrink-0 border border-white/80 shadow-sm hover:opacity-90 transition-opacity"
    >
        {src
            ? <img src={getImageUrl(src)} alt={name || ''} className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center font-serif italic text-gray-400" style={{ fontSize: size / 2.5 }}>
                {name?.charAt(0) || '?'}
              </span>
        }
    </button>
);

const SocialFeedPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useUIStore();
    const { user: currentUser } = useAuthStore();

    const [feed,                  setFeed]                  = useState<FeedItem[]>([]);
    const [loading,               setLoading]               = useState(true);
    const [activeOccasion,        setActiveOccasion]        = useState('');
    const [activeCommentsPostId,  setActiveCommentsPostId]  = useState<string | null>(null);
    const [activeLinksPost,       setActiveLinksPost]       = useState<FeedItem | null>(null);
    const [comments,              setComments]              = useState<Comment[]>([]);
    const [newComment,            setNewComment]            = useState('');
    const [submittingComment,     setSubmittingComment]     = useState(false);
    const [likedPosts,            setLikedPosts]            = useState<Set<string>>(new Set());
    const [savedPosts,            setSavedPosts]            = useState<Set<string>>(new Set());
    const [followingUsers,        setFollowingUsers]        = useState<Set<string>>(new Set());
    const [activeProfileUserId,   setActiveProfileUserId]   = useState<string | null>(null);
    const activePostRef = useRef<string | null>(null);

    // Unique feed users (for stories + sidebar), excluding current user
    const feedUsers = useMemo(() => {
        const seen = new Set<string>();
        const users: FeedItem['user'][] = [];
        feed.forEach(p => {
            if (!seen.has(p.user.id) && p.user.id !== currentUser?.id) {
                seen.add(p.user.id);
                users.push(p.user);
            }
        });
        return users;
    }, [feed, currentUser?.id]);

    const fetchFeed = async (occasion?: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = occasion ? `?occasion=${encodeURIComponent(occasion)}` : '';
            const res = await fetch(`${API_URL}/social/feed${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setFeed(await res.json());
            else showToast('Akış yüklenemedi.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
        finally { setLoading(false); }
    };

    const fetchComments = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/comments/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setComments(await res.json());
        } catch { /* yorum yüklenemedi — sessiz hata */ }
    };

    useEffect(() => {
        fetchFeed();
        const socket: Socket = io(API_URL, { transports: ['websocket', 'polling'] });
        socket.on('new-post', (post: FeedItem) => {
            setFeed(prev => [post, ...prev]);
            showToast('Yeni bir kombin paylaşıldı!');
        });
        socket.on('like-update', ({ outfitId, count }: { outfitId: string; count: number }) => {
            setFeed(prev => prev.map(p => p.id === outfitId ? { ...p, _count: { ...p._count, likes: count } } : p));
        });
        socket.on('new-comment', ({ outfitId, comment }: { outfitId: string; comment: Comment }) => {
            setFeed(prev => prev.map(p => p.id === outfitId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p));
            if (activePostRef.current === outfitId) setComments(prev => [comment, ...prev]);
        });
        return () => { socket.disconnect(); };
    }, []);

    const handleOccasionChange = (value: string) => {
        setActiveOccasion(value);
        fetchFeed(value || undefined);
    };

    const openComments = (postId: string) => {
        setActiveCommentsPostId(postId);
        activePostRef.current = postId;
        setComments([]);
        fetchComments(postId);
    };

    const handleLike = async (postId: string) => {
        const was = likedPosts.has(postId);
        setLikedPosts(prev => { const n = new Set(prev); was ? n.delete(postId) : n.add(postId); return n; });
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/social/like/${postId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        } catch {
            setLikedPosts(prev => { const n = new Set(prev); was ? n.add(postId) : n.delete(postId); return n; });
        }
    };

    const handleFollowUser = async (userId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/${userId}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setFollowingUsers(prev => {
                const n = new Set(prev);
                data.following ? n.add(userId) : n.delete(userId);
                return n;
            });
            showToast(data.following ? 'Takip edildi.' : 'Takipten çıkıldı.');
        } catch { showToast('İşlem başarısız.', 'error'); }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !activeCommentsPostId || submittingComment) return;
        setSubmittingComment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/comments/${activeCommentsPostId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() })
            });
            if (res.ok) setNewComment('');
            else showToast('Yorum gönderilemedi.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
        finally { setSubmittingComment(false); }
    };

    const getOccasionInfo = (value: string) => OCCASIONS.find(o => o.value === value);

    const getPostCover = (post: FeedItem) => {
        const raw = post.coverUrl || post.items?.find(i => i.garmentItem?.photos?.length > 0)?.garmentItem?.photos?.[0]?.url;
        return raw ? getImageUrl(raw) : null;
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-32">
            <div className="max-w-5xl mx-auto px-4 pt-10 lg:pt-14">

                {/* ── Header ── */}
                <header className="flex items-center justify-between mb-8 px-2">
                    <div className="w-10" />
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.6em] text-gray-300 mb-3 flex items-center justify-center gap-3">
                            <span className="w-6 h-px bg-gray-200 inline-block" />
                            Stil Topluluğu
                            <span className="w-6 h-px bg-gray-200 inline-block" />
                        </p>
                        <h1 className="text-5xl lg:text-6xl font-light font-serif text-gray-900 tracking-tight leading-none">Vitrin<span className="italic text-gray-300">.</span></h1>
                        <p className="text-[9px] font-mono uppercase tracking-[0.45em] text-gray-300 mt-2">İlham · Stil · Kimlik</p>
                    </div>
                    <button onClick={() => navigate('/lookbook')}
                        className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                        <Plus size={18} className="text-white" strokeWidth={2} />
                    </button>
                </header>

                <div className="flex gap-10 items-start">

                    {/* ══════════════════════════════════════
                        MAIN FEED COLUMN
                    ══════════════════════════════════════ */}
                    <div className="flex-1 min-w-0">

                        {/* Stories Strip */}
                        {feedUsers.length > 0 && (
                            <div className="mb-6">
                                <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide">
                                    {/* My story / add */}
                                    <button
                                        onClick={() => navigate('/lookbook')}
                                        className="flex flex-col items-center gap-2 shrink-0 group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-black transition-colors">
                                            <Plus size={20} className="text-gray-400 group-hover:text-black transition-colors" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Ekle</span>
                                    </button>
                                    {/* Feed users */}
                                    {feedUsers.slice(0, 8).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => setActiveProfileUserId(u.id)}
                                            className="flex flex-col items-center gap-2 shrink-0"
                                        >
                                            <div className="p-[2px] rounded-full bg-gradient-to-tr from-gray-400 to-gray-600">
                                                <div className="w-15 h-15 p-[2px] rounded-full bg-white">
                                                    <Avatar src={u.avatarUrl} name={u.name} size={56} />
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-mono tracking-wide text-gray-500 max-w-[56px] truncate">{u.name?.split(' ')[0] || 'User'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Occasion Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide px-1">
                            {OCCASIONS.map(occ => (
                                <button
                                    key={occ.value}
                                    onClick={() => handleOccasionChange(occ.value)}
                                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${
                                        activeOccasion === occ.value
                                            ? 'bg-black text-white'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black'
                                    }`}
                                >
                                    <span>{occ.emoji}</span> {occ.label}
                                </button>
                            ))}
                        </div>

                        {/* Feed */}
                        <div className="space-y-10">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="animate-spin h-6 w-6 text-gray-300" />
                                </div>
                            ) : feed.length === 0 ? (
                                <div className="text-center py-20 px-8">
                                    <div className="w-16 h-16 bg-white rounded-full border border-gray-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <MessageCircle size={24} className="text-gray-300" strokeWidth={1} />
                                    </div>
                                    <h3 className="text-3xl font-serif text-gray-800 mb-3 font-light">Henüz paylaşım yok.</h3>
                                    <p className="text-gray-400 font-serif italic mb-8 text-sm">Lookbook'tan outfitini topluluğa paylaş.</p>
                                    <button onClick={() => navigate('/lookbook')}
                                        className="px-8 py-3 bg-black text-white text-[10px] font-mono uppercase tracking-widest hover:bg-gray-800 transition-all">
                                        Lookbook'a Git
                                    </button>
                                </div>
                            ) : (
                                feed.map((post, idx) => {
                                    const cover = getPostCover(post);
                                    const isLiked = likedPosts.has(post.id);
                                    const isSaved = savedPosts.has(post.id);
                                    const isFollowing = followingUsers.has(post.user.id);
                                    const isSelf = post.user.id === currentUser?.id;
                                    const occasionInfo = post.occasion ? getOccasionInfo(post.occasion) : null;

                                    return (
                                        <motion.article
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: '-60px' }}
                                            transition={{ duration: 0.5, delay: idx < 3 ? idx * 0.08 : 0 }}
                                            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100/80 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
                                        >
                                            {/* Post header */}
                                            <div className="flex items-center justify-between px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={post.user.avatarUrl}
                                                        name={post.user.name}
                                                        size={42}
                                                        onClick={() => setActiveProfileUserId(post.user.id)}
                                                    />
                                                    <div>
                                                        <button
                                                            onClick={() => setActiveProfileUserId(post.user.id)}
                                                            className="font-serif font-medium text-gray-900 leading-none hover:opacity-60 transition-opacity text-[15px]"
                                                        >
                                                            {post.user.name || 'Anonim'}
                                                        </button>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">
                                                                {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                            {occasionInfo && (
                                                                <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
                                                                    {occasionInfo.emoji} {post.occasion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleFollowUser(post.user.id)}
                                                            className={`text-[9px] font-mono uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${
                                                                isFollowing
                                                                    ? 'border-gray-200 text-gray-400 hover:border-gray-400'
                                                                    : 'border-black text-black hover:bg-black hover:text-white'
                                                            }`}
                                                        >
                                                            {isFollowing ? 'Takipte' : 'Takip Et'}
                                                        </button>
                                                    )}
                                                    <button className="text-gray-400 hover:text-black transition-colors">
                                                        <MoreHorizontal size={18} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Post image */}
                                            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                                                {cover ? (
                                                    <img
                                                        src={cover}
                                                        alt={post.name || 'Outfit'}
                                                        className="w-full h-full object-cover"
                                                        onDoubleClick={() => {
                                                            if (!isLiked) handleLike(post.id);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-[11px] font-mono uppercase tracking-widest text-gray-300">Görsel Yok</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action bar */}
                                            <div className="px-5 pt-4 pb-2">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-5">
                                                        <button
                                                            onClick={() => handleLike(post.id)}
                                                            className="flex items-center gap-1.5 group/like"
                                                        >
                                                            <Heart
                                                                size={22}
                                                                strokeWidth={1.5}
                                                                className={`transition-all duration-200 ${
                                                                    isLiked
                                                                        ? 'fill-rose-500 text-rose-500 scale-110'
                                                                        : 'group-hover/like:text-rose-400 text-gray-700'
                                                                }`}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => openComments(post.id)}
                                                            className="text-gray-700 hover:text-black transition-colors"
                                                        >
                                                            <MessageCircle size={22} strokeWidth={1.5} />
                                                        </button>
                                                        {post.productLinks && post.productLinks.length > 0 && (
                                                            <button
                                                                onClick={() => setActiveLinksPost(post)}
                                                                className="text-gray-700 hover:text-black transition-colors"
                                                            >
                                                                <ShoppingBag size={22} strokeWidth={1.5} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setSavedPosts(prev => {
                                                            const n = new Set(prev);
                                                            isSaved ? n.delete(post.id) : n.add(post.id);
                                                            return n;
                                                        })}
                                                        className="text-gray-700 hover:text-black transition-colors"
                                                    >
                                                        <Bookmark size={22} strokeWidth={1.5} className={isSaved ? 'fill-black text-black' : ''} />
                                                    </button>
                                                </div>

                                                {/* Likes count */}
                                                <p className="text-[11px] font-mono font-medium text-gray-900 mb-2">
                                                    {post._count.likes > 0 && `${post._count.likes} beğeni`}
                                                </p>

                                                {/* Caption */}
                                                <div className="mb-2">
                                                    <span className="font-serif font-medium text-gray-900 text-[14px] mr-2">{post.user.name?.split(' ')[0]}</span>
                                                    <span className="font-serif italic text-gray-700 text-[14px]">{post.name || 'Kombin'}</span>
                                                </div>
                                                {post.description && (
                                                    <p className="text-[13px] font-serif italic text-gray-400 mb-2 leading-relaxed">{post.description}</p>
                                                )}

                                                {/* Comments preview */}
                                                {post._count.comments > 0 && (
                                                    <button
                                                        onClick={() => openComments(post.id)}
                                                        className="text-[11px] font-mono text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-widest"
                                                    >
                                                        {post._count.comments} yorumu gör
                                                    </button>
                                                )}
                                            </div>

                                            {/* Quick comment input */}
                                            <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-3">
                                                <Avatar src={currentUser?.avatarUrl} name={currentUser?.name} size={28} />
                                                <input
                                                    placeholder="Yorum ekle..."
                                                    className="flex-1 bg-transparent text-[12px] font-serif italic text-gray-600 outline-none placeholder:text-gray-300 cursor-pointer"
                                                    onFocus={() => openComments(post.id)}
                                                />
                                            </div>
                                        </motion.article>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ══════════════════════════════════════
                        RIGHT SIDEBAR — desktop only
                    ══════════════════════════════════════ */}
                    <aside className="hidden lg:block w-[300px] shrink-0 sticky top-14">

                        {/* My Profile Mini */}
                        {currentUser && (
                            <div className="flex items-center gap-4 mb-8">
                                <Avatar src={currentUser.avatarUrl} name={currentUser.name} size={52} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-serif font-medium text-gray-900 text-[15px] truncate">{currentUser.name || 'Profil'}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-0.5">Maison Wardrobe</p>
                                </div>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-[9px] font-mono uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap"
                                >
                                    Profilim
                                </button>
                            </div>
                        )}

                        {/* Suggested Accounts */}
                        {feedUsers.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-5">
                                    <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-gray-500">Önerilen Hesaplar</span>
                                    <button
                                        onClick={() => setActiveProfileUserId(feedUsers[0]?.id || null)}
                                        className="text-[9px] font-mono uppercase tracking-widest text-gray-900 hover:opacity-60 transition-opacity"
                                    >
                                        Tümünü Gör
                                    </button>
                                </div>
                                <div className="space-y-5">
                                    {feedUsers.slice(0, 5).map(u => {
                                        const isFollowing = followingUsers.has(u.id);
                                        return (
                                            <div key={u.id} className="flex items-center gap-3">
                                                <Avatar
                                                    src={u.avatarUrl}
                                                    name={u.name}
                                                    size={40}
                                                    onClick={() => setActiveProfileUserId(u.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <button
                                                        onClick={() => setActiveProfileUserId(u.id)}
                                                        className="font-serif font-medium text-gray-900 text-[13px] truncate block hover:opacity-60 transition-opacity"
                                                    >
                                                        {u.name || 'Kullanıcı'}
                                                    </button>
                                                    <p className="text-[9px] font-mono text-gray-400 tracking-wide">Maison üyesi</p>
                                                </div>
                                                <button
                                                    onClick={() => handleFollowUser(u.id)}
                                                    className={`text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                                                        isFollowing
                                                            ? 'text-gray-400 hover:text-gray-700'
                                                            : 'text-blue-500 hover:text-blue-700 font-bold'
                                                    }`}
                                                >
                                                    {isFollowing ? <UserCheck size={14} /> : 'Takip Et'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-10 space-y-1">
                                    {['Hakkında', 'Yardım', 'Gizlilik', 'Şartlar'].map(l => (
                                        <span key={l} className="text-[9px] font-mono text-gray-300 uppercase tracking-widest mr-3">{l}</span>
                                    ))}
                                    <p className="text-[8px] font-mono text-gray-300 uppercase tracking-widest mt-3">© 2026 Maison Wardrobe</p>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* ═══════ PRODUCT LINKS PANEL ═══════ */}
            <AnimatePresence>
                {activeLinksPost && (
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 max-h-[75vh] bg-white z-[300] rounded-t-[2.5rem] shadow-2xl flex flex-col border-t border-gray-100"
                    >
                        <div className="flex justify-between items-center px-8 pt-8 pb-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-2xl font-serif font-light">Kombin Listesi</h3>
                                <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-0.5">{activeLinksPost.name || 'Kombin'}</p>
                            </div>
                            <button onClick={() => setActiveLinksPost(null)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-6 py-5 space-y-3">
                            {activeLinksPost.productLinks!.map((product, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-3"
                                >
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.label} className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white border border-gray-100" />
                                    ) : (
                                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">{String(i + 1).padStart(2, '0')}</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-serif font-medium text-sm text-gray-900 truncate">{product.brand}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono truncate">{product.label}</p>
                                    </div>
                                    {product.url && (
                                        <a href={/^https?:\/\//i.test(product.url) ? product.url : `https://${product.url}`} target="_blank" rel="noopener noreferrer"
                                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-full text-[9px] font-mono uppercase tracking-widest hover:bg-gray-800 transition-colors">
                                            <ExternalLink size={11} /> Git
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ COMMENTS PANEL ═══════ */}
            <AnimatePresence>
                {activeCommentsPostId && (
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 h-[72vh] bg-white z-[300] rounded-t-[2.5rem] shadow-2xl flex flex-col border-t border-gray-100"
                    >
                        <div className="flex justify-between items-center px-8 pt-7 pb-5 border-b border-gray-100">
                            <h3 className="text-2xl font-serif font-light">Yorumlar</h3>
                            <button onClick={() => { setActiveCommentsPostId(null); activePostRef.current = null; setNewComment(''); }}
                                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 font-serif italic mt-10 text-lg">Henüz yorum yok. İlk sen yaz!</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <Avatar src={c.user.avatarUrl} name={c.user.name} size={36} />
                                        <div className="bg-gray-50 rounded-2xl px-4 py-3 flex-1">
                                            <p className="font-serif font-medium text-gray-900 text-sm mb-1">{c.user.name || 'User'}</p>
                                            <p className="text-gray-600 font-serif italic text-sm">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="px-8 py-4 border-t border-gray-100 flex gap-3 items-center">
                            <Avatar src={currentUser?.avatarUrl} name={currentUser?.name} size={36} />
                            <input
                                type="text" value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                placeholder="Yorum ekle..."
                                className="flex-1 bg-gray-50 rounded-full px-5 py-2.5 text-sm outline-none font-serif italic placeholder:text-gray-300 focus:bg-white border border-transparent focus:border-gray-200 transition-all"
                            />
                            <button onClick={handleAddComment} disabled={!newComment.trim() || submittingComment}
                                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition-colors">
                                {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ USER PROFILE SHEET ═══════ */}
            <UserProfileSheet
                userId={activeProfileUserId}
                onClose={() => setActiveProfileUserId(null)}
            />

            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default SocialFeedPage;
