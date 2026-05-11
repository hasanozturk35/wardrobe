import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Heart, Bookmark, RefreshCw,
    Sparkles, Package, PlusCircle, User, X,
    Wand2, Flame, Zap, Shirt, Loader2, Edit2
} from 'lucide-react';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';
import { getImageUrl } from '../config';
import { api } from '../lib/api';
import { AddItemModal } from '../components/wardrobe/AddItemModal';

const CATEGORIES = ['Hepsi', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

const ALL_CITIES = [
    { city: 'İstanbul',   style: 'Modern Minimalizm',    color: 'from-amber-500/20 to-orange-900/40',   accent: 'text-amber-200',   emoji: '🏙️' },
    { city: 'Ankara',     style: 'Kentsel Şıklık',       color: 'from-purple-500/20 to-indigo-900/40',  accent: 'text-purple-200',  emoji: '🏛️' },
    { city: 'İzmir',      style: 'Akdeniz Şıklığı',      color: 'from-sky-500/20 to-blue-900/40',       accent: 'text-sky-200',     emoji: '🌊' },
    { city: 'Antalya',    style: 'Sahil Bohemi',         color: 'from-emerald-500/20 to-teal-900/40',   accent: 'text-emerald-200', emoji: '🌴' },
    { city: 'Bursa',      style: 'Klasik Sofistike',     color: 'from-stone-500/20 to-stone-900/40',    accent: 'text-stone-300',   emoji: '🏔️' },
    { city: 'Adana',      style: 'Güney Dinamizmi',      color: 'from-orange-500/20 to-red-900/40',     accent: 'text-orange-200',  emoji: '☀️' },
    { city: 'Trabzon',    style: 'Karadeniz Ruhu',       color: 'from-green-500/20 to-emerald-900/40',  accent: 'text-green-200',   emoji: '🌿' },
    { city: 'Samsun',     style: 'Sahil Dinamizmi',      color: 'from-teal-500/20 to-cyan-900/40',      accent: 'text-teal-200',    emoji: '🌊' },
    { city: 'Amasya',     style: 'Tarihi Zarafet',       color: 'from-lime-500/20 to-green-900/40',     accent: 'text-lime-200',    emoji: '🏰' },
    { city: 'Konya',      style: 'Anadolu Şıklığı',      color: 'from-yellow-500/20 to-amber-900/40',   accent: 'text-yellow-200',  emoji: '🌾' },
    { city: 'Gaziantep',  style: 'Kentsel Klasik',       color: 'from-red-500/20 to-rose-900/40',       accent: 'text-red-200',     emoji: '🎭' },
    { city: 'Eskişehir',  style: 'Genç Yaratıcı',        color: 'from-violet-500/20 to-purple-900/40',  accent: 'text-violet-200',  emoji: '🎨' },
    { city: 'Mersin',     style: 'Akdeniz Bohemi',       color: 'from-cyan-500/20 to-blue-900/40',      accent: 'text-cyan-200',    emoji: '⛵' },
    { city: 'Kayseri',    style: 'Orta Anadolu Stili',   color: 'from-rose-500/20 to-pink-900/40',      accent: 'text-rose-200',    emoji: '🏔️' },
    { city: 'Diyarbakır', style: 'Güneydoğu Klasiği',   color: 'from-amber-600/20 to-yellow-900/40',   accent: 'text-amber-300',   emoji: '🏯' },
    { city: 'Erzurum',    style: 'Doğu Minimalizmi',     color: 'from-blue-500/20 to-indigo-900/40',    accent: 'text-blue-200',    emoji: '❄️' },
    { city: 'Bodrum',     style: 'Yaz Lüksü',            color: 'from-indigo-400/20 to-blue-800/40',    accent: 'text-indigo-200',  emoji: '⛵' },
    { city: 'Çanakkale',  style: 'Tarihi Casual',        color: 'from-stone-400/20 to-slate-800/40',    accent: 'text-stone-200',   emoji: '🏛️' },
    { city: 'Muğla',      style: 'Mavi Yolculuk',        color: 'from-sky-400/20 to-teal-800/40',       accent: 'text-sky-300',     emoji: '🌅' },
    { city: 'Edirne',     style: 'Osmanlı Zarafeti',     color: 'from-fuchsia-500/20 to-purple-800/40', accent: 'text-fuchsia-200', emoji: '🕌' },
];


const WardrobePage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchItems, deleteItem, items } = useWardrobeStore();
    const { showToast } = useUIStore();

    // ── State ──────────────────────────────────────────────────────────────
    const [searchTerm,         setSearchTerm]         = useState('');
    const [activeCategory,     setActiveCategory]     = useState('Hepsi');
    const [selectedItem,       setSelectedItem]       = useState<any>(null);
    const [isAddModalOpen,     setIsAddModalOpen]     = useState(false);
    const [editingItem,        setEditingItem]        = useState<any>(null);
    const [userGender, setUserGender] = useState<'Erkek' | 'Kadın'>(() => (localStorage.getItem('userGender') as 'Erkek' | 'Kadın') || 'Erkek');
    const [favorites,          setFavorites]          = useState<Set<string>>(new Set());
    const [outfitItems,        setOutfitItems]        = useState<any[]>([]);
    const [isOutfitBuilderOpen,setIsOutfitBuilderOpen]= useState(false);
    const [isAIFullscreen,     setIsAIFullscreen]     = useState(false);
    const [cityIdx,            setCityIdx]            = useState(0);
    const [isCityPickerOpen,   setIsCityPickerOpen]   = useState(false);
    const [mousePos,           setMousePos]           = useState({ x: 0, y: 0 });

    // Category map & real weather from AI response
    const [categoryMap,  setCategoryMap]  = useState<Record<string,string>>({});
    const [weatherInfo,  setWeatherInfo]  = useState<{ temp: number; feelsLike: number; description: string; isRainy: boolean } | null>(null);
    const [wearOuterwear, setWearOuterwear] = useState(false);

    // Virtual Try-On — declared before handleDelete to avoid TDZ
    const [tryOnLoading,       setTryOnLoading]       = useState(false);
    const [tryOnResult,        setTryOnResult]        = useState<{ imageUrl: string | null; error?: string; mock?: boolean; model?: string } | null>(null);
    const [selfieDataUrl,      setSelfieDataUrl]      = useState<string | null>(null);
    const [originalSelfie,     setOriginalSelfie]     = useState<string | null>(null);
    const [layerCount,         setLayerCount]         = useState(0);
    const [tryOnFullscreen,    setTryOnFullscreen]    = useState(false);
    const [tryOnStep,          setTryOnStep]          = useState(0);
    const [savingToLookbook,   setSavingToLookbook]   = useState(false);
    const [savingAiOutfit,     setSavingAiOutfit]     = useState(false);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    // AI Outfit
    const [aiOutfitCards,  setAiOutfitCards]  = useState<any[]>([]);
    const [aiExplanation,  setAiExplanation]  = useState('');
    const hasGeneratedRef = useRef(false);

    // ── Effects ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchItems();
        const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', onMove);
        const interval = setInterval(() => setCityIdx(p => (p + 1) % ALL_CITIES.length), 6000);
        return () => { window.removeEventListener('mousemove', onMove); clearInterval(interval); };
    }, []);

    // Generate outfit only once when items first load — fixes infinite API call loop
    useEffect(() => {
        if (items.length > 0 && !hasGeneratedRef.current) {
            hasGeneratedRef.current = true;
            generateOutfit();
        }
    }, [items.length]);

    // ── Computed ───────────────────────────────────────────────────────────
    const activeCity = ALL_CITIES[cityIdx];

    const stats = useMemo(() => {
        const total = items.length;
        if (total === 0) return { total: 0, label: 'Boş Arşiv' };
        return { total, label: total > 15 ? 'Avant-Garde' : total > 5 ? 'Capsule' : 'Minimalist' };
    }, [items]);

    const analytics = useMemo(() => {
        const categories: Record<string, number> = {};
        const colors: Record<string, number> = {};
        const seasons: Record<string, number> = {};
        items.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + 1;
            item.colors?.forEach((c: string) => { colors[c] = (colors[c] || 0) + 1; });
            item.seasons?.forEach((s: string) => { seasons[s] = (seasons[s] || 0) + 1; });
        });
        const topColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const topSeasons = Object.entries(seasons).sort((a, b) => b[1] - a[1]);
        const dominantCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
        const missingCats = CATEGORIES.filter(c => c !== 'Hepsi' && !categories[c]);
        return { categories, topColors, topSeasons, dominantCat, missingCats };
    }, [items]);

    const dominantStyle    = items.length > 5 ? 'Minimalist' : 'Casual';
    const stylePercentage  = items.length > 5 ? 88 : 60;
    const styleScore       = Math.min(100, 40 + items.length * 5);

    const categoryCount = (cat: string) =>
        cat === 'Hepsi' ? items.length : items.filter(i => i.category === cat).length;

    const filteredItems = items.filter(item => {
        const q = searchTerm.toLowerCase();
        const matchSearch = !q || item.brand?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
        const matchCat = activeCategory === 'Hepsi' || item.category === activeCategory;
        return matchSearch && matchCat;
    });

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleAdd = () => setIsAddModalOpen(true);

    const handleDelete = async (id: string) => {
        await deleteItem(id);
        setSelectedItem(null);
        setTryOnResult(null);
        showToast('Parça arşivden çıkarıldı.');
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const s = new Set(favorites);
        s.has(id) ? s.delete(id) : s.add(id);
        setFavorites(s);
    };

    const addToOutfit = (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        if (!outfitItems.find(i => i.id === item.id)) {
            setOutfitItems(p => [...p, item]);
            setIsOutfitBuilderOpen(true);
            showToast('Kombine eklendi!');
        }
    };

    const removeFromOutfit = (id: string) => {
        setOutfitItems(p => { const n = p.filter(i => i.id !== id); if (!n.length) setIsOutfitBuilderOpen(false); return n; });
    };

    const saveOutfit = async () => {
        if (!outfitItems.length) return;
        try {
            await api.post('/outfits', { name: `Kombin ${new Date().toLocaleDateString('tr')}`, items: outfitItems.map(i => ({ garmentItemId: i.id })) });
            showToast('Kombin kaydedildi! 🎉');
            setIsOutfitBuilderOpen(false);
            setOutfitItems([]);
        } catch { showToast('Kaydetme başarısız.'); }
    };

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const url = ev.target?.result as string;
            setSelfieDataUrl(url);
            setOriginalSelfie(url);
            setLayerCount(0);
            setTryOnResult(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAddLayer = (resultUrl: string) => {
        setSelfieDataUrl(resultUrl);
        setLayerCount(prev => prev + 1);
        setTryOnResult(null);
        setTryOnFullscreen(false);
        setSelectedItem(null);
        showToast('Katman eklendi! Şimdi başka bir parça seç.');
    };

    const handleResetSelfie = () => {
        if (!originalSelfie) return;
        setSelfieDataUrl(originalSelfie);
        setLayerCount(0);
        setTryOnResult(null);
        setTryOnFullscreen(false);
        showToast('Orijinal fotoğrafa döndü.');
    };

    const saveAiOutfit = async () => {
        if (!aiOutfitCards.length) return;
        setSavingAiOutfit(true);
        try {
            await api.post('/outfits', {
                name: `Kombin ${new Date().toLocaleDateString('tr')}`,
                items: aiOutfitCards.map(i => ({ garmentItemId: i.id })),
            });
            showToast('Kombin Lookbook\'a kaydedildi! 🎉');
            navigate('/lookbook#kombinler');
        } catch {
            showToast('Kaydetme başarısız.', 'error');
        } finally {
            setSavingAiOutfit(false);
        }
    };

    const saveTryOnToLookbook = async (itemName?: string) => {
        if (!tryOnResult?.imageUrl) return;
        setSavingToLookbook(true);
        try {
            await api.post('/outfits', {
                name: `AI Try-On · ${itemName || 'Parça'}`,
                coverUrl: tryOnResult.imageUrl,
                isTryOn: true,
                items: [],
            });
            showToast('Lookbook\'a kaydedildi ✓');
        } catch { showToast('Kaydedilemedi.'); }
        finally { setSavingToLookbook(false); }
    };

    const handleTryOn = async (item: any) => {
        if (!selfieDataUrl) { showToast('Önce bir fotoğraf seç!'); return; }
        const garmentImageUrl = item.photos?.[0]?.url ? getImageUrl(item.photos[0].url, item.category) : null;
        if (!garmentImageUrl) { showToast('Bu kıyafetin fotoğrafı bulunamadı.'); return; }
        setTryOnLoading(true);
        setTryOnResult(null);
        setTryOnStep(0);
        const stepInterval = setInterval(() => setTryOnStep(s => s < 3 ? s + 1 : s), 8000);
        try {
            const { data } = await api.post('/ai/try-on', { personImageUrl: selfieDataUrl, garmentImageUrl, category: item.category, brand: item.brand || undefined });
            setTryOnResult(data);
            if (data.imageUrl) setTryOnFullscreen(true);
        } catch { showToast('Try-On başarısız oldu.'); }
        finally { clearInterval(stepInterval); setTryOnLoading(false); }
    };

    const generateOutfit = (cityOverride?: string, styleOverride?: string) => {
        if (!items.length) return;
        setAiOutfitCards([]);
        setAiExplanation('AI Stilist dolabını analiz ediyor...');
        const city  = cityOverride  ?? activeCity.city;
        const style = styleOverride ?? activeCity.style;
        // Frontend'de de cinsiyet filtrele — sadece uyumlu parçaları gönder
        const genderItems = items.filter((i: any) =>
            !i.gender || i.gender === 'Unisex' || i.gender === userGender
        );
        const itemsToSend = genderItems.length >= 2 ? genderItems : items;
        api.post('/ai/generate-outfit-from-list', { items: itemsToSend, city, style, gender: userGender })
        .then(({ data }) => {
            if (data.outfitIds) {
                let cards: any[] = data.outfitIds.map((id: string) => items.find(i => i.id === id)).filter(Boolean);
                if (cards.length < 3) {
                    const usedIds = new Set(cards.map((c: any) => c.id));
                    const remaining = items.filter(i => !usedIds.has(i.id));
                    const usedCats = new Set(cards.map((c: any) => c.category));
                    const preferred = remaining.filter(i => !usedCats.has(i.category));
                    const filler = preferred.length > 0 ? preferred : remaining;
                    cards = [...cards, ...filler].slice(0, 3);
                }
                setAiOutfitCards(cards);
            }
            if (data.explanation) setAiExplanation(data.explanation);
            if (data.categoryMap)  setCategoryMap(data.categoryMap);
            if (data.weather)      setWeatherInfo(data.weather);
            if (typeof data.wearOuterwear === 'boolean') setWearOuterwear(data.wearOuterwear);
        })
        .catch(() => {
            const tops    = itemsToSend.filter((i: any) => i.category === 'Üst Giyim');
            const bottoms = itemsToSend.filter((i: any) => i.category === 'Alt Giyim');
            const extras  = itemsToSend.filter((i: any) => ['Ayakkabı','Dış Giyim','Aksesuar'].includes(i.category));
            const pool    = itemsToSend;
            const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
            const combo = [pick(tops.length ? tops : pool), pick(bottoms.length ? bottoms : pool), pick(extras.length ? extras : pool)].filter(Boolean);
            setAiOutfitCards(Array.from(new Map(combo.map((i: any) => [i.id, i])).values()).slice(0, 3));
            setAiExplanation(`Dolabını analiz ettim. Bu kombin ${activeCity.style} aurasıyla kusursuz uyum sağlıyor.`);
        });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pt-24 pb-32 px-4 lg:px-12 relative overflow-x-hidden bg-[#FDFBF7] text-gray-900 cursor-default">

            {/* Always-mounted selfie input — referenced by dashboard card & item detail */}
            <input ref={selfieInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieChange} />

            {/* Custom Cursor */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#1a1a1a]/40 pointer-events-none z-[9999] hidden lg:flex items-center justify-center"
                animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
                transition={{ type: 'spring', stiffness: 700, damping: 30, mass: 0.5 }}
            >
                <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full" />
            </motion.div>

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stone-400/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-stone-300/30 rounded-full blur-[160px]" />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
            </div>

            <div className="max-w-[1700px] mx-auto relative z-10">

                {/* ── Header ── */}
                <header className="mb-20">
                    {/* Action bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-between mb-16 gap-4"
                    >
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/70 backdrop-blur-xl border border-white/80 rounded-[1.5rem] shadow-sm">
                            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 font-serif">Dijital Koleksiyon</span>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-4">
                            <div className="flex items-center bg-white/70 backdrop-blur-xl border border-white/80 rounded-[1.5rem] px-6 py-3 shadow-sm hover:shadow-md transition-all group">
                                <Search className="text-gray-400 group-focus-within:text-black transition-colors mr-3 shrink-0" size={14} />
                                <input
                                    type="text"
                                    placeholder="Koleksiyonda ara..."
                                    className="w-40 lg:w-56 bg-transparent text-sm outline-none font-serif italic placeholder:text-gray-300 text-gray-800"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const next = userGender === 'Erkek' ? 'Kadın' : 'Erkek';
                                    setUserGender(next);
                                    localStorage.setItem('userGender', next);
                                }}
                                className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/80 hover:border-black/20 text-gray-700 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-sm hover:shadow-md"
                                title="AI önerileri için cinsiyet"
                            >
                                {userGender === 'Erkek' ? '♂ Erkek' : '♀ Kadın'}
                            </button>
                            <button
                                onClick={() => setIsOutfitBuilderOpen(!isOutfitBuilderOpen)}
                                className="hidden lg:flex items-center gap-3 px-7 py-3 bg-black text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-lg hover:shadow-xl hover:scale-[1.03] group"
                            >
                                <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                                <span className="font-serif italic text-sm tracking-wide">Stüdyo</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Editorial title */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 1, delay: 0.1 }}
                    >
                        <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-gray-400 mb-6 flex items-center gap-4">
                            <span className="w-10 h-[0.5px] bg-gray-300 inline-block" />
                            İstanbul · İzmir · Ankara
                        </p>
                        <h1 className="text-[64px] lg:text-[100px] xl:text-[120px] font-serif font-light tracking-tight leading-[0.88] mb-6">
                            Gardırop<span className="italic text-gray-300">.</span>
                        </h1>
                        <p className="text-base lg:text-lg font-serif italic text-gray-400 max-w-lg leading-relaxed">
                            Kıyafet arşivinizi yapay zeka ile yönetin — kombin önerleri, sanal deneme ve daha fazlası.
                        </p>
                    </motion.div>
                </header>

                {/* ── Dashboard Cards ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-24">

                    {/* Stil Profili */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-4 bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-gray-400 mb-2">Koleksiyon</p>
                                    <h2 className="text-[22px] font-serif font-light tracking-tight">Stil Profili</h2>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                    <Flame size={12} /> {stats.label}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">Stil Skoru</span>
                                        <span className="text-3xl font-serif font-light text-gray-900">{styleScore}<span className="text-sm text-gray-300 ml-0.5">/100</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${styleScore}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-black rounded-full" />
                                    </div>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-serif italic text-gray-500">Baskın Aura</span>
                                        <span className="text-sm font-bold text-gray-900">{stylePercentage}% {dominantStyle}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 pt-2">
                                    <div>
                                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 mb-1">Toplam</p>
                                        <p className="text-5xl font-serif font-light leading-none">{stats.total} <span className="text-sm italic text-gray-400 font-serif">parça</span></p>
                                    </div>
                                    {analytics.dominantCat && (
                                        <div>
                                            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 mb-1">En Çok</p>
                                            <p className="text-base font-serif font-medium text-gray-800">{analytics.dominantCat}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Virtual Try-On Hero */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-8 bg-[#0c0c0c] text-white rounded-[2rem] p-8 lg:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col justify-between min-h-[380px] group"
                    >
                        {/* Ambient glows */}
                        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-tr from-violet-900/40 to-indigo-900/20 rounded-full blur-[120px] opacity-60 pointer-events-none" />
                        <motion.div animate={{ x: [0, -40, 0], y: [0, 60, 0] }} transition={{ duration: 16, repeat: Infinity, delay: 3 }} className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] bg-gradient-to-bl from-amber-900/30 to-rose-900/20 rounded-full blur-[140px] opacity-50 pointer-events-none" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.15] pointer-events-none mix-blend-overlay" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-8">
                                <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-mono uppercase tracking-[0.3em] border border-white/10 flex items-center gap-2">
                                    <Sparkles size={12} className="text-violet-300" /> Sanal Deneme
                                </span>
                                <span className="text-[11px] font-mono text-white/30 tracking-wider">AI · Powered</span>
                            </div>

                            <AnimatePresence mode="wait">
                                {selfieDataUrl ? (
                                    <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}
                                        className="flex items-center gap-8 flex-1 py-4">
                                        {/* Selfie preview */}
                                        <div className="relative shrink-0 group/selfie">
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
                                                <img src={selfieDataUrl} className="w-full h-full object-cover" alt="selfie" />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg group-hover/selfie:opacity-0 transition-opacity">
                                                <span className="text-white text-[10px] font-black">✓</span>
                                            </div>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelfieDataUrl(null); setOriginalSelfie(null); setLayerCount(0); setTryOnResult(null); }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/selfie:opacity-100 transition-opacity hover:bg-red-400"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                        {/* Step instruction */}
                                        <div className="flex-1">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-violet-400/70 mb-3">Adım 2 / 2</p>
                                            <h3 className="text-3xl lg:text-[40px] font-serif font-light leading-[1.1] text-white mb-4">
                                                Şimdi bir<br />
                                                <span className="italic text-white/40">kıyafete dokun.</span>
                                            </h3>
                                            <p className="text-sm text-white/40 font-serif italic leading-relaxed max-w-xs">
                                                Aşağıdaki gardıroptan herhangi bir parçaya tıkla, ardından "Üzerimde Nasıl Görünür?" de.
                                            </p>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelfieDataUrl(null); setOriginalSelfie(null); setLayerCount(0); setTryOnResult(null); }}
                                                className="mt-4 text-[9px] font-mono uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
                                            >
                                                × Fotoğrafı değiştir
                                            </button>
                                        </div>
                                        {/* Arrow hint */}
                                        <motion.div
                                            animate={{ y: [0, 8, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="hidden lg:flex flex-col items-center gap-2 text-white/20 shrink-0"
                                        >
                                            <span className="text-[9px] font-mono uppercase tracking-widest rotate-90">↓</span>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}
                                        className="flex-1 py-4">
                                        <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/30 mb-3">Adım 1 / 2</p>
                                        <h3 className="text-4xl lg:text-[52px] font-serif leading-[1.05] mb-5 tracking-tight text-white font-light">
                                            Giymeden<br />
                                            <span className="italic text-white/35">Dene.</span>
                                        </h3>
                                        <p className="text-sm text-white/45 font-serif italic max-w-md leading-relaxed">
                                            Önce kendi fotoğrafını yükle, sonra gardıroptan bir parça seç — AI üzerinde nasıl durduğunu gösterir.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between mt-8">
                                {!selfieDataUrl ? (
                                    <button
                                        onClick={e => { e.stopPropagation(); selfieInputRef.current?.click(); }}
                                        className="flex items-center gap-3 bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.03]"
                                    >
                                        <User size={16} /> Fotoğraf Yükle
                                    </button>
                                ) : (
                                    <div className="flex gap-2 flex-wrap">
                                        {filteredItems.slice(0, 4).map(it => (
                                            <button key={it.id} onClick={e => { e.stopPropagation(); setSelectedItem(it); }}
                                                className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 hover:border-violet-400/50 hover:scale-[1.08] transition-all shadow-sm shrink-0">
                                                <img src={getImageUrl(it.photos?.[0]?.url, it.category)} className="w-full h-full object-cover"
                                                    onError={e2 => { e2.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=200'; }} alt="" />
                                            </button>
                                        ))}
                                        {items.length > 4 && (
                                            <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="text-[9px] font-mono text-white/30">+{items.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">{stats.total} parça</span>
                                    {!selfieDataUrl && (
                                        <div className="flex gap-1.5">
                                            {['Üst','Alt','Dış','Ayakkabı'].map(l => (
                                                <span key={l} className="px-2.5 py-1 bg-white/[0.06] border border-white/[0.08] rounded-full text-[8px] font-mono text-white/25 uppercase tracking-wider">{l}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Category Filters ── */}
                <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar mb-12 pb-2">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-7 py-3 rounded-full text-[10px] font-mono uppercase tracking-[0.25em] whitespace-nowrap transition-all duration-300 ${activeCategory === cat ? 'bg-black text-white shadow-lg' : 'bg-white/70 backdrop-blur-sm border border-gray-200/80 text-gray-500 hover:border-gray-400 hover:text-black hover:bg-white'}`}>
                            {cat} <span className="ml-1.5 opacity-50">{categoryCount(cat)}</span>
                        </button>
                    ))}
                </div>

                {/* ── Grid ── */}
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center">
                        <div className="w-28 h-28 bg-white rounded-full shadow-sm flex items-center justify-center mb-10 border border-gray-100">
                            <Package size={36} className="text-gray-200" />
                        </div>
                        <h3 className="text-5xl font-serif text-gray-900 mb-5 font-light">Koleksiyon Boş</h3>
                        <p className="text-gray-400 font-serif italic text-lg mb-12 max-w-md leading-relaxed">İlk imza parçanı ekleyerek dijital gardırobunu oluşturmaya başla.</p>
                        <button onClick={handleAdd} className="px-10 py-4 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-xl flex items-center gap-3">
                            <Plus size={16} /> Parça Ekle
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-7">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, index) => (
                                <motion.div
                                    layoutId={`card-${item.id}`}
                                    key={item.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.5 }}
                                    className="group cursor-pointer col-span-1 relative"
                                    draggable
                                    onDragStart={(e: any) => { e.dataTransfer.setData('item', JSON.stringify(item)); setIsOutfitBuilderOpen(true); }}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {/* ── Photo Frame ── */}
                                    <div className="aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-[#F4F2EE] relative shadow-[0_1px_6px_rgba(0,0,0,0.06)] group-hover:shadow-[0_24px_56px_rgba(0,0,0,0.14)] transition-shadow duration-700 border border-black/[0.035]">

                                        {/* Index stamp */}
                                        <span className="absolute top-4 left-4 z-20 text-[8px] font-mono text-black/20 tracking-[0.25em] pointer-events-none select-none">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>

                                        {/* Product image */}
                                        <motion.img
                                            layoutId={`image-${item.id}`}
                                            src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }}
                                            className="w-full h-full object-contain transition-transform duration-[2200ms] ease-out group-hover:scale-[1.05]"
                                            style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }}
                                            alt={item.brand}
                                        />

                                        {/* Bottom fade overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                                        {/* Action buttons — top right */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-[-6px] group-hover:translate-y-0 transition-all duration-300 z-30">
                                            <button
                                                onClick={e => toggleFavorite(e, item.id)}
                                                className="w-9 h-9 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:scale-110 transition-transform"
                                            >
                                                <Heart size={14} className={favorites.has(item.id) ? 'fill-black text-black' : 'text-gray-500'} />
                                            </button>
                                            <button
                                                onClick={e => addToOutfit(e, item)}
                                                className="w-9 h-9 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:scale-110 transition-transform"
                                            >
                                                <PlusCircle size={14} className="text-gray-500" />
                                            </button>
                                        </div>

                                        {/* Bottom info on hover */}
                                        <div className="absolute inset-x-0 bottom-0 p-5 z-20 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                                            <p className="text-white/55 text-[8px] font-mono uppercase tracking-[0.4em] mb-1.5">{item.category}</p>
                                            <h3 className="text-white font-serif text-[18px] leading-tight">{item.brand || 'İmza Parça'}</h3>
                                        </div>
                                    </div>

                                    {/* ── Card Info ── */}
                                    <div className="mt-3.5 px-0.5 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-[13px] font-medium text-gray-900 leading-snug tracking-[-0.01em]">
                                                {item.brand || 'İsimsiz Parça'}
                                            </h3>
                                            <p className="text-[9px] text-gray-400 mt-1 font-mono uppercase tracking-[0.18em]">
                                                {item.category}
                                            </p>
                                        </div>
                                        {item.seasons?.length > 0 && (
                                            <span className="text-[8px] font-mono text-gray-300 uppercase tracking-wider mt-0.5 shrink-0 pt-[1px]">
                                                {item.seasons[0]}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    GÜNÜN KOMBİNİ — Editorial AI Outfit
                ═══════════════════════════════════════════════════════════ */}
                {items.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="mt-32 mb-10"
                    >
                        <div className="relative rounded-[3rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #F0EDE8 0%, #E8E2D8 100%)' }}>
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/25 rounded-full blur-[160px]" />
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stone-300/20 rounded-full blur-[140px]" />
                            </div>

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">

                                {/* Left: Editorial panel */}
                                <div className="lg:col-span-4 p-10 lg:p-16 flex flex-col justify-between min-h-[520px]">
                                    <div>
                                        {/* City selector */}
                                        <button
                                            onClick={() => setIsCityPickerOpen(true)}
                                            className="flex items-center gap-2.5 px-4 py-2 bg-white/60 backdrop-blur-sm border border-[#d0c8be] rounded-full mb-10 hover:bg-white hover:shadow-md transition-all group"
                                        >
                                            <span className="text-base leading-none">{activeCity.emoji}</span>
                                            <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#7a6a5a] group-hover:text-[#1a1410] transition-colors">{activeCity.city}</span>
                                            {weatherInfo && (
                                                <>
                                                    <span className="w-px h-3 bg-[#c0b8b0]" />
                                                    <span className="text-[9px] font-mono text-[#a89880]">{weatherInfo.temp}°C</span>
                                                    {weatherInfo.isRainy && <span className="text-[10px]">🌧️</span>}
                                                </>
                                            )}
                                            <span className="text-[9px] text-[#b0a898] group-hover:text-[#7a6a5a] transition-colors">▾</span>
                                        </button>

                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-8 h-8 bg-[#1a1410] rounded-xl flex items-center justify-center shadow-md">
                                                <Sparkles size={14} className="text-amber-200" />
                                            </div>
                                            <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#9a8a7a]">AI · Stil Önerisi</span>
                                        </div>
                                        <h2 className="text-[44px] lg:text-[62px] font-serif font-light leading-[0.9] tracking-tight text-[#1a1410] mb-8">
                                            Bugünün<br />
                                            <span className="italic text-[#a89880]">Kombini.</span>
                                        </h2>

                                        {/* Weather card */}
                                        {weatherInfo && (
                                            <div className="flex items-center gap-3 px-4 py-3 bg-white/50 backdrop-blur-sm border border-[#e0d8d0] rounded-2xl mb-6">
                                                <div className="text-2xl leading-none">{weatherInfo.isRainy ? '🌧️' : weatherInfo.temp > 25 ? '☀️' : weatherInfo.temp > 15 ? '🌤️' : '🧥'}</div>
                                                <div>
                                                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a8a7a]">{weatherInfo.description}</p>
                                                    <p className="text-[12px] font-serif text-[#1a1410]">{weatherInfo.temp}°C · {wearOuterwear ? 'Dış giyim önerilir' : 'Dış giyim gerekmez'}</p>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[#7a6a5a] font-serif italic text-base leading-relaxed max-w-xs">
                                            {aiExplanation || 'AI Stilist dolabını analiz ediyor…'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 mt-10 flex-wrap">
                                        <button onClick={() => setIsAIFullscreen(true)}
                                            className="flex items-center gap-2.5 px-7 py-3.5 bg-[#1a1410] text-white rounded-full text-[9px] font-black uppercase tracking-[0.35em] hover:scale-[1.04] transition-all shadow-[0_12px_40px_rgba(26,20,16,0.25)]">
                                            <Wand2 size={14} /> Stüdyoyu Aç
                                        </button>
                                        <button
                                            onClick={saveAiOutfit}
                                            disabled={savingAiOutfit || aiOutfitCards.length === 0}
                                            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-[#d0c8be] rounded-full text-[9px] font-black uppercase tracking-[0.35em] text-[#1a1410] hover:bg-[#1a1410] hover:text-white hover:border-[#1a1410] transition-all disabled:opacity-40"
                                            title="Bu kombini Lookbook'a kaydet"
                                        >
                                            {savingAiOutfit
                                                ? <><RefreshCw size={13} className="animate-spin" /> Kaydediliyor...</>
                                                : <><Bookmark size={13} /> Lookbook'a Kaydet</>
                                            }
                                        </button>
                                        <button onClick={() => generateOutfit()}
                                            className="w-12 h-12 rounded-full border border-[#d0c8be] bg-white/50 flex items-center justify-center hover:bg-[#1a1410] hover:text-white hover:border-[#1a1410] transition-all group"
                                            title="Yeni öneri">
                                            <RefreshCw size={15} className="text-[#7a6a5a] group-hover:text-white transition-colors" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Vertical category list */}
                                <div className="lg:col-span-8 p-6 lg:p-10 flex items-center">
                                    {aiOutfitCards.length > 0 ? (() => {
                                        const catKeys = ['üstGiyim','altGiyim','dışGiyim','aksesuar','ayakkabı'] as const;
                                        const catLabels: Record<string,string> = { üstGiyim: 'Üst Giyim', altGiyim: 'Alt Giyim', dışGiyim: 'Dış Giyim', aksesuar: 'Aksesuar', ayakkabı: 'Ayakkabı' };
                                        const catIcons: Record<string,string> = { üstGiyim: '👕', altGiyim: '👖', dışGiyim: '🧥', aksesuar: '⌚', ayakkabı: '👟' };
                                        return (
                                            <div className="w-full divide-y divide-[#e8e2da]/60">
                                                {catKeys.map((cat, ci) => {
                                                    const itemId = categoryMap[cat];
                                                    const item = itemId ? items.find(i => i.id === itemId) : null;
                                                    const isSkipped = cat === 'dışGiyim' && !wearOuterwear;

                                                    return (
                                                        <motion.div
                                                            key={cat}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: ci * 0.08, duration: 0.55, ease: 'easeOut' }}
                                                            onClick={item ? () => setSelectedItem(item) : undefined}
                                                            className={`flex items-center gap-5 py-4 px-3 -mx-3 rounded-2xl transition-all duration-300 ${
                                                                item ? 'cursor-pointer hover:bg-white/60 hover:shadow-sm' : 'opacity-50'
                                                            }`}
                                                        >
                                                            {/* Thumbnail */}
                                                            <div className={`w-[68px] h-[68px] rounded-2xl overflow-hidden shrink-0 shadow-md ${item ? 'group' : ''}`}>
                                                                {item ? (
                                                                    <img
                                                                        src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                                        className="w-full h-full object-cover hover:scale-[1.1] transition-transform duration-700"
                                                                        style={{ filter: 'contrast(1.05) brightness(0.96) saturate(0.88)' }}
                                                                        onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=200'; }}
                                                                        alt={item.brand}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-[#ede8e0] border border-[#d8d0c8] flex items-center justify-center">
                                                                        <span className="text-lg opacity-30">{catIcons[cat]}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[8px] font-mono uppercase tracking-[0.45em] text-[#9a8a7a] mb-1.5">{catLabels[cat]}</p>
                                                                <p className={`font-serif leading-tight truncate ${item ? 'text-[#1a1410] text-[18px]' : 'text-[#b0a898] text-[15px] italic'}`}>
                                                                    {item
                                                                        ? (item.brand || 'İmza Parça')
                                                                        : isSkipped
                                                                            ? 'Bugün gerek yok'
                                                                            : '—'
                                                                    }
                                                                </p>
                                                                {item?.colors?.[0] && (
                                                                    <p className="text-[8px] font-mono text-[#a89880] uppercase tracking-wider mt-1">{item.colors[0]}</p>
                                                                )}
                                                                {isSkipped && weatherInfo && (
                                                                    <p className="text-[8px] font-mono text-[#a89880] uppercase tracking-wider mt-1">{weatherInfo.temp}°C · {weatherInfo.description}</p>
                                                                )}
                                                            </div>

                                                            {/* Arrow */}
                                                            {item && (
                                                                <span className="text-[#c8bfb5] text-sm shrink-0 pr-1">›</span>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })() : (
                                        <div className="flex items-center justify-center w-full min-h-[380px]">
                                            <div className="text-center">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                                    className="w-12 h-12 border-2 border-[#d0c8be] border-t-[#1a1410] rounded-full mx-auto mb-5" />
                                                <p className="text-[#9a8a7a] font-serif italic">Kombin hazırlanıyor…</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* ─── City Picker Modal ─── */}
                <AnimatePresence>
                    {isCityPickerOpen && (
                        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCityPickerOpen(false)} />
                            <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                className="relative bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-serif text-gray-900">Şehir Seç</h3>
                                        <p className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-1">Hava durumuna göre kombin önerisi</p>
                                    </div>
                                    <button onClick={() => setIsCityPickerOpen(false)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {ALL_CITIES.map((c, i) => (
                                        <button key={c.city}
                                            onClick={() => {
                                                setCityIdx(i);
                                                setIsCityPickerOpen(false);
                                                generateOutfit(c.city, c.style);
                                            }}
                                            className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all hover:scale-[1.03] active:scale-[0.98] ${
                                                cityIdx === i
                                                    ? 'border-[#1a1410] bg-[#1a1410] text-white shadow-lg'
                                                    : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300'
                                            }`}>
                                            <span className="text-xl leading-none">{c.emoji}</span>
                                            <span className="text-[10px] font-bold leading-tight text-center">{c.city}</span>
                                            <span className={`text-[8px] font-mono uppercase tracking-wide leading-tight text-center ${cityIdx === i ? 'text-white/60' : 'text-gray-400'}`}>{c.style.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ═══════════════════════════════════════════════════════════
                    EDİTORYAL CTA — Stilini Keşfet
                ═══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="mt-12 mb-20"
                >
                    <div className="bg-[#0c0c0c] rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
                        {/* Ambient glows */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
                            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[180px] pointer-events-none"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.16, 0.08] }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                            className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] bg-amber-900/20 rounded-full blur-[160px] pointer-events-none"
                        />
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />

                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-14">

                            {/* Left: Big editorial text */}
                            <div>
                                <p className="text-[9px] font-mono uppercase tracking-[0.55em] text-white/20 mb-10 flex items-center gap-4">
                                    <span className="w-10 h-px bg-white/15 inline-block" />
                                    Koleksiyon
                                </p>
                                <h2 className="text-[60px] lg:text-[96px] xl:text-[112px] font-serif font-light leading-[0.88] tracking-tight text-white mb-8">
                                    Stilini<br />
                                    <span className="italic text-white/15">Keşfet.</span>
                                </h2>
                                <p className="text-white/30 font-serif italic text-xl leading-relaxed max-w-md">
                                    Her gün değişen 20 yeni parça — gardırobunu tamamla, stilini yükselt.
                                </p>
                            </div>

                            {/* Right: CTA buttons */}
                            <div className="flex flex-col gap-4 shrink-0 min-w-[260px]">
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate('/discover')}
                                    className="flex items-center justify-between gap-4 px-8 py-5 bg-white text-[#0c0c0c] rounded-full text-[9px] font-black uppercase tracking-[0.35em] shadow-[0_0_50px_rgba(255,255,255,0.1)] group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={15} />
                                        Bugünü Keşfet
                                    </div>
                                    <div className="w-7 h-7 bg-[#0c0c0c] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap size={12} className="text-white" />
                                    </div>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate('/lookbook')}
                                    className="flex items-center justify-between gap-4 px-8 py-5 bg-white/6 border border-white/12 text-white/55 rounded-full text-[9px] font-black uppercase tracking-[0.35em] hover:bg-white/12 hover:text-white/80 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Wand2 size={15} />
                                        Lookbook'uma Git
                                    </div>
                                    <div className="w-7 h-7 border border-white/15 rounded-full flex items-center justify-center">
                                        <span className="text-[10px] leading-none">→</span>
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ═══════════════════════════════════════════════════════════
                    FOOTER SIGNATURE
                ═══════════════════════════════════════════════════════════ */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    className="mt-20 pt-16 border-t border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-8 pb-8"
                >
                    <div>
                        <h2 className="text-6xl lg:text-8xl font-serif font-light text-gray-100 leading-none select-none">Wardrobe<span className="text-[#1a1a1a]/30 italic">.</span></h2>
                        <p className="text-xs font-mono text-gray-400 mt-3 tracking-[0.25em] uppercase">Your AI-Powered Fashion Companion</p>
                    </div>
                    <div className="flex flex-col items-center lg:items-end gap-3 text-right">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/60 rounded-full border border-white/80 shadow-sm">
                            <Sparkles size={14} className="text-[#1a1a1a]" />
                            <span className="text-sm font-serif italic text-gray-600">{stats.total} parça · {stats.label} koleksiyon</span>
                        </div>
                        <button onClick={handleAdd} className="flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white rounded-full text-xs font-mono uppercase tracking-widest hover:bg-[#1a1a1a] transition-all shadow-lg">
                            <Plus size={14} /> Parça Ekle
                        </button>
                    </div>
                </motion.footer>

            </div>{/* end max-w */}

            {/* ═══════════════════════════════════════════════════════════════
                ITEM DETAIL PORTAL
            ═══════════════════════════════════════════════════════════════ */}
            {createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 lg:p-12 overflow-hidden">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-white/70 backdrop-blur-2xl" onClick={() => setSelectedItem(null)} />
                            <motion.div layoutId={`card-${selectedItem.id}`} className="relative w-full h-full lg:max-w-7xl lg:max-h-[85vh] bg-[#FDFBF7] lg:rounded-[3rem] shadow-2xl overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row z-10">
                                {/* Image */}
                                <div className="w-full h-[60vh] lg:w-1/2 lg:h-full relative">
                                    <motion.img layoutId={`image-${selectedItem.id}`} src={getImageUrl(selectedItem.photos?.[0]?.url, selectedItem.category)} onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }} className="w-full h-full object-contain" style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] to-transparent lg:hidden" />
                                </div>
                                {/* Right panel */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col relative bg-[#FDFBF7]">
                                    <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 lg:top-10 lg:right-10 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 hover:rotate-90 transition-all z-20">
                                        <X size={20} />
                                    </button>
                                    <div className="mt-4 lg:mt-10 flex-1 overflow-y-auto hide-scrollbar pr-4">
                                        <p className="text-gray-400 uppercase tracking-[0.3em] text-[11px] font-mono mb-4">{selectedItem.category}</p>
                                        <h2 className="text-5xl lg:text-7xl font-serif mb-12 tracking-tight text-gray-900 leading-none">{selectedItem.brand || 'İmza Parça'}</h2>
                                        <div className="space-y-12">
                                            {/* AI Analysis */}
                                            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#1a1a1a]" />
                                                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-[#1a1a1a]"><Sparkles size={14} /> Style Oracle Analizi</h4>
                                                <p className="text-gray-600 leading-relaxed font-serif text-lg italic">
                                                    "Bu parça senin %{stylePercentage} oranındaki {dominantStyle} auranla kusursuz bir frekans yakalıyor. Gardırobundaki {Math.max(1, items.length - 1)} parçayla kolayca entegre olarak premium bir duruş sergiliyor."
                                                </p>
                                                <div className="mt-6">
                                                    <span className="px-4 py-1.5 bg-[#1a1a1a]/10 text-[#1a1a1a] rounded-full text-[10px] font-mono uppercase tracking-widest font-bold">%94 Uyum Skoru</span>
                                                </div>
                                            </div>
                                            {/* Virtual Try-On */}
                                            <div className="pt-8 border-t border-gray-200">
                                                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2 text-[#1a1a1a]"><Shirt size={14} /> AI Virtual Try-On</h4>
                                                <div className="flex gap-4 mb-5">
                                                    <div onClick={() => selfieInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-all shrink-0 overflow-hidden relative">
                                                        {selfieDataUrl ? (
                                                            <>
                                                                <img src={selfieDataUrl} className="w-full h-full object-cover" alt="selfie" />
                                                                {layerCount > 0 && (
                                                                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm pointer-events-none">
                                                                        {layerCount}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <><User size={22} className="text-gray-300 mb-1" /><span className="text-[9px] font-black uppercase tracking-widest text-gray-300 text-center leading-tight">Fotoğraf<br/>Seç</span></>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-center gap-2">
                                                        <p className="text-[11px] font-bold text-gray-700">
                                                            {layerCount > 0 ? `${layerCount} katman eklendi` : 'Kendi fotoğrafını yükle'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 leading-relaxed">
                                                            {layerCount > 0 ? 'Sonuç fotoğrafı üzerine yeni parça deneyebilirsin.' : 'Tam vücut veya üst beden fotoğrafın en iyi sonucu verir.'}
                                                        </p>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {selfieDataUrl && <button onClick={e => { e.stopPropagation(); setSelfieDataUrl(null); setOriginalSelfie(null); setLayerCount(0); setTryOnResult(null); }} className="text-[9px] text-red-400 font-bold uppercase tracking-widest">× Kaldır</button>}
                                                            {layerCount > 0 && originalSelfie && <button onClick={e => { e.stopPropagation(); handleResetSelfie(); }} className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">↺ Sıfırla</button>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleTryOn(selectedItem)} disabled={tryOnLoading || !selfieDataUrl}
                                                    className="w-full py-4 bg-gradient-to-r from-[#1a1a1a] to-[#1a1a1a] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-40 shadow-lg">
                                                    {tryOnLoading ? <><Loader2 size={16} className="animate-spin" /> Try-On AI çalışıyor (~60sn)...</> : <><Sparkles size={16} /> Üzerimde Nasıl Görünür?</>}
                                                </button>
                                                {/* Try-on result in modal */}
                                                {tryOnResult?.imageUrl && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                                                        <div className="relative">
                                                            <img src={tryOnResult.imageUrl} alt="Try-on result" className="w-full rounded-2xl object-cover shadow-2xl border border-white" style={{ maxHeight: '480px', objectPosition: 'top' }} />
                                                            <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500/90 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">✓ {tryOnResult.model}</div>
                                                        </div>
                                                        {/* Chaining actions */}
                                                        <div className="mt-4 flex flex-col gap-2">
                                                            <button
                                                                onClick={() => handleAddLayer(tryOnResult.imageUrl!)}
                                                                className="w-full py-3.5 bg-[#1a1a1a] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg"
                                                            >
                                                                <Plus size={14} /> Başka Parça Ekle (Katman {layerCount + 1})
                                                            </button>
                                                            <button
                                                                onClick={() => saveTryOnToLookbook(selectedItem?.brand || selectedItem?.category)}
                                                                disabled={savingToLookbook}
                                                                className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-40 transition-all"
                                                            >
                                                                {savingToLookbook ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}
                                                                Lookbook'a Kaydet
                                                            </button>
                                                            {originalSelfie && layerCount > 0 && (
                                                                <button
                                                                    onClick={handleResetSelfie}
                                                                    className="w-full py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:border-gray-400 transition-all"
                                                                >
                                                                    <RefreshCw size={12} /> Sıfırla — Orijinal Fotoğrafa Dön
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                                {tryOnResult && !tryOnResult.imageUrl && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                                        <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                                                        <div>
                                                            <p className="text-amber-800 text-sm font-semibold mb-1">Try-On Şu An Kullanılamıyor</p>
                                                            <p className="text-amber-600 text-xs leading-relaxed">AI modelleri yoğun kullanımda. Birkaç dakika bekleyip tekrar deneyebilirsin.</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            {/* Actions */}
                                            <div className="pt-8 border-t border-gray-200">
                                                <div className="flex gap-3">
                                                    <button onClick={() => { toggleFavorite({ stopPropagation: () => {} } as any, selectedItem.id); }} className="flex-1 h-14 border border-gray-200 rounded-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all">
                                                        <Heart size={18} className={favorites.has(selectedItem.id) ? 'fill-[#1a1a1a] text-[#1a1a1a]' : ''} /> Favori
                                                    </button>
                                                    <button onClick={() => { addToOutfit({ stopPropagation: () => {} } as any, selectedItem); setSelectedItem(null); }} className="flex-1 h-14 border border-gray-200 rounded-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all">
                                                        <PlusCircle size={18} /> Kombine Ekle
                                                    </button>
                                                    <button onClick={() => { setEditingItem(selectedItem); setSelectedItem(null); setIsAddModalOpen(true); }} className="w-14 h-14 border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all" title="Düzenle">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(selectedItem.id)} className="w-14 h-14 border border-gray-200 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all" title="Sil">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ═══════════════════════════════════════════════════════════════
                AI FULLSCREEN PORTAL
            ═══════════════════════════════════════════════════════════════ */}
            {createPortal(
                <AnimatePresence>
                    {isAIFullscreen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-0 z-[99999] flex flex-col bg-[#050505] overflow-y-auto hide-scrollbar">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.05] pointer-events-none fixed" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity }} className="fixed -top-[20%] -left-[10%] w-[1000px] h-[1000px] bg-[#1a1a1a]/40 rounded-full blur-[200px] pointer-events-none" />
                            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 8, repeat: Infinity, delay: 1 }} className="fixed -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-amber-900/30 rounded-full blur-[150px] pointer-events-none" />
                            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto px-6 py-20">
                                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} onClick={() => setIsAIFullscreen(false)}
                                    className="absolute top-10 right-10 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all border border-white/10 z-50">
                                    <X size={24} />
                                </motion.button>
                                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1.2 }} className="text-center w-full">
                                    <Sparkles size={40} className="text-amber-200/80 mx-auto mb-10 animate-pulse" />
                                    <h2 className="text-5xl md:text-7xl lg:text-[100px] font-serif text-white mb-8 italic tracking-tight font-light leading-none">Senin İçin <br/>Tasarlandı.</h2>
                                    <p className="text-xl lg:text-3xl text-white/60 font-serif mb-20 max-w-3xl mx-auto leading-relaxed font-light">
                                        Bugün {activeCity.city} havası var. {activeCity.style} tarzını yansıtacak kusursuz bir seçki hazırladım.
                                    </p>
                                </motion.div>
                                {aiOutfitCards.length > 0 && (
                                    <motion.div
                                        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1.0, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                        className="flex items-end justify-center gap-4 lg:gap-6 w-full"
                                    >
                                        {aiOutfitCards.map((it: any, i: number) => {
                                            const midIdx = Math.floor(aiOutfitCards.length / 2);
                                            const isCenter = i === midIdx && aiOutfitCards.length >= 3;
                                            return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 40 }}
                                                animate={{ opacity: 1, y: isCenter ? -28 : 0 }}
                                                transition={{ delay: 1.2 + i * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                                whileHover={{ y: isCenter ? -44 : -16, scale: 1.03 }}
                                                className="relative overflow-hidden rounded-[2rem] cursor-pointer group shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
                                                style={{ width: isCenter ? 'clamp(160px,16vw,260px)' : 'clamp(130px,13vw,210px)', aspectRatio: '3/4' }}
                                                onClick={() => setSelectedItem(it)}
                                            >
                                                {/* Photo */}
                                                <img
                                                    src={getImageUrl(it.photos?.[0]?.url, it.category)}
                                                    onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }}
                                                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-[1.06] transition-all duration-[2s] ease-out"
                                                    alt={it.brand}
                                                />
                                                {/* Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                                {/* Index badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span className="text-[9px] font-black text-white/40 font-mono tracking-[0.35em]">
                                                        0{i + 1}
                                                    </span>
                                                </div>
                                                {/* Bottom info */}
                                                <div className="absolute bottom-0 inset-x-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                                                    <p className="text-white/40 text-[8px] font-mono uppercase tracking-[0.45em] mb-1.5">{it.category}</p>
                                                    <h4 className="text-white font-serif text-lg lg:text-xl leading-tight">{it.brand || 'İmza Parça'}</h4>
                                                    {it.colors?.[0] && (
                                                        <p className="text-white/30 text-[8px] font-mono uppercase tracking-widest mt-1.5">{it.colors[0]}</p>
                                                    )}
                                                </div>
                                                {/* Subtle border */}
                                                <div className="absolute inset-0 rounded-[2rem] border border-white/[0.07] pointer-events-none" />
                                            </motion.div>
                                        ); })}
                                    </motion.div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, duration: 1 }}
                                    className="mt-14 w-full max-w-3xl mx-auto flex flex-col items-center gap-8"
                                >
                                    {/* Oracle card */}
                                    <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] p-8 lg:p-10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-300/60 via-amber-500/40 to-transparent" />
                                        <div className="flex items-start gap-5">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Sparkles size={18} className="text-amber-300" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Style Oracle</span>
                                                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                    <span className="text-[9px] font-mono text-amber-300/70 tracking-widest">
                                                        {activeCity.city} · {activeCity.style}
                                                    </span>
                                                </div>
                                                <p className="text-white/75 font-serif italic text-lg lg:text-xl leading-relaxed">
                                                    "{aiOutfitCards.length > 0 ? aiExplanation : 'Kombin analiz ediliyor…'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-4 flex-wrap justify-center">
                                        <motion.button
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => { showToast('Harika! Bugün bu kombini giyiyorsun.'); setIsAIFullscreen(false); }}
                                            className="flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.35em] shadow-[0_0_50px_rgba(255,255,255,0.12)] hover:bg-amber-50 transition-all"
                                        >
                                            <Flame size={18} className="text-orange-500" /> Bugün Bunu Giyeceğim
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => { setOutfitItems(aiOutfitCards); setIsAIFullscreen(false); setIsOutfitBuilderOpen(true); showToast('Kombin Stüdyoya Aktarıldı!'); }}
                                            className="flex items-center gap-3 px-8 py-5 bg-white/6 border border-white/12 text-white/65 rounded-full text-[10px] font-black uppercase tracking-[0.35em] hover:bg-white/12 hover:text-white transition-all"
                                        >
                                            <Bookmark size={16} /> Stüdyoya Kaydet
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.93 }}
                                            onClick={() => { generateOutfit(); showToast('Yeni kombin hesaplandı.'); }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/35 hover:bg-white/8 transition-colors"
                                        >
                                            <RefreshCw size={20} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ═══════════════════════════════════════════════════════════════
                VIRTUAL TRY-ON FULLSCREEN PORTAL
            ═══════════════════════════════════════════════════════════════ */}
            {createPortal(
                <AnimatePresence>
                    {(tryOnLoading || tryOnFullscreen) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                            className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -top-1/4 -left-1/4 w-[900px] h-[900px] bg-[#1a1a1a]/40 rounded-full blur-[200px] pointer-events-none" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 1 }} className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[180px] pointer-events-none" />
                            {tryOnFullscreen && !tryOnLoading && (
                                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={() => { setTryOnFullscreen(false); setTryOnResult(null); }}
                                    className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10">
                                    <X size={22} />
                                </motion.button>
                            )}
                            {/* Loading */}
                            {tryOnLoading && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-10 px-6 text-center">
                                    <div className="relative w-28 h-28">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1a1a1a] border-r-[#1a1a1a]/40" />
                                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute inset-3 rounded-full border border-transparent border-t-amber-400/50" />
                                        <div className="absolute inset-0 flex items-center justify-center"><Shirt size={28} className="text-white/60" /></div>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl lg:text-5xl font-serif text-white font-light tracking-tight mb-3">AI Oluşturuyor</h3>
                                        <p className="text-white/40 font-serif italic text-lg">Virtual Try-On işleniyor...</p>
                                    </div>
                                    <div className="flex flex-col gap-3 w-full max-w-sm">
                                        {[{ label: 'Görseller Yükleniyor', icon: '📤' }, { label: 'Giysi Analiz Ediliyor', icon: '🔍' }, { label: 'AI Üretiyor', icon: '✨' }, { label: 'Sonuç Hazırlanıyor', icon: '🎨' }].map((step, i) => (
                                            <motion.div key={i} initial={{ opacity: 0.2 }} animate={{ opacity: tryOnStep >= i ? 1 : 0.25 }} transition={{ duration: 0.5 }}
                                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${tryOnStep >= i ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-white/20'}`}>
                                                <span className="text-lg">{step.icon}</span>
                                                <span className="text-sm font-mono tracking-widest uppercase">{step.label}</span>
                                                {tryOnStep === i && tryOnLoading && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="ml-auto w-2 h-2 rounded-full bg-amber-400" />}
                                                {tryOnStep > i && <span className="ml-auto text-emerald-400 text-xs font-bold">✓</span>}
                                            </motion.div>
                                        ))}
                                    </div>
                                    <p className="text-white/20 text-[11px] font-mono tracking-widest uppercase">~30-60 saniye sürebilir</p>
                                </motion.div>
                            )}
                            {/* Result */}
                            {!tryOnLoading && tryOnFullscreen && tryOnResult?.imageUrl && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative flex flex-col lg:flex-row items-center gap-10 w-full max-w-5xl mx-auto px-6">
                                    <div className="relative flex-1 max-w-md w-full">
                                        <div className="absolute -inset-4 bg-gradient-to-br from-[#1a1a1a]/30 to-indigo-900/20 rounded-[3rem] blur-2xl" />
                                        <img src={tryOnResult.imageUrl} alt="Virtual Try-On" className="relative w-full rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/10 object-contain" style={{ maxHeight: '80vh', background: '#111' }} />
                                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                            <span>✓</span> {tryOnResult.model || 'AI'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6 lg:max-w-xs w-full">
                                        <div>
                                            <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Virtual Try-On</p>
                                            <h3 className="text-3xl lg:text-4xl font-serif text-white font-light leading-tight">İşte böyle<br />görünürsün.</h3>
                                            <p className="text-white/50 font-serif italic mt-3 text-sm leading-relaxed">{tryOnResult.model || 'AI'} modeli senin fotoğrafını ve kıyafeti analiz ederek gerçekçi bir önizleme oluşturdu.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => handleAddLayer(tryOnResult.imageUrl!)}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all shadow-xl"
                                            >
                                                <Plus size={16} /> Başka Parça Ekle
                                            </button>
                                            <button
                                                onClick={() => saveTryOnToLookbook(selectedItem?.brand || selectedItem?.category)}
                                                disabled={savingToLookbook}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-white/10 border border-white/20 text-white rounded-full font-medium text-sm hover:bg-white/20 disabled:opacity-40 transition-all"
                                            >
                                                {savingToLookbook ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} />}
                                                Lookbook'a Kaydet
                                            </button>
                                            <a href={tryOnResult.imageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 px-6 py-3.5 text-white/40 rounded-full text-sm hover:text-white/70 transition-all">
                                                ⬇ İndir
                                            </a>
                                            {originalSelfie && layerCount > 0 && (
                                                <button
                                                    onClick={handleResetSelfie}
                                                    className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 border border-white/10 text-white/60 rounded-full text-sm hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    <RefreshCw size={14} /> Sıfırla
                                                </button>
                                            )}
                                            <button onClick={() => { setTryOnFullscreen(false); setTryOnResult(null); if (selectedItem) setTimeout(() => handleTryOn(selectedItem), 100); }} className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white/50 rounded-full font-medium text-sm hover:bg-white/10 hover:text-white transition-all">
                                                <RefreshCw size={15} /> Tekrar Dene
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ═══════════════════════════════════════════════════════════════
                OUTFIT BUILDER DRAWER PORTAL
            ═══════════════════════════════════════════════════════════════ */}
            {createPortal(
                <AnimatePresence>
                    {isOutfitBuilderOpen && (
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-white shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-40 p-6 lg:p-8"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const d = e.dataTransfer.getData('item'); if (d) { const it = JSON.parse(d); if (!outfitItems.find(i => i.id === it.id)) setOutfitItems(p => [...p, it]); } }}>
                            <div className="max-w-[1700px] mx-auto flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-2xl font-serif font-medium flex items-center gap-3"><Wand2 size={24} className="text-[#1a1a1a]" /> Kombin Stüdyosu</h3>
                                        <p className="text-gray-500 font-serif italic text-sm mt-1">Parçaları sürükle ve kendi imza görünümünü yarat.</p>
                                    </div>
                                    <button onClick={() => setIsOutfitBuilderOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-600" /></button>
                                </div>
                                <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar min-h-[160px] p-4 bg-stone-50/50 rounded-3xl border border-dashed border-gray-300">
                                    {outfitItems.length === 0 ? (
                                        <div className="w-full text-center text-gray-400 font-serif italic text-lg">Parçaları buraya sürükle veya kart üzerindeki + butonuna bas.</div>
                                    ) : (
                                        <AnimatePresence>
                                            {outfitItems.map(item => (
                                                <motion.div key={item.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0, width: 0 }} transition={{ type: 'spring' }} className="relative w-28 h-40 shrink-0 rounded-2xl overflow-hidden border border-white shadow-lg group">
                                                    <img src={getImageUrl(item.photos?.[0]?.url, item.category)} className="w-full h-full object-cover" alt="" />
                                                    <button onClick={() => removeFromOutfit(item.id)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"><X size={14} /></button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2"><span className="text-white text-[9px] font-mono uppercase tracking-widest">{item.category}</span></div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                                {outfitItems.length > 0 && (
                                    <div className="mt-6 flex items-center justify-between gap-4">
                                        <p className="text-sm text-gray-500 font-serif italic">{outfitItems.length} parça seçili</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => { setOutfitItems([]); setIsOutfitBuilderOpen(false); }} className="px-6 py-3 border border-gray-200 text-gray-500 rounded-full text-sm hover:border-gray-400 transition-all">Temizle</button>
                                            <button onClick={saveOutfit} className="px-8 py-3.5 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#1a1a1a] transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(90,30,42,0.3)] flex items-center gap-2">
                                                <Bookmark size={16} /> Kombini Kaydet
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Floating Action Button ── */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={handleAdd}
                className="fixed bottom-24 right-5 lg:bottom-10 lg:right-10 z-50 w-[62px] h-[62px] lg:w-[68px] lg:h-[68px] bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.28)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.38)] transition-shadow group"
                title="Yeni Parça Ekle"
            >
                <Plus size={22} strokeWidth={1.8} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="absolute inset-0 rounded-full animate-ping bg-[#1a1a1a]/15 pointer-events-none" style={{ animationDuration: '3.5s' }} />
            </motion.button>

            <AddItemModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }} onSuccess={() => { fetchItems(); setEditingItem(null); }} editItem={editingItem} />

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default WardrobePage;
