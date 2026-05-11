import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../config';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface PublicOutfit {
    id: string;
    name: string | null;
    coverUrl: string | null;
    items: any[];
}

interface PublicProfile {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: string;
    followerCount: number;
    followingCount: number;
    outfitCount: number;
    isFollowing: boolean;
    outfits: PublicOutfit[];
}

interface Props {
    userId: string | null;
    onClose: () => void;
}

const UserProfileSheet: React.FC<Props> = ({ userId, onClose }) => {
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        setProfile(null);
        api.get(`/users/${userId}/public`)
            .then(({ data }) => {
                setProfile(data);
                setFollowing(data.isFollowing);
                setFollowerCount(data.followerCount);
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const handleFollow = async () => {
        if (!userId) return;
        const { data } = await api.post(`/users/${userId}/follow`);
        setFollowing(data.following);
        setFollowerCount(prev => data.following ? prev + 1 : prev - 1);
    };

    const getOutfitCover = (outfit: PublicOutfit) => {
        const raw = outfit.coverUrl
            || outfit.items?.find((i: any) => i.garmentItem?.photos?.length > 0)
                      ?.garmentItem?.photos?.[0]?.url;
        return raw ? getImageUrl(raw) : null;
    };

    const isSelf = currentUser?.id === userId;

    return (
        <AnimatePresence>
            {userId && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[350]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 h-[88vh] bg-[#FDFBF7] z-[360] rounded-t-[3rem] flex flex-col overflow-hidden"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors z-10"
                        >
                            <X size={18} />
                        </button>

                        {loading || !profile ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {/* Profile Header */}
                                <div className="px-8 pt-10 pb-6">
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md shrink-0">
                                            {profile.avatarUrl ? (
                                                <img src={getImageUrl(profile.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="font-serif italic text-2xl text-gray-300">
                                                        {profile.name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-2xl font-serif tracking-tight truncate">
                                                {profile.name || 'Anonim Kullanıcı'}
                                            </h2>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">
                                                {new Date(profile.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} üyesi
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex gap-0 mb-6 bg-white rounded-2xl overflow-hidden border border-gray-100">
                                        {[
                                            { label: 'Kombin', value: profile.outfitCount },
                                            { label: 'Takipçi', value: followerCount },
                                            { label: 'Takip', value: profile.followingCount },
                                        ].map((s, i) => (
                                            <div key={i} className={`flex-1 py-4 text-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                                                <p className="text-2xl font-serif">{s.value}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Follow Button */}
                                    {!isSelf && (
                                        <button
                                            onClick={handleFollow}
                                            className={`w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                                following
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-black text-white shadow-lg'
                                            }`}
                                        >
                                            {following ? (
                                                <><UserCheck size={16} /> Takip Ediliyor</>
                                            ) : (
                                                <><UserPlus size={16} /> Takip Et</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Outfits Grid */}
                                <div className="px-6 pb-8">
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <Grid3X3 size={14} className="text-gray-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Paylaşılan Kombinler</span>
                                    </div>

                                    {profile.outfits.length === 0 ? (
                                        <p className="text-center py-12 text-gray-400 font-serif italic">
                                            Henüz paylaşılan kombin yok.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {profile.outfits.map(outfit => {
                                                const cover = getOutfitCover(outfit);
                                                return (
                                                    <div key={outfit.id} className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                                        {cover ? (
                                                            <img src={cover} alt={outfit.name || ''} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">No img</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserProfileSheet;
