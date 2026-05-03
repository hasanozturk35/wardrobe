import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Users, Plus, Sparkles, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../config';
import { api } from '../lib/api';
import { OutfitDesigner } from '../components/wardrobe/OutfitDesigner';
import { useUIStore } from '../store/uiStore';

interface OutfitItem {
    id: string;
    garmentItem: {
        category: string;
        brand: string | null;
        photos: { url: string }[];
    };
    slot: string | null;
}

interface Outfit {
    id: string;
    name: string | null;
    description: string | null;
    coverUrl: string | null;
    createdAt: string;
    isPublic?: boolean;
    items: OutfitItem[];
}

// ─── Item Collage (no coverUrl fallback) ─────────────────────────────────────
const ItemCollage: React.FC<{ items: OutfitItem[] }> = ({ items }) => {
    const photos = items
        .map(i => i.garmentItem.photos?.[0]?.url)
        .filter(Boolean)
        .slice(0, 4) as string[];

    if (photos.length === 0) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <span className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-200">No Image</span>
            </div>
        );
    }
    if (photos.length === 1) {
        return <img src={getImageUrl(photos[0])} className="w-full h-full object-cover" alt="" />;
    }
    if (photos.length === 2) {
        return (
            <div className="w-full h-full grid grid-cols-2 gap-px bg-gray-100">
                {photos.map((p, i) => <img key={i} src={getImageUrl(p)} className="w-full h-full object-cover" alt="" />)}
            </div>
        );
    }
    return (
        <div className="w-full h-full flex flex-col gap-px bg-gray-100">
            <img src={getImageUrl(photos[0])} className="w-full object-cover" style={{ flex: 2 }} alt="" />
            <div className="flex gap-px" style={{ flex: 1 }}>
                {photos.slice(1).map((p, i) => <img key={i} src={getImageUrl(p)} className="flex-1 object-cover" alt="" />)}
            </div>
        </div>
    );
};

// ─── Shared: card overlay (bottom name + item tags) ───────────────────────────
const CardOverlay: React.FC<{ outfit: Outfit }> = ({ outfit }) => (
    <>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 p-7">
            <div className="flex flex-wrap gap-1.5 mb-3">
                {outfit.items?.slice(0, 3).map((item, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[8px] font-black text-white/80 uppercase tracking-widest leading-none">
                        {item.garmentItem?.category || 'Piece'}
                    </span>
                ))}
                {outfit.items?.length > 3 && (
                    <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[8px] font-black text-white/80 uppercase tracking-widest leading-none">
                        +{outfit.items.length - 3}
                    </span>
                )}
            </div>
            <h3 className="text-white font-serif text-2xl leading-snug tracking-tight">{outfit.name || 'Editorial Look'}</h3>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mt-1">{outfit.items.length} pieces</p>
        </div>
    </>
);

