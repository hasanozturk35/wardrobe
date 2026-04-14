import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Menu, Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
            console.error("Failed to fetch social feed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const handleLike = async (postId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/like/${postId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchFeed();
            }
        } catch (error) {
            console.error("Like failed", error);
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
            console.error("Failed to fetch comments", error);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Direct link copied to clipboard');
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-12 pb-32 px-6 relative">
            {/* Boutique Header */}
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

            {/* Feed Container */}
            <div className="w-full max-w-xl space-y-24">
                {loading ? (
                    <div className="w-full h-40 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-black opacity-20" />
                    </div>
                ) : feed.length === 0 ? (
                    <div className="text-center py-24 text-gray-400 font-serif italic bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60">
                        <Share2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-2xl">Henüz kimse kombin paylaşmamış.</p>
                        <p className="text-sm mt-3 opacity-60">İlk lüks görünümünü sen paylaş!</p>
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
                            <div className="overflow-hidden">
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
                                            {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard();
                                        }}
                                        className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                                    >
                                        <Share2 size={18} className="text-gray-400" />
                                    </button>
                                </div>

                                {/* Main Image */}
                                <motion.div className="relative aspect-[3/4.5] overflow-hidden rounded-[3rem] bg-white shadow-xl p-3">
                                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
                                        {post.coverUrl ? (
                                            <img 
                                                src={`${API_URL}${post.coverUrl}`} 
                                                alt="Outfit" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 uppercase font-serif tracking-widest text-gray-300">Vogue</div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Actions */}
                                <div className="mt-8 flex items-center gap-8 px-2">
                                    <button 
                                        onClick={() => handleLike(post.id)}
                                        className="flex items-center gap-2 group/btn"
                                    >
                                        <Heart size={24} strokeWidth={1.5} className="group-hover/btn:text-rose-500 transition-colors" />
                                        <span className="text-xs font-bold tracking-widest">{post._count.likes}</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveCommentsPostId(post.id);
                                            fetchComments(post.id);
                                        }}
                                        className="flex items-center gap-2 group/btn"
                                    >
                                        <MessageCircle size={24} strokeWidth={1.5} className="group-hover/btn:text-indigo-500 transition-colors" />
                                        <span className="text-xs font-bold tracking-widest">{post._count.comments}</span>
                                    </button>
                                </div>

                                <div className="mt-6 px-2">
                                    <h2 className="text-3xl font-serif tracking-tight mb-2">{post.name || 'Editorial Look'}</h2>
                                    <p className="text-gray-500 font-serif italic text-lg opacity-70">{post.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Comments simplified */}
            <AnimatePresence>
                {activeCommentsPostId && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed inset-x-0 bottom-0 h-[70vh] bg-white/90 backdrop-blur-3xl z-[100] rounded-t-[4rem] shadow-2xl p-10 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-serif">Reviews</h3>
                            <button onClick={() => setActiveCommentsPostId(null)} className="p-2 bg-gray-100 rounded-full"><X size={24}/></button>
                        </div>
                        <div className="space-y-8">
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                                    <div>
                                        <h4 className="font-bold text-sm tracking-tight">{c.user.name || 'User'}</h4>
                                        <p className="text-gray-600 font-serif italic">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialFeedPage;
