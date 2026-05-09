import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Users, Plus, Sparkles, Globe, Lock, Link2, X, ExternalLink, Download, Cpu, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../config';
import { api } from '../lib/api';
import { OutfitDesigner } from '../components/wardrobe/OutfitDesigner';
import { useUIStore } from '../store/uiStore';

interface OutfitItem {
    id: string;
    garmentItem: { category: string; brand: string | null; photos: { url: string }[] };
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
    isTryOn?: boolean;
    items: OutfitItem[];
    productLinks?: ProductLink[] | null;
}

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

// ─── Item Collage ─────────────────────────────────────────────────────────────
const ItemCollage: React.FC<{ items: OutfitItem[] }> = ({ items }) => {
    const photos = items.map(i => i.garmentItem.photos?.[0]?.url).filter(Boolean).slice(0, 4) as string[];
    if (photos.length === 0)
        return <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><span className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-200">Görsel Yok</span></div>;
    if (photos.length === 1)
        return <img src={getImageUrl(photos[0])} className="w-full h-full object-cover" alt="" />;
    if (photos.length === 2)
        return <div className="w-full h-full grid grid-cols-2 gap-px bg-gray-100">{photos.map((p, i) => <img key={i} src={getImageUrl(p)} className="w-full h-full object-cover" alt="" />)}</div>;
    return (
        <div className="w-full h-full flex flex-col gap-px bg-gray-100">
            <img src={getImageUrl(photos[0])} className="w-full object-cover" style={{ flex: 2 }} alt="" />
            <div className="flex gap-px" style={{ flex: 1 }}>
                {photos.slice(1).map((p, i) => <img key={i} src={getImageUrl(p)} className="flex-1 object-cover" alt="" />)}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

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
        if (!outfit.isPublic) { setSelectedOccasion(''); setOccasionPickerOutfitId(id); return; }
        try {
            const res = await api.post(`/social/share/${id}`, {});
            setOutfits(prev => prev.map(o => o.id === id ? { ...o, isPublic: res.data.isPublic } : o));
            showToast('Topluluktan kaldırıldı');
        } catch (e) { console.error(e); showToast('Bir hata oluştu.', 'error'); }
    };

    const confirmShare = async (occasion?: string) => {
        if (!occasionPickerOutfitId) return;
        setOccasionPickerOutfitId(null);
        try {
            const res = await api.post(`/social/share/${occasionPickerOutfitId}`, { occasion });
            setOutfits(prev => prev.map(o => o.id === occasionPickerOutfitId ? { ...o, isPublic: res.data.isPublic } : o));
            showToast('Topluluğa paylaşıldı!');
        } catch (e) { console.error(e); showToast('Paylaşım başarısız.', 'error'); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bu görüntüyü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/outfits/${id}`);
            setOutfits(prev => prev.filter(o => o.id !== id));
            showToast('Silindi');
        } catch (e) { console.error(e); showToast('Silme başarısız.', 'error'); }
    };

    const openLinks = (outfit: Outfit, e: React.MouseEvent) => {
        e.stopPropagation();
        setLinksOutfit(outfit);
        setDraftLinks(outfit.productLinks?.length ? [...outfit.productLinks] : [{ label: '', brand: '', url: '' }]);
    };

    const addLinkRow = () => setDraftLinks(prev => [...prev, { label: '', brand: '', url: '' }]);
    const updateLinkRow = (i: number, field: keyof ProductLink, value: string) =>
        setDraftLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    const removeLinkRow = (i: number) => setDraftLinks(prev => prev.filter((_, idx) => idx !== i));

    const saveLinks = async () => {
        if (!linksOutfit) return;
        setSavingLinks(true);
        const normalizeUrl = (u: string) => u && !/^https?:\/\//i.test(u) ? `https://${u}` : u;
        const validLinks = draftLinks.filter(l => l.brand.trim() || l.label.trim())
            .map(l => ({ ...l, url: normalizeUrl(l.url), imageUrl: l.imageUrl ? normalizeUrl(l.imageUrl) : '' }));
        try {
            await api.patch(`/outfits/${linksOutfit.id}/links`, { links: validLinks });
            setOutfits(prev => prev.map(o => o.id === linksOutfit.id ? { ...o, productLinks: validLinks } : o));
            showToast('Ürün linkleri kaydedildi');
            setLinksOutfit(null);
        } catch { showToast('Kaydedilemedi'); } finally { setSavingLinks(false); }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

    const tryOnLooks    = outfits.filter(o => o.isTryOn);
    const regularOutfits = outfits.filter(o => !o.isTryOn);

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-48 relative overflow-x-hidden">

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-indigo-50/15 rounded-full blur-[180px]" />
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-amber-50/10 rounded-full blur-[140px]" />
            </div>

            <div className="max-w-[1560px] mx-auto px-6 lg:px-16 relative z-10">

                {/* ══════════════════════════════════════════════════════════
                    EDITORIAL HEADER
                ══════════════════════════════════════════════════════════ */}
                <header className="mb-24">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-8">
                        <span className="w-12 h-[1px] bg-black/20" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.45em] text-gray-400">Personal Archive</span>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        <motion.h1
                            initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                            transition={{ duration: 0.9 }}
                            className="text-[72px] lg:text-[108px] xl:text-[132px] font-serif font-light leading-none tracking-[-0.04em] text-gray-900"
                        >
                            The<br /><span className="italic font-normal text-gray-300">Lookbook.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.7 }}
                            className="mt-6 text-gray-400 font-serif italic text-lg max-w-[300px] leading-relaxed"
                        >
                            Kişisel stil arşivin. Her kombin, bir anın hikayesi.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className="flex flex-col items-start lg:items-end gap-6"
                        >
                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-4xl font-serif font-light">{regularOutfits.length}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 mt-1">Koleksiyon</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-4xl font-serif font-light text-emerald-500">{tryOnLooks.length}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 mt-1">AI Try-On</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-4xl font-serif font-light text-amber-500">{regularOutfits.filter(o => o.isPublic).length}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 mt-1">Public</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDesignerOpen(true)}
                                className="h-14 px-10 bg-[#1a1a1a] text-white rounded-full flex items-center gap-3 text-sm font-serif italic text-lg hover:bg-black hover:scale-[1.02] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                            >
                                <Plus size={18} strokeWidth={1.5} /> Create Look
                            </button>
                        </motion.div>
                    </div>
                </header>

                {/* ══════════════════════════════════════════════════════════
                    AI TRY-ON STUDIO SECTION
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.9 }}
                    className="mb-28"
                >
                    <div className="bg-[#060606] rounded-[3rem] overflow-hidden relative">

                        {/* Section ambient */}
                        <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 8, repeat: Infinity }}
                                className="absolute -top-1/4 -left-1/4 w-[700px] h-[700px] bg-emerald-900/20 rounded-full blur-[200px]"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
                                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                                className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[180px]"
                            />
                            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
                        </div>

                        <div className="relative z-10 p-10 lg:p-16">
                            {/* Section Header */}
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
                                <div>
                                    <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25 mb-4 flex items-center gap-3">
                                        <span className="w-8 h-[0.5px] bg-white/20 inline-block" />
                                        AI · Virtual Try-On Studio
                                    </p>
                                    <h2 className="text-5xl lg:text-7xl font-serif font-light text-white leading-none tracking-tight">
                                        Try-On<span className="italic text-white/20">.</span>
                                    </h2>
                                    <p className="text-white/30 font-serif italic mt-3 text-base max-w-sm leading-relaxed">
                                        Yapay zeka ile oluşturulan kıyafet denemelerin burada arşivleniyor.
                                    </p>
                                </div>
                                {tryOnLooks.length > 0 && (
                                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full self-start lg:self-auto">
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                        />
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">{tryOnLooks.length} görsel</span>
                                    </div>
                                )}
                            </div>

                            {/* Loading */}
                            {loading ? (
                                <div className="flex justify-center py-24">
                                    <div className="w-10 h-10 border border-white/10 border-t-white/50 rounded-full animate-spin" />
                                </div>

                            /* Empty */
                            ) : tryOnLooks.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 text-center">
                                    <div className="w-24 h-24 border border-white/8 rounded-full flex items-center justify-center mb-8 relative">
                                        <Cpu size={32} className="text-white/15" />
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border border-transparent border-t-white/10" />
                                    </div>
                                    <h3 className="text-2xl font-serif text-white/30 mb-3">Henüz AI görseliniz yok</h3>
                                    <p className="text-white/20 font-serif italic mb-10 text-sm leading-relaxed max-w-xs">
                                        Gardırop sayfasında kıyafet deneyin ve sonucu Lookbook'a kaydedin.
                                    </p>
                                    <button
                                        onClick={() => navigate('/wardrobe')}
                                        className="flex items-center gap-3 px-8 py-3.5 bg-white/8 border border-white/15 text-white/60 rounded-full text-[11px] font-mono uppercase tracking-widest hover:bg-white/12 hover:text-white transition-all"
                                    >
                                        Gardıroba Git
                                    </button>
                                </motion.div>

                            /* Grid */
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
                                    <AnimatePresence>
                                        {tryOnLooks.map((look, i) => (
                                            <motion.div
                                                key={look.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.06, duration: 0.6 }}
                                                className="group relative rounded-[1.75rem] overflow-hidden cursor-pointer"
                                                style={{ aspectRatio: '3/4' }}
                                            >
                                                {/* Image */}
                                                {look.coverUrl ? (
                                                    <img
                                                        src={look.coverUrl}
                                                        alt={look.name || 'AI Try-On'}
                                                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[2s] ease-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#111] flex items-center justify-center">
                                                        <Cpu size={28} className="text-white/10" />
                                                    </div>
                                                )}

                                                {/* Gradient overlays */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                                {/* AI badge — top left */}
                                                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full shadow-lg">
                                                    <Sparkles size={8} className="text-white" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">AI</span>
                                                </div>

                                                {/* Delete — top right (hover) */}
                                                <button
                                                    onClick={(e) => handleDelete(look.id, e)}
                                                    className="absolute top-3.5 right-3.5 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 opacity-0 group-hover:opacity-100 hover:bg-red-500/90 hover:text-white transition-all duration-300 shadow-lg"
                                                >
                                                    <Trash2 size={13} />
                                                </button>

                                                {/* Bottom info */}
                                                <div className="absolute bottom-0 inset-x-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                                                    <h4 className="text-white font-serif text-[15px] leading-snug tracking-tight">
                                                        {look.name?.replace('AI Try-On · ', '') || 'Try-On'}
                                                    </h4>
                                                    <p className="text-white/35 text-[9px] font-mono uppercase tracking-[0.25em] mt-1">
                                                        {formatDate(look.createdAt)}
                                                    </p>
                                                </div>

                                                {/* Download — bottom right (hover) */}
                                                <a
                                                    href={look.coverUrl || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="absolute bottom-3.5 right-3.5 w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all duration-300 shadow-lg"
                                                >
                                                    <Download size={13} />
                                                </a>

                                                {/* Subtle border */}
                                                <div className="absolute inset-0 rounded-[1.75rem] border border-white/[0.06] pointer-events-none" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════════════════════
                    DIVIDER
                ══════════════════════════════════════════════════════════ */}
                <div className="flex items-center gap-6 mb-0">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-100" />
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full shadow-sm">
                        <Wand2 size={12} className="text-gray-400" />
                        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-400">Koleksiyon Arşivi</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-100" />
                </div>

                {/* ══════════════════════════════════════════════════════════
                    EDITORIAL MARQUEE STRIP
                ══════════════════════════════════════════════════════════ */}
                <div className="mb-20 overflow-hidden border-y border-gray-100/80 py-4">
                    <div className="marquee-inner flex whitespace-nowrap">
                        {Array(6).fill(0).map((_, i) => (
                            <span key={i} className="inline-flex items-center gap-10 px-10 text-[9px] font-mono uppercase tracking-[0.35em] text-gray-300 select-none">
                                <span>Personal Archive</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200 inline-block shrink-0" />
                                <span>Curated Collection</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200 inline-block shrink-0" />
                                <span>Your Style Story</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200 inline-block shrink-0" />
                                <span>Stil Arşivi</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200 inline-block shrink-0" />
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    REGULAR OUTFITS SECTION
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Section Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-gray-400 mb-3 flex items-center gap-3">
                                <span className="w-8 h-[0.5px] bg-gray-300 inline-block" />
                                Kombinler
                            </p>
                            <h2 className="text-5xl lg:text-7xl font-serif font-light text-gray-900 leading-none tracking-tight">
                                Arşiv<span className="italic text-gray-200">.</span>
                            </h2>
                            <p className="mt-4 text-gray-400 font-serif italic text-base max-w-xs leading-relaxed">
                                Kaydettiğin her kombin burada seni bekliyor.
                            </p>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-serif text-emerald-500">{regularOutfits.filter(o => o.isPublic).length}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-0.5">Public</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-2xl font-serif text-gray-400">{regularOutfits.filter(o => !o.isPublic).length}</p>
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-0.5">Private</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDesignerOpen(true)}
                                className="h-12 px-8 bg-white/70 backdrop-blur-xl border border-white/80 text-gray-700 rounded-full flex items-center gap-2 text-sm hover:bg-white hover:border-gray-200 hover:text-black hover:shadow-md transition-all"
                            >
                                <Plus size={16} strokeWidth={1.5} /> New Look
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="flex flex-col items-center py-36">
                            <div className="w-12 h-12 border border-black/5 border-t-black/30 rounded-full animate-spin" />
                            <p className="mt-8 font-serif italic text-gray-300">Arşiv yükleniyor...</p>
                        </div>

                    /* Error */
                    ) : fetchError ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-36 gap-6">
                            <p className="font-serif italic text-gray-400 text-xl">Kombinler yüklenemedi.</p>
                            <button onClick={fetchOutfits} className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                Tekrar Dene
                            </button>
                        </motion.div>

                    /* Empty */
                    ) : regularOutfits.length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-24 text-center max-w-2xl mx-auto shadow-[0_10px_60px_rgba(0,0,0,0.03)]">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm border border-gray-50">
                                <Sparkles className="text-amber-200" size={26} />
                            </div>
                            <h3 className="text-4xl font-serif text-gray-900 mb-4 leading-tight font-light">Arşiv boş duruyor.</h3>
                            <p className="text-lg text-gray-400 mb-10 font-serif italic leading-relaxed">Stüdyo'da ilk kombinini oluştur.</p>
                            <button onClick={() => setIsDesignerOpen(true)}
                                className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-black tracking-widest uppercase hover:scale-105 transition-all shadow-xl">
                                Stüdyoyu Aç
                            </button>
                        </motion.div>

                    /* Outfits */
                    ) : (
                        <div className="space-y-6">

                            {/* ── Hero cover ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.9 }}
                                className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-[0_4px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.14)] transition-shadow duration-700"
                                style={{ aspectRatio: '21/9' }}
                            >
                                {regularOutfits[0].coverUrl ? (
                                    <img src={getImageUrl(regularOutfits[0].coverUrl)} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[4s] ease-out" />
                                ) : (
                                    <ItemCollage items={regularOutfits[0].items} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent pointer-events-none" />

                                {/* Stamp */}
                                <div className="absolute top-7 left-7 flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                                    <span className="text-[9px] font-mono text-white/35 tracking-wider">01</span>
                                    <span className="w-px h-3 bg-white/20" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/70">Featured Look</span>
                                </div>

                                {/* Actions — hover only */}
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button onClick={e => openLinks(regularOutfits[0], e)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-md ${regularOutfits[0].productLinks?.length ? 'bg-amber-400 text-white' : 'bg-white/80 text-black'}`}><Link2 size={14} /></button>
                                    <button onClick={e => handleToggleShare(regularOutfits[0].id, e)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-md ${regularOutfits[0].isPublic ? 'bg-black text-white' : 'bg-white/80 text-black'}`}><Users size={14} /></button>
                                    <button onClick={e => handleDelete(regularOutfits[0].id, e)} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-lg"><Trash2 size={14} /></button>
                                </div>

                                {/* Bottom — two-column editorial */}
                                <div className="absolute bottom-0 inset-x-0 p-10 lg:p-14">
                                    <div className="flex items-end justify-between gap-6">
                                        <div>
                                            <div className="flex flex-wrap gap-1.5 mb-5">
                                                {regularOutfits[0].items?.slice(0, 3).map((item, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[8px] font-black text-white/80 uppercase tracking-widest">{item.garmentItem?.category || 'Piece'}</span>
                                                ))}
                                            </div>
                                            <h3 className="text-white font-serif text-4xl lg:text-5xl xl:text-6xl leading-none tracking-tight">{regularOutfits[0].name || 'Kombin'}</h3>
                                        </div>
                                        <div className="shrink-0 text-right hidden sm:block">
                                            <p className="text-white/40 text-[9px] font-mono uppercase tracking-[0.3em]">{regularOutfits[0].items.length} pieces</p>
                                            <p className="text-white/25 text-[9px] font-mono uppercase tracking-[0.2em] mt-1">{formatDate(regularOutfits[0].createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── Editorial grid (3 portrait + 1 landscape cycling) ── */}
                            {regularOutfits.length > 1 && (
                                <div className="grid grid-cols-12 gap-5 lg:gap-6">
                                    {regularOutfits.slice(1).map((outfit, index) => {
                                        const isLandscape = (index + 1) % 4 === 0;
                                        return (
                                            <motion.div
                                                key={outfit.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.7 }}
                                                className={`relative overflow-hidden cursor-pointer group transition-all duration-700 shadow-[0_2px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] ${
                                                    isLandscape
                                                        ? 'col-span-12 rounded-[2.5rem] hover:-translate-y-1'
                                                        : 'col-span-12 sm:col-span-6 lg:col-span-4 rounded-[2rem] hover:-translate-y-2'
                                                }`}
                                                style={{ aspectRatio: isLandscape ? '21/8' : '3/4' }}
                                            >
                                                {outfit.coverUrl ? (
                                                    <img src={getImageUrl(outfit.coverUrl)} alt="" className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[3s] ease-out" />
                                                ) : (
                                                    <ItemCollage items={outfit.items} />
                                                )}
                                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                                                {isLandscape && <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />}

                                                {/* Top actions */}
                                                <div className="absolute top-4 inset-x-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    {outfit.isPublic ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black uppercase tracking-widest text-white"><Globe size={9} /> Public</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/50"><Lock size={9} /> Private</span>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={e => openLinks(outfit, e)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-md ${outfit.productLinks?.length ? 'bg-amber-400 text-white' : 'bg-white/80 text-black'}`}><Link2 size={13} /></button>
                                                        <button onClick={e => handleToggleShare(outfit.id, e)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-md ${outfit.isPublic ? 'bg-black text-white' : 'bg-white/80 text-black'}`}><Users size={13} /></button>
                                                        <button onClick={e => handleDelete(outfit.id, e)} className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-lg"><Trash2 size={13} /></button>
                                                    </div>
                                                </div>

                                                {/* Bottom info */}
                                                <div className={`absolute bottom-0 inset-x-0 ${isLandscape ? 'p-8 lg:p-12' : 'p-5'} translate-y-1 group-hover:translate-y-0 transition-transform duration-500`}>
                                                    {isLandscape ? (
                                                        <div className="flex items-end justify-between gap-6">
                                                            <div>
                                                                <span className="block text-[9px] font-mono text-white/25 mb-3 tracking-wider">{String(index + 2).padStart(2, '0')}</span>
                                                                <h3 className="text-white font-serif text-3xl lg:text-4xl leading-none tracking-tight">{outfit.name || 'Kombin'}</h3>
                                                            </div>
                                                            <div className="shrink-0 text-right hidden sm:block">
                                                                <div className="flex flex-wrap gap-1.5 justify-end mb-2">
                                                                    {outfit.items?.slice(0, 3).map((item, i) => (
                                                                        <span key={i} className="px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[7px] font-black text-white/80 uppercase tracking-widest">{item.garmentItem?.category}</span>
                                                                    ))}
                                                                </div>
                                                                <p className="text-white/40 text-[8px] font-mono uppercase tracking-widest">{outfit.items.length} pieces · {formatDate(outfit.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="block text-[9px] font-mono text-white/25 mb-2 tracking-wider">{String(index + 2).padStart(2, '0')}</span>
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {outfit.items?.slice(0, 2).map((item, i) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[7px] font-black text-white/80 uppercase tracking-widest">{item.garmentItem?.category}</span>
                                                                ))}
                                                            </div>
                                                            <h3 className="text-white font-serif text-xl leading-snug">{outfit.name || 'Kombin'}</h3>
                                                            <p className="text-white/40 text-[8px] font-mono uppercase tracking-widest mt-1">{outfit.items.length} pieces · {formatDate(outfit.createdAt)}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Add card */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => setIsDesignerOpen(true)}
                                        className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer group hover:bg-white/80 hover:border-gray-300 hover:shadow-xl transition-all duration-500 bg-white/20 backdrop-blur-sm"
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:border-[#1a1a1a] group-hover:text-white transition-all duration-500 mb-5 text-gray-300">
                                            <Plus size={22} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-300 group-hover:text-black transition-colors">New Look</span>
                                    </motion.div>
                                </div>
                            )}

                            {/* Only 1 outfit */}
                            {regularOutfits.length === 1 && (
                                <div className="flex justify-start">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, transition: { delay: 0.3 } }}
                                        onClick={() => setIsDesignerOpen(true)}
                                        className="rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer group hover:bg-white/80 hover:border-gray-300 hover:shadow-lg transition-all duration-500 bg-white/20 w-56"
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:border-[#1a1a1a] group-hover:text-white transition-all duration-500 mb-4 text-gray-300">
                                            <Plus size={20} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-300 group-hover:text-black transition-colors">New Look</span>
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.section>

                {/* Footer signature */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    className="mt-32 pt-12 border-t border-gray-100 flex items-center justify-between"
                >
                    <h2 className="text-7xl lg:text-9xl font-serif font-light text-gray-100 leading-none select-none">
                        Lookbook<span className="italic text-[#1a1a1a]/20">.</span>
                    </h2>
                    <div className="text-right">
                        <p className="text-xs font-mono text-gray-300 uppercase tracking-[0.3em]">{outfits.length} total</p>
                        <p className="text-xs font-mono text-gray-200 uppercase tracking-[0.3em] mt-1">{tryOnLooks.length} AI · {regularOutfits.length} Collection</p>
                    </div>
                </motion.div>
            </div>

            {/* ═══ OutfitDesigner ═══ */}
            <OutfitDesigner isOpen={isDesignerOpen} onClose={() => setIsDesignerOpen(false)} onSuccess={fetchOutfits} />

            {/* ═══ Occasion Picker ═══ */}
            <AnimatePresence>
                {occasionPickerOutfitId && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOccasionPickerOutfitId(null)} />
                        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                            className="relative bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                                <h3 className="text-2xl font-serif">Kategori Seç</h3>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Bu kombin hangi tarza uyuyor?</p>
                            </div>
                            <div className="px-8 py-6 grid grid-cols-4 gap-3">
                                {OCCASIONS.map(occ => (
                                    <button key={occ.value} onClick={() => setSelectedOccasion(prev => prev === occ.value ? '' : occ.value)}
                                        className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 ${selectedOccasion === occ.value ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300'}`}>
                                        <span className="text-2xl leading-none">{occ.emoji}</span>
                                        <span className="text-[9px] font-black uppercase tracking-wide leading-none">{occ.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="px-8 pb-8 pt-2 flex gap-3">
                                <button onClick={() => confirmShare(undefined)} className="flex-1 py-3.5 border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-all">Atla</button>
                                <button onClick={() => confirmShare(selectedOccasion || undefined)} className="flex-[2] py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg">
                                    Paylaş {selectedOccasion && `· ${selectedOccasion}`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ Product Links Modal ═══ */}
            <AnimatePresence>
                {linksOutfit && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setLinksOutfit(null)} />
                        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                            className="relative bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-2xl font-serif">Ürün Linkleri</h3>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{linksOutfit.name || 'Kombin'}</p>
                                </div>
                                <button onClick={() => setLinksOutfit(null)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3">
                                {draftLinks.map((link, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-2">{i + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input placeholder="Marka" value={link.brand} onChange={e => updateLinkRow(i, 'brand', e.target.value)} className="col-span-1 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300" />
                                            <input placeholder="Ürün" value={link.label} onChange={e => updateLinkRow(i, 'label', e.target.value)} className="col-span-1 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300" />
                                            <input placeholder="Ürün linki (https://...)" value={link.url} onChange={e => updateLinkRow(i, 'url', e.target.value)} className="col-span-2 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300" />
                                            <input placeholder="Görsel URL" value={link.imageUrl || ''} onChange={e => updateLinkRow(i, 'imageUrl', e.target.value)} className="col-span-2 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300" />
                                        </div>
                                        <button onClick={() => removeLinkRow(i)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0 mt-2"><X size={13} /></button>
                                    </div>
                                ))}
                                <button onClick={addLinkRow} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-black hover:text-black transition-all">+ Ürün Ekle</button>
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
            </AnimatePresence>

            <style>{`
                .tracking-tightest { letter-spacing: -0.06em; }
                @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .marquee-inner { animation: marquee 35s linear infinite; display: inline-flex; }
                .marquee-inner:hover { animation-play-state: paused; }
            `}</style>
        </div>
    );
};

export default LookbookPage;
