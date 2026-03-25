import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Menu, Plus, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';

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
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

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
                // Refresh feed to get new counts
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

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/comments/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments(postId);
                fetchFeed(); // To update comment count in feed
            }
        } catch (error) {
            console.error("Comment failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-12 pb-32 px-6 relative">
            {/* Boutique Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-16">
                <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                    <Menu size={20} className="text-gray-900" />
                </button>
                <div className="text-center">
                    <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Community</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Street style from around the world</p>
                </div>
                <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
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
                            <div className="absolute -inset-8 bg-white/20 backdrop-blur-3xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                            
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
                                    <button className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                                        <Share2 size={18} className="text-gray-400" />
                                    </button>
                                </div>

                                {/* Main Image */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.8 }}
                                    className="relative aspect-[3/4.5] overflow-hidden rounded-[3rem] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] group-hover:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.2)] transition-all duration-1000 p-3"
                                >
                                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
                                        {post.coverUrl ? (
                                            <img 
                                                src={`${API_URL}${post.coverUrl}`} 
                                                alt="Outfit" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <span className="font-serif italic text-gray-200 text-2xl">Vogue</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Content & Actions */}
                                <div className="mt-10 space-y-6">
                                    <div className="flex items-center space-x-10">
                                        <button 
                                            onClick={() => handleLike(post.id)}
                                            className="group/btn flex items-center space-x-2 text-gray-900 transition-all hover:scale-110 active:scale-90"
                                        >
                                            <Heart size={26} strokeWidth={1.2} className="group-hover/btn:fill-rose-500 group-hover/btn:text-rose-500 transition-colors" />
                                            <span className="text-xs font-bold uppercase tracking-widest">{post._count.likes}</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setActiveCommentsPostId(post.id);
                                                fetchComments(post.id);
                                            }}
                                            className="group/btn flex items-center space-x-2 text-gray-900 transition-all hover:scale-110 active:scale-90"
                                        >
                                            <MessageCircle size={26} strokeWidth={1.2} className="group-hover/btn:text-indigo-500 transition-colors" />
                                            <span className="text-xs font-bold uppercase tracking-widest">{post._count.comments}</span>
                                        </button>
                                    </div>
                                    
                                    {post.name && (
                                        <div className="space-y-3">
                                            <h4 className="text-4xl font-serif font-light text-gray-900 leading-[0.9] tracking-tighter">{post.name}</h4>
                                            {post.description && (
                                                <p className="text-gray-500 font-serif italic text-lg leading-relaxed opacity-60 indent-4">{post.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Comment Drawer */}
            <AnimatePresence>
                {activeCommentsPostId && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveCommentsPostId(null)}
                            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white/70 backdrop-blur-[50px] rounded-t-[4rem] border-t border-white/40 shadow-[0_-40px_100px_rgba(0,0,0,0.1)] z-[70] flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="p-10 border-b border-black/5 flex justify-between items-center">
                                <div>
                                    <h3 className="font-serif text-3xl tracking-tight">Review</h3>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Thoughts from the community</p>
                                </div>
                                <button 
                                    onClick={() => setActiveCommentsPostId(null)}
                                    className="w-12 h-12 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                                {comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <MessageCircle size={60} strokeWidth={0.5} />
                                        <p className="font-serif italic text-xl mt-4">Be the first to share your thoughts.</p>
                                    </div>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="flex space-x-6">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
                                                {c.user.avatarUrl ? (
                                                    <img src={c.user.avatarUrl} alt={c.user.name || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-serif italic text-lg opacity-40">{c.user.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-bold text-gray-900 text-sm tracking-tight">{c.user.name || 'Anonymous'}</h4>
                                                    <span className="text-[8px] text-gray-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-600 text-md leading-relaxed font-serif opacity-80">{c.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Comment Input */}
                            <div className="p-10 bg-white/30 border-t border-black/5 backdrop-blur-xl">
                                <div className="max-w-xl mx-auto relative">
                                    <input 
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(activeCommentsPostId!)}
                                        placeholder="Add your review..."
                                        className="w-full bg-white/40 border border-white/60 p-6 rounded-3xl font-serif italic text-lg focus:ring-2 focus:ring-black/5 outline-none transition-all pr-16 shadow-inner"
                                    />
                                    <button 
                                        onClick={() => handleAddComment(activeCommentsPostId!)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialFeedPage;
