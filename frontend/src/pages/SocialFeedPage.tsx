import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Menu, Plus, X, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { useUIStore } from '../store/uiStore';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
    };
}

interface FeedItem {
    id: string;
    name: string | null;
    description: string | null;
    coverUrl: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
    };
    items: any[];
    _count: {
        likes: number;
        comments: number;
    };
}

const SocialFeedPage: React.FC = () => {
    const navigate = useNavigate();
    const { openMenu, showToast } = useUIStore();
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const activePostRef = useRef<string | null>(null);

    const fetchFeed = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeed(data);
            }
        } catch (error) {
            console.error('Failed to fetch social feed', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/comments/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    useEffect(() => {
        fetchFeed();

        const socket: Socket = io(API_URL, { transports: ['websocket', 'polling'] });

        socket.on('new-post', (post: FeedItem) => {
            setFeed(prev => [post, ...prev]);
            showToast('Yeni bir kombin paylaşıldı!');
        });

        socket.on('like-update', ({ outfitId, count }: { outfitId: string; count: number }) => {
            setFeed(prev => prev.map(p =>
                p.id === outfitId
                    ? { ...p, _count: { ...p._count, likes: count } }
                    : p
            ));
        });

        socket.on('new-comment', ({ outfitId, comment }: { outfitId: string; comment: Comment }) => {
            setFeed(prev => prev.map(p =>
                p.id === outfitId
                    ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } }
                    : p
            ));
            if (activePostRef.current === outfitId) {
                setComments(prev => [comment, ...prev]);
            }
        });

        return () => { socket.disconnect(); };
    }, []);

    const openComments = (postId: string) => {
        setActiveCommentsPostId(postId);
        activePostRef.current = postId;
        setComments([]);
        fetchComments(postId);
    };

    const closeComments = () => {
        setActiveCommentsPostId(null);
        activePostRef.current = null;
        setNewComment('');
    };

    const handleLike = async (postId: string) => {
        const wasLiked = likedPosts.has(postId);
        setLikedPosts(prev => {
            const next = new Set(prev);
            wasLiked ? next.delete(postId) : next.add(postId);
            return next;
        });

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/social/like/${postId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            // revert optimistic update
            setLikedPosts(prev => {
                const next = new Set(prev);
                wasLiked ? next.add(postId) : next.delete(postId);
                return next;
            });
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !activeCommentsPostId || submittingComment) return;
        setSubmittingComment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/comments/${activeCommentsPostId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment.trim() })
            });
            if (res.ok) {
                setNewComment('');
                // WebSocket will update comments list and feed count
            }
        } catch (error) {
            console.error('Comment failed', error);
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-12 pb-32 px-6 relative">
            {/* Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-16">
                <button
                    onClick={openMenu}
                    className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                >
                    <Menu size={20} className="text-gray-900" />
                </button>
                <div className="text-center">
                    <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Community</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Street style from around the world</p>
                </div>
                <button
                    onClick={() => navigate('/lookbook')}
                    className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                >
                    <Plus size={20} className="text-gray-900" />
                </button>
            </div>

            {/* Feed */}
            <div className="w-full max-w-xl space-y-24">
                {loading ? (
                    <div className="w-full h-40 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-black opacity-20" />
                    </div>
                ) : feed.length === 0 ? (
                    <div className="text-center py-24 text-gray-400 font-serif italic bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60">
                        <Share2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-2xl">Henüz kimse kombin paylaşmamış.</p>
                        <p className="text-sm mt-3 opacity-60">Lookbook'tan outfitini topluluğa paylaş!</p>
                        <button
                            onClick={() => navigate('/lookbook')}
                            className="mt-8 px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Lookbook'a Git
                        </button>
                    </div>
                ) : (
                    feed.map(post => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative group px-4"
                        >
                            {/* User Info */}
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-white border border-black/5 flex items-center justify-center overflow-hidden shadow-sm">
                                    {post.user.avatarUrl ? (
                                        <img src={post.user.avatarUrl} alt={post.user.name || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-serif italic text-lg opacity-40">{post.user.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 font-serif text-lg tracking-tight leading-none mb-1">{post.user.name || 'Anonymous'}</h3>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                                        {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>

                            {/* Image */}
                            <div className="relative aspect-[3/4.5] overflow-hidden rounded-[3rem] bg-white shadow-xl p-3">
                                <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
                                    {post.coverUrl ? (
                                        <img
                                            src={`${API_URL}${post.coverUrl}`}
                                            alt="Outfit"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 uppercase font-serif tracking-widest text-gray-300">No Image</div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex items-center gap-8 px-2">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className="flex items-center gap-2 group/btn"
                                >
                                    <Heart
                                        size={24}
                                        strokeWidth={1.5}
                                        className={`transition-all duration-200 ${
                                            likedPosts.has(post.id)
                                                ? 'fill-rose-500 text-rose-500 scale-110'
                                                : 'group-hover/btn:text-rose-400'
                                        }`}
                                    />
                                    <span className="text-xs font-bold tracking-widest">{post._count.likes}</span>
                                </button>
                                <button
                                    onClick={() => openComments(post.id)}
                                    className="flex items-center gap-2 group/btn"
                                >
                                    <MessageCircle size={24} strokeWidth={1.5} className="group-hover/btn:text-indigo-500 transition-colors" />
                                    <span className="text-xs font-bold tracking-widest">{post._count.comments}</span>
                                </button>
                            </div>

                            <div className="mt-6 px-2">
                                <h2 className="text-3xl font-serif tracking-tight mb-2">{post.name || 'Editorial Look'}</h2>
                                {post.description && (
                                    <p className="text-gray-500 font-serif italic text-lg opacity-70">{post.description}</p>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Comments Panel */}
            <AnimatePresence>
                {activeCommentsPostId && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 h-[75vh] bg-white/95 backdrop-blur-3xl z-[100] rounded-t-[4rem] shadow-2xl flex flex-col"
                    >
                        {/* Panel Header */}
                        <div className="flex justify-between items-center px-10 pt-10 pb-6 border-b border-gray-100">
                            <h3 className="text-3xl font-serif">Yorumlar</h3>
                            <button onClick={closeComments} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-6">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 font-serif italic mt-8">Henüz yorum yok. İlk yorumu sen yap!</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                                            {c.user.avatarUrl ? (
                                                <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-serif text-gray-400">{c.user.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm tracking-tight">{c.user.name || 'User'}</h4>
                                            <p className="text-gray-600 font-serif italic">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="px-10 py-6 border-t border-gray-100 flex gap-4 items-center">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                placeholder="Bir şeyler yaz..."
                                className="flex-1 bg-gray-50 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 font-serif placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || submittingComment}
                                className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center disabled:opacity-30 hover:scale-105 transition-all"
                            >
                                {submittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialFeedPage;
