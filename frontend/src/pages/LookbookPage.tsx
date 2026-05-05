import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Users, Plus, Sparkles, Globe, Lock, Link2, X, ExternalLink } from 'lucide-react';
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

interface ProductLink {
    label: string;
    brand: string;
    url: string;
    imageUrl?: string;
}

interface Outfit {
    id: string;
    name: string | null;
    description: string | null;
    coverUrl: string | null;
    createdAt: string;
    isPublic?: boolean;
    items: OutfitItem[];
    productLinks?: ProductLink[] | null;
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
    onLinks: (e: React.MouseEvent) => void;
}> = ({ outfit, onShare, onDelete, onLinks }) => (
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
                onClick={onLinks}
                title="Ürün linkleri ekle"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-md ${outfit.productLinks?.length ? 'bg-amber-400 text-white' : 'bg-white/80 text-black'}`}
            >
                <Link2 size={13} />
            </button>
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

const OCCASIONS = [
    { value: 'Kahve', label: 'Kahve', emoji: '☕' },
    { value: 'Ofis', label: 'Ofis', emoji: '💼' },
    { value: 'Date', label: 'Date', emoji: '🌙' },
    { value: 'Günlük', label: 'Günlük', emoji: '👟' },
    { value: 'Gece', label: 'Gece', emoji: '🎉' },
    { value: 'Spor', label: 'Spor', emoji: '🏃' },
    { value: 'Bahar', label: 'Bahar', emoji: '🌸' },
    { value: 'Kış', label: 'Kış', emoji: '❄️' },
];

const LookbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useUIStore();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [linksOutfit, setLinksOutfit] = useState<Outfit | null>(null);
    const [draftLinks, setDraftLinks] = useState<ProductLink[]>([]);
    const [savingLinks, setSavingLinks] = useState(false);
    const [occasionPickerOutfitId, setOccasionPickerOutfitId] = useState<string | null>(null);
    const [selectedOccasion, setSelectedOccasion] = useState('');

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
        const outfit = outfits.find(o => o.id === id);
        if (!outfit) return;
        if (!outfit.isPublic) {
            setSelectedOccasion('');
            setOccasionPickerOutfitId(id);
            return;
        }
        try {
            const res = await api.post(`/social/share/${id}`, {});
            setOutfits(prev => prev.map(o => o.id === id ? { ...o, isPublic: res.data.isPublic } : o));
            showToast('Topluluktan kaldırıldı');
        } catch (e) { console.error(e); }
    };

    const confirmShare = async (occasion?: string) => {
        if (!occasionPickerOutfitId) return;
        setOccasionPickerOutfitId(null);
        try {
            const res = await api.post(`/social/share/${occasionPickerOutfitId}`, { occasion });
            setOutfits(prev => prev.map(o => o.id === occasionPickerOutfitId ? { ...o, isPublic: res.data.isPublic } : o));
            showToast('Topluluğa paylaşıldı!');
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

    const openLinks = (outfit: Outfit, e: React.MouseEvent) => {
        e.stopPropagation();
        setLinksOutfit(outfit);
        setDraftLinks(outfit.productLinks?.length ? [...outfit.productLinks] : [{ label: '', brand: '', url: '' }]);
    };

    const addLinkRow = () => setDraftLinks(prev => [...prev, { label: '', brand: '', url: '' }]);

    const updateLinkRow = (i: number, field: keyof ProductLink, value: string) =>
        setDraftLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

    const removeLinkRow = (i: number) =>
        setDraftLinks(prev => prev.filter((_, idx) => idx !== i));

    const saveLinks = async () => {
        if (!linksOutfit) return;
        setSavingLinks(true);
        const normalizeUrl = (u: string) => u && !/^https?:\/\//i.test(u) ? `https://${u}` : u;
        const validLinks = draftLinks
            .filter(l => l.brand.trim() || l.label.trim())
            .map(l => ({
                ...l,
                url: normalizeUrl(l.url),
                imageUrl: l.imageUrl ? normalizeUrl(l.imageUrl) : '',
            }));
        try {
            await api.patch(`/outfits/${linksOutfit.id}/links`, { links: validLinks });
            setOutfits(prev => prev.map(o => o.id === linksOutfit.id ? { ...o, productLinks: validLinks } : o));
            showToast('Ürün linkleri kaydedildi');
            setLinksOutfit(null);
        } catch { showToast('Kaydedilemedi'); } finally { setSavingLinks(false); }
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
                                onLinks={(e) => openLinks(outfits[0], e)}
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
                                            onLinks={(e) => openLinks(outfit, e)}
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

            {/* Occasion Picker Modal */}
            {occasionPickerOutfitId && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOccasionPickerOutfitId(null)} />
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                            <h3 className="text-2xl font-serif">Kategori Seç</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Bu kombin hangi tarza uyuyor?</p>
                        </div>
                        <div className="px-8 py-6 grid grid-cols-4 gap-3">
                            {OCCASIONS.map(occ => (
                                <button
                                    key={occ.value}
                                    onClick={() => setSelectedOccasion(prev => prev === occ.value ? '' : occ.value)}
                                    className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 ${
                                        selectedOccasion === occ.value
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl leading-none">{occ.emoji}</span>
                                    <span className="text-[9px] font-black uppercase tracking-wide leading-none">{occ.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="px-8 pb-8 pt-2 flex gap-3">
                            <button
                                onClick={() => confirmShare(undefined)}
                                className="flex-1 py-3.5 border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-all"
                            >
                                Atla
                            </button>
                            <button
                                onClick={() => confirmShare(selectedOccasion || undefined)}
                                className="flex-[2] py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                            >
                                Paylaş {selectedOccasion && `· ${selectedOccasion}`}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Product Links Modal */}
            {linksOutfit && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setLinksOutfit(null)} />
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="relative bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-2xl font-serif">Ürün Linkleri</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                                    {linksOutfit.name || 'Editorial Look'}
                                </p>
                            </div>
                            <button onClick={() => setLinksOutfit(null)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3">
                            {draftLinks.map((link, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-2">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input
                                            placeholder="Marka (DeFacto)"
                                            value={link.brand}
                                            onChange={e => updateLinkRow(i, 'brand', e.target.value)}
                                            className="col-span-1 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                        />
                                        <input
                                            placeholder="Ürün (Pantolon)"
                                            value={link.label}
                                            onChange={e => updateLinkRow(i, 'label', e.target.value)}
                                            className="col-span-1 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                        />
                                        <input
                                            placeholder="Ürün linki (https://...)"
                                            value={link.url}
                                            onChange={e => updateLinkRow(i, 'url', e.target.value)}
                                            className="col-span-2 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                        />
                                        <input
                                            placeholder="Ürün görseli (https://...)"
                                            value={link.imageUrl || ''}
                                            onChange={e => updateLinkRow(i, 'imageUrl', e.target.value)}
                                            className="col-span-2 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                        />
                                    </div>
                                    <button onClick={() => removeLinkRow(i)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0 mt-2">
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addLinkRow}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-black hover:text-black transition-all">
                                + Ürün Ekle
                            </button>
                        </div>

                        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
                            <button onClick={saveLinks} disabled={savingLinks}
                                className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingLinks ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ExternalLink size={13} />}
                                Kaydet
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <style>{`
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default LookbookPage;
