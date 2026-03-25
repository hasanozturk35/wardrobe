import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Menu, Plus } from 'lucide-react';
import { API_URL } from '../config';

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
}

const SocialFeedPage: React.FC = () => {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchFeed();
    }, []);

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-12 pb-32 px-6">
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
            <div className="w-full max-w-xl space-y-20">
                {loading ? (
                    <div className="w-full h-40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : feed.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-serif italic bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60">
                        <Share2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-xl">Henüz kimse kombin paylaşmamış.</p>
                        <p className="text-sm mt-2 opacity-60">İlk paylaşan sen ol!</p>
                    </div>
                ) : (
                    feed.map(post => (
                        <div key={post.id} className="relative group">
                            <div className="absolute -inset-4 bg-white/30 backdrop-blur-xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 shadow-2xl shadow-black/5" />
                            
                            <div className="overflow-hidden">
                                {/* User Info */}
                                <div className="flex items-center space-x-4 mb-6 px-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-black/5 flex items-center justify-center overflow-hidden">
                                        {post.user.avatarUrl ? (
                                            <img src={post.user.avatarUrl} alt={post.user.name || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-serif italic text-sm">{post.user.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 font-serif text-md tracking-wide">{post.user.name || 'Anonymous'}</h3>
                                        <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                                            {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-black transition-colors">
                                        <Share2 size={18} />
                                    </button>
                                </div>

                                {/* Main Image */}
                                <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.08)] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] transition-all duration-1000 border-[6px] border-white p-2">
                                    <div className="w-full h-full rounded-[1.8rem] overflow-hidden">
                                        {post.coverUrl ? (
                                            <img 
                                                src={`${API_URL}${post.coverUrl}`} 
                                                alt="Outfit" 
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <span className="font-serif italic text-gray-200">No Image</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mt-8 px-4 space-y-4">
                                    <div className="flex items-center space-x-6">
                                        <button className="text-gray-900 hover:text-rose-500 transition-all active:scale-90">
                                            <Heart size={24} strokeWidth={1.5} />
                                        </button>
                                        <button className="text-gray-900 hover:text-indigo-500 transition-all active:scale-90">
                                            <MessageCircle size={24} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    
                                    {post.name && (
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-serif text-gray-900 leading-tight">{post.name}</h4>
                                            {post.description && (
                                                <p className="text-gray-500 font-serif italic text-md leading-relaxed opacity-70">{post.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SocialFeedPage;