// ─── Shared: top action bar ───────────────────────────────────────────────────
const CardActions: React.FC<{
    outfit: Outfit;
    onShare: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}> = ({ outfit, onShare, onDelete }) => (
    <div className="absolute top-5 inset-x-5 flex justify-between items-start">
        {outfit.isPublic ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                <Globe size={9} /> Public
            </span>
        ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/50">
                <Lock size={9} /> Private
            </span>
        )}
        <div className="flex gap-2">
            <button
                onClick={onShare}
                title={outfit.isPublic ? 'Topluluktan kaldır' : 'Topluluğa paylaş'}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-md ${outfit.isPublic ? 'bg-black text-white' : 'bg-white/80 text-black'}`}
            >
                <Users size={13} />
            </button>
            <button
                onClick={onDelete}
                className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const LookbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useUIStore();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    useEffect(() => { fetchOutfits(); }, []);

    const fetchOutfits = async () => {
        setFetchError(false);
        try {
            const res = await api.get('/outfits');
            setOutfits(res.data);
        } catch (e) {
            console.error(e);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleShare = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/social/share/${id}`);
            setOutfits(prev => prev.map(o => o.id === id ? { ...o, isPublic: res.data.isPublic } : o));
            showToast(res.data.isPublic ? 'Topluluğa paylaşıldı!' : 'Topluluktan kaldırıldı');
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bu kombini silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/outfits/${id}`);
            setOutfits(prev => prev.filter(o => o.id !== id));
            showToast('Kombin silindi');
        } catch (e) { console.error(e); }
    };

    const publicCount  = outfits.filter(o => o.isPublic).length;
    const privateCount = outfits.length - publicCount;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-20 pb-48 px-6 lg:px-16 relative overflow-x-hidden">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-amber-50/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-[1500px] mx-auto relative z-10">

                {/* ── Header ──────────────────────────────────────────────── */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
                    <div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-6">
                            <span className="w-10 h-[1px] bg-black opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Personal Archive</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                            className="text-7xl lg:text-8xl font-serif font-light leading-none tracking-tightest text-gray-900">
                            The <br /><span className="italic font-normal text-gray-400">Lookbook.</span>
                        </motion.h1>
                    </div>

                    <div className="flex flex-col items-end gap-8">
                        {/* Stats */}
                        <div className="flex items-center gap-6 text-right">
                            <div>
                                <p className="text-3xl font-serif">{outfits.length}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Total</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div>
                                <p className="text-3xl font-serif text-emerald-500">{publicCount}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Public</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div>
                                <p className="text-3xl font-serif text-gray-400">{privateCount}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Private</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsDesignerOpen(true)}
                            className="px-10 h-14 bg-black text-white rounded-[2rem] flex items-center gap-3 shadow-2xl hover:bg-gray-800 transition-all font-serif italic text-lg hover:scale-105 active:scale-95"
                        >
                            <Plus size={18} />
                            Create Look
                        </button>
                    </div>
                </header>

                {/* ── Loading ──────────────────────────────────────────────── */}
                {loading ? (
                    <div className="flex flex-col items-center py-48">
                        <div className="w-14 h-14 border-2 border-black/5 border-t-black rounded-full animate-spin" />
                        <p className="mt-8 font-serif italic text-gray-300">Curating your archive...</p>
                    </div>

                /* ── Error ─────────────────────────────────────────────────── */
                ) : fetchError ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-48 gap-6">
                        <p className="font-serif italic text-gray-400 text-xl">Kombinler yüklenemedi.</p>
                        <button onClick={fetchOutfits}
                            className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                            Tekrar Dene
                        </button>
                    </motion.div>

                /* ── Empty ─────────────────────────────────────────────────── */
                ) : outfits.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/50 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-28 text-center max-w-3xl mx-auto shadow-[0_10px_60px_rgba(0,0,0,0.03)]">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm border border-gray-50">
                            <Sparkles className="text-amber-200" size={28} />
                        </div>
                        <h3 className="text-5xl font-serif text-gray-900 mb-5 leading-tight">Mirasınız <br /><span className="italic text-gray-300">boş duruyor.</span></h3>
                        <p className="text-lg text-gray-400 mb-10 font-serif italic">Studio'da ilk kombinini oluştur.</p>
                        <button onClick={() => navigate('/studio')}
                            className="bg-black text-white px-10 py-5 rounded-[2rem] text-[10px] font-black tracking-widest uppercase hover:scale-105 transition-all shadow-xl">
                            Stüdyoyu Aç
                        </button>
                    </motion.div>

                /* ── Outfits ───────────────────────────────────────────────── */
                ) : (
                    <div className="space-y-6">

                        {/* Hero — first outfit */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
                            className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group"
                            style={{ aspectRatio: '16/7' }}>

                            {outfits[0].coverUrl ? (
                                <img src={getImageUrl(outfits[0].coverUrl)} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[3s] ease-out" />
                            ) : (
                                <ItemCollage items={outfits[0].items} />
                            )}

                            <CardOverlay outfit={outfits[0]} />
                            <CardActions
                                outfit={outfits[0]}
                                onShare={(e) => handleToggleShare(outfits[0].id, e)}
                                onDelete={(e) => handleDelete(outfits[0].id, e)}
                            />

                            {/* Featured label */}
                            <div className="absolute bottom-7 right-7">
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30">Featured Look</span>
                            </div>
                        </motion.div>

                        {/* Grid — rest of outfits + add card */}
                        {outfits.length > 1 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                {outfits.slice(1).map((outfit, index) => (
                                    <motion.div
                                        key={outfit.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.07, duration: 0.7 }}
                                        className="relative rounded-[2rem] overflow-hidden cursor-pointer group hover:-translate-y-2 transition-transform duration-500"
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        {outfit.coverUrl ? (
                                            <img src={getImageUrl(outfit.coverUrl)} alt="" className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[2.5s] ease-out" />
                                        ) : (
                                            <ItemCollage items={outfit.items} />
                                        )}

                                        <CardOverlay outfit={outfit} />
                                        <CardActions
                                            outfit={outfit}
                                            onShare={(e) => handleToggleShare(outfit.id, e)}
                                            onDelete={(e) => handleDelete(outfit.id, e)}
                                        />
                                    </motion.div>
                                ))}

                                {/* Add card */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setIsDesignerOpen(true)}
                                    className="rounded-[2rem] border-2 border-dashed border-gray-150 flex flex-col items-center justify-center cursor-pointer group hover:bg-white hover:border-black/10 hover:shadow-lg transition-all duration-500"
                                    style={{ aspectRatio: '3/4' }}
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm mb-4">
                                        <Plus size={28} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 group-hover:text-black transition-colors">New Look</span>
                                </motion.div>
                            </div>
                        )}

                        {/* If only 1 outfit, show add card inline */}
                        {outfits.length === 1 && (
                            <div className="flex justify-start">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, transition: { delay: 0.3 } }}
                                    onClick={() => setIsDesignerOpen(true)}
                                    className="rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:bg-white hover:border-black/10 hover:shadow-md transition-all duration-500 w-56"
                                    style={{ aspectRatio: '3/4' }}
                                >
                                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 mb-4 shadow-sm">
                                        <Plus size={26} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 group-hover:text-black transition-colors">New Look</span>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <OutfitDesigner
                isOpen={isDesignerOpen}
                onClose={() => setIsDesignerOpen(false)}
                onSuccess={fetchOutfits}
            />

            <style>{`
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default LookbookPage;
