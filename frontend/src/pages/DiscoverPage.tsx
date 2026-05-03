import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Sparkles, Heart, X, ShoppingBag, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';
import { API_URL } from '../config';

export interface Product {
    id: string;
    title: string;
    brand: string;
    gender: 'Kadın' | 'Erkek';
    imageUrl: string;
    category: string;
    productUrl: string;
}

const MAX_SEEN    = 200;
const DAILY_LIMIT = 20;

// ── Curated fallback images per category ─────────────────────────────────────
const FALLBACK_IMAGES: Record<string, string[]> = {
    skirt:   ['https://images.unsplash.com/photo-1583496664160-39c17360801d?w=800&q=80', 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80'],
    jacket:  ['https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=800&q=80', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'],
    top:     ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80'],
    jeans:   ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'],
    shirt:   ['https://images.unsplash.com/photo-1596755094514-f87034a31217?w=800&q=80', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'],
    coat:    ['https://images.unsplash.com/photo-1544022613-e87ef7556554?w=800&q=80', 'https://images.unsplash.com/photo-1539533057403-0c6688c566fa?w=800&q=80'],
    dress:   ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'],
    sweater: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'https://images.unsplash.com/photo-1617391654929-0c1a1bd706f1?w=800&q=80'],
};

const getCategoryFallback = (category: string): string => {
    const map: Record<string, string> = {
        'Alt Giyim': FALLBACK_IMAGES.jeans[0],
        'Dış Giyim': FALLBACK_IMAGES.jacket[0],
        'Üst Giyim': FALLBACK_IMAGES.top[0],
        'Elbise':    FALLBACK_IMAGES.dress[0],
        'Aksesuar':  FALLBACK_IMAGES.shirt[0],
    };
    return map[category] || FALLBACK_IMAGES.top[0];
};

// Marka bazlı arama URL üreticileri
const brandUrl = (brand: string, gender: 'Kadın' | 'Erkek', q: string): string => {
    const enc = encodeURIComponent(q);
    const genderParam = gender === 'Kadın' ? 'kadin' : 'erkek';
    switch (brand) {
        case 'Zara':         return `https://www.zara.com/tr/tr/search?searchTerm=${enc}`;
        case 'Bershka':      return `https://www.bershka.com/tr/kadin/search?searchTerm=${enc}`;
        case 'Pull&Bear':    return `https://www.pullandbear.com/tr/${genderParam}/search?searchTerm=${enc}`;
        case 'LC Waikiki':   return `https://www.lcw.com/tr-TR/TR/arama?q=${enc}&gender=${genderParam}`;
        case 'Koton':        return `https://www.koton.com/tr/arama?q=${enc}`;
        case 'Mavi':         return `https://www.mavi.com/search?q=${enc}`;
        case 'DeFacto':      return `https://www.defacto.com.tr/search?q=${enc}`;
        default:             return `https://www.zara.com/tr/tr/search?searchTerm=${enc}`;
    }
};

const CURATED_CATALOG: Product[] = [
    // ── Kadın (8 ürün) ─────────────────────────────────────────────────────────
    {
        id: 'k-01', title: 'Midi Etek', brand: 'Zara', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1583496664160-39c17360801d?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('Zara', 'Kadın', 'midi etek'),
    },
    {
        id: 'k-02', title: 'Saten Bluz', brand: 'Pull&Bear', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        category: 'Üst Giyim', productUrl: brandUrl('Pull&Bear', 'Kadın', 'saten bluz'),
    },
    {
        id: 'k-03', title: 'Mom Jean', brand: 'Bershka', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('Bershka', 'Kadın', 'mom jean'),
    },
    {
        id: 'k-04', title: 'Oversize Blazer', brand: 'Zara', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&fit=crop',
        category: 'Dış Giyim', productUrl: brandUrl('Zara', 'Kadın', 'oversize blazer'),
    },
    {
        id: 'k-05', title: 'Crop Tişört', brand: 'LC Waikiki', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('LC Waikiki', 'Kadın', 'crop tişört'),
    },
    {
        id: 'k-06', title: 'Trençkot', brand: 'Koton', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80&fit=crop',
        category: 'Dış Giyim', productUrl: brandUrl('Koton', 'Kadın', 'trençkot'),
    },
    {
        id: 'k-07', title: 'Midi Elbise', brand: 'DeFacto', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80&fit=crop',
        category: 'Elbise', productUrl: brandUrl('DeFacto', 'Kadın', 'midi elbise'),
    },
    {
        id: 'k-08', title: 'Örme Kazak', brand: 'Pull&Bear', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1617391654929-0c1a1bd706f1?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Pull&Bear', 'Kadın', 'örme kazak'),
    },
    {
        id: 'k-09', title: 'Mini Etek', brand: 'Bershka', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('Bershka', 'Kadın', 'mini etek'),
    },
    {
        id: 'k-10', title: 'Keten Gömlek', brand: 'Mavi', gender: 'Kadın',
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Mavi', 'Kadın', 'keten gömlek'),
    },
    // ── Erkek (10 ürün) ────────────────────────────────────────────────────────
    {
        id: 'e-01', title: 'Slim Fit Chino', brand: 'Zara', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('Zara', 'Erkek', 'slim fit chino'),
    },
    {
        id: 'e-02', title: 'Oxford Gömlek', brand: 'Mavi', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Mavi', 'Erkek', 'oxford gömlek'),
    },
    {
        id: 'e-03', title: 'Oversize Sweatshirt', brand: 'Bershka', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Bershka', 'Erkek', 'oversize sweatshirt'),
    },
    {
        id: 'e-04', title: 'Denim Ceket', brand: 'LC Waikiki', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800&q=80&fit=crop',
        category: 'Dış Giyim', productUrl: brandUrl('LC Waikiki', 'Erkek', 'denim ceket'),
    },
    {
        id: 'e-05', title: 'Slim Jean', brand: 'Mavi', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('Mavi', 'Erkek', 'slim jean'),
    },
    {
        id: 'e-06', title: 'Basic Tişört', brand: 'Pull&Bear', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Pull&Bear', 'Erkek', 'basic tişört'),
    },
    {
        id: 'e-07', title: 'Şişme Mont', brand: 'DeFacto', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ef7556554?w=800&q=80',
        category: 'Dış Giyim', productUrl: brandUrl('DeFacto', 'Erkek', 'şişme mont'),
    },
    {
        id: 'e-08', title: 'Polo Gömlek', brand: 'Koton', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Koton', 'Erkek', 'polo gömlek'),
    },
    {
        id: 'e-09', title: 'Regular Jean', brand: 'LC Waikiki', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&fit=crop',
        category: 'Alt Giyim', productUrl: brandUrl('LC Waikiki', 'Erkek', 'regular jean'),
    },
    {
        id: 'e-10', title: 'Kapüşonlu Sweatshirt', brand: 'Pull&Bear', gender: 'Erkek',
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&fit=crop',
        category: 'Üst Giyim', productUrl: brandUrl('Pull&Bear', 'Erkek', 'kapüşonlu sweatshirt'),
    },
];

function getSeenIds(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('seenItemIds') || '[]')); }
    catch { return new Set(); }
}

function markSeen(id: string) {
    try {
        const arr = JSON.parse(localStorage.getItem('seenItemIds') || '[]') as string[];
        if (!arr.includes(id)) {
            arr.push(id);
            if (arr.length > MAX_SEEN) arr.splice(0, arr.length - MAX_SEEN);
            localStorage.setItem('seenItemIds', JSON.stringify(arr));
        }
    } catch { /* ignore */ }
}

const cardVariants = {
    enter: { scale: 0.88, opacity: 0, y: 30 },
    center: { scale: 1, opacity: 1, y: 0 },
    exitLeft: { x: -600, opacity: 0, rotate: -25, transition: { duration: 0.35 } },
    exitRight: { x: 600, opacity: 0, rotate: 25, transition: { duration: 0.35 } },
};

const isProductUrlValid = (url?: string): boolean => {
    if (!url || url === '#' || url === '') return false;
    if (url.length <= 20) return false;
    try {
        const parsed = new URL(url);
        if (parsed.pathname === '/' || parsed.pathname === '') {
            return parsed.search.length > 2;
        }
        return true;
    } catch {
        return false;
    }
};

const DiscoverPage: React.FC = () => {
    const navigate = useNavigate();
    const { setCurrentProduct } = useWardrobeStore();
    const { openMenu, showToast } = useUIStore();
    const [view, setView]           = useState<'discover' | 'editorial'>('discover');
    const [genderFilter, setGenderFilter] = useState<'Tümü' | 'Kadın' | 'Erkek'>('Tümü');
    const [items, setItems]         = useState<Product[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editorialContent, setEditorialContent] = useState<any>(null);
    const [swipedCount, setSwipedCount]   = useState(0);
    const [exitVariant, setExitVariant]   = useState<'exitLeft' | 'exitRight'>('exitLeft');
    const [isLoading, setIsLoading]       = useState(true);
    const [dragOffset, setDragOffset]     = useState(0);

    const currentItem = items[currentIndex];

    useEffect(() => {
        setCurrentProduct(currentItem || null);
    }, [currentItem, setCurrentProduct]);

    const fetchShopItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const seenIds = getSeenIds();
            const filtered = genderFilter === 'Tümü'
                ? CURATED_CATALOG
                : CURATED_CATALOG.filter(p => p.gender === genderFilter);
            const unseen = filtered.filter(item => !seenIds.has(item.id));

            if (unseen.length === 0) {
                localStorage.removeItem('seenItemIds');
                setItems(filtered);
                setCurrentIndex(0);
            } else {
                setItems(unseen);
                setCurrentIndex(0);
            }
        } catch (err) {
            console.error('Shop load error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [genderFilter]);

    const fetchEditorial = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/editorial`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEditorialContent(data);
            }
        } catch (err) {
            console.error('Editorial error:', err);
        }
    };

    useEffect(() => {
        fetchShopItems();
        fetchEditorial();

        const savedDate = localStorage.getItem('lastSwipeDate');
        const today = new Date().toDateString();
        if (savedDate === today) {
            setSwipedCount(parseInt(localStorage.getItem('dailySwipedCount') || '0', 10));
        } else {
            localStorage.setItem('lastSwipeDate', today);
            localStorage.setItem('dailySwipedCount', '0');
            setSwipedCount(0);
        }
    }, [fetchShopItems]);

    // Cinsiyet filtresi değişince listeyi sıfırla
    useEffect(() => {
        setCurrentIndex(0);
        fetchShopItems();
    }, [genderFilter, fetchShopItems]);

    const advance = (direction: 'left' | 'right', type: 'save' | 'skip') => {
        if (swipedCount >= DAILY_LIMIT) return;

        setExitVariant(direction === 'right' ? 'exitRight' : 'exitLeft');
        setDragOffset(0);

        const activeItem = items[currentIndex];
        if (activeItem) markSeen(activeItem.id);

        const nextCount = swipedCount + 1;
        setSwipedCount(nextCount);
        localStorage.setItem('dailySwipedCount', nextCount.toString());

        if (type === 'save' && activeItem) {
            const token = localStorage.getItem('token');
            fetch(`${API_URL}/wardrobe/items`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeItem.category,
                    brand: activeItem.brand,
                    imageUrl: activeItem.imageUrl,
                }),
            })
                .then(r => {
                    if (r.ok) {
                        showToast('Gardıroba eklendi! Yönlendiriliyorsunuz...');
                        setTimeout(() => navigate('/wardrobe'), 1800);
                    }
                })
                .catch(() => showToast('Hata: Arşive eklenemedi.'));
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
            localStorage.removeItem('seenItemIds');
            setItems(CURATED_CATALOG);
            setCurrentIndex(0);
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleLink = () => {
        const activeItem = items[currentIndex];
        if (!activeItem?.productUrl || !isProductUrlValid(activeItem.productUrl)) {
            showToast('Özel Arşiv Parçası', 'info');
            return;
        }
        window.open(activeItem.productUrl, '_blank', 'noopener,noreferrer');
    };

    const progress = Math.min((swipedCount / DAILY_LIMIT) * 100, 100);

    return (
        <div className="min-h-screen pt-20 pb-48 px-6 lg:px-20 relative overflow-x-hidden font-sans select-none">
            {/* Animated Blob Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#FAF7F2] to-[#F3EEE7]">
                <motion.div
                    animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-[25%] -left-[15%] w-[65%] h-[65%] rounded-full bg-rose-200/20 blur-[180px]"
                />
                <motion.div
                    animate={{ x: [0, -35, 0], y: [0, 35, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
                    className="absolute -bottom-[20%] -right-[15%] w-[55%] h-[55%] rounded-full bg-amber-200/15 blur-[160px]"
                />
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-5">
                            <span className="w-10 h-[1px] bg-black opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Style Discovery</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-7xl lg:text-8xl font-serif font-light leading-none tracking-tight text-gray-900">
                            Keşfet<span className="italic font-normal text-gray-400">mek.</span>
                        </motion.h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:block px-6 py-3 bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm min-w-[160px]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Günlük Limit</span>
                                <span className="text-xs font-serif italic text-gray-700">{swipedCount}/{DAILY_LIMIT}</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-black rounded-full" animate={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <button onClick={openMenu} className="w-14 h-14 bg-white border border-gray-100 rounded-[1.8rem] flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                            <Menu size={20} className="text-gray-900" />
                        </button>

                        <div className="bg-gray-100/60 p-1.5 rounded-[1.8rem] backdrop-blur-md flex shadow-inner">
                            <button onClick={() => setView('discover')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'discover' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}>
                                Keşfet
                            </button>
                            <button onClick={() => setView('editorial')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'editorial' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}>
                                Editöryal
                            </button>
                        </div>
                    </div>
                </header>

                {/* Cinsiyet Filtresi */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-12"
                >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mr-2">Filtrele</span>
                    {(['Tümü', 'Kadın', 'Erkek'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGenderFilter(g)}
                            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                genderFilter === g
                                    ? g === 'Kadın' ? 'bg-rose-500 text-white shadow-lg'
                                    : g === 'Erkek' ? 'bg-sky-600 text-white shadow-lg'
                                    : 'bg-black text-white shadow-lg'
                                    : 'bg-white/80 text-gray-400 border border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            {g === 'Kadın' ? '♀️ Kadın' : g === 'Erkek' ? '♂️ Erkek' : 'Hepsi'}
                        </button>
                    ))}
                </motion.div>

                {/* Main View */}
                {view === 'discover' ? (
                    <div className="relative flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            {swipedCount >= DAILY_LIMIT ? (
                                <motion.div key="limit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-[400px] bg-white/70 backdrop-blur-3xl rounded-[4rem] border border-white p-14 flex flex-col items-center text-center">
                                    <Lock className="text-gray-200 mb-8" size={56} strokeWidth={1} />
                                    <h3 className="text-4xl font-serif text-gray-900 mb-4 leading-tight">
                                        Günlük Seçki<br /><span className="italic text-gray-400">Tamamlandı.</span>
                                    </h3>
                                    <p className="text-gray-400 font-serif italic text-base mb-10">Kürasyonumuz bugünlük bu kadar.</p>
                                    <button onClick={() => { localStorage.removeItem('dailySwipedCount'); setSwipedCount(0); }} className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors">
                                        Yeni Seçki Başlat
                                    </button>
                                </motion.div>

                            ) : isLoading ? (
                                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
                                    <div className="w-full max-w-[400px] aspect-[3/4.5] bg-white rounded-[4rem] border-8 border-white shadow-[0_40px_80px_rgba(0,0,0,0.08)] overflow-hidden p-2" />
                                </motion.div>

                            ) : currentItem ? (
                                <motion.div
                                    key={currentItem.id}
                                    variants={cardVariants}
                                    initial="enter"
                                    animate="center"
                                    exit={exitVariant}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.8}
                                    onDrag={(_, info) => setDragOffset(info.offset.x)}
                                    onDragEnd={(_, info) => {
                                        setDragOffset(0);
                                        if (info.offset.x > 90) advance('right', 'save');
                                        else if (info.offset.x < -90) advance('left', 'skip');
                                    }}
                                    className="relative z-10 w-full max-w-[400px] aspect-[3/4.5] bg-white rounded-[4rem] overflow-hidden cursor-grab active:cursor-grabbing border-8 border-white p-2 shadow-[0_50px_100px_rgba(0,0,0,0.10)] select-none"
                                >
                                    <div className="w-full h-full rounded-[3.2rem] overflow-hidden relative">
                                        <img
                                            src={currentItem.imageUrl}
                                            className="w-full h-full object-cover"
                                            alt={currentItem.title}
                                            draggable={false}
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                // İlk hata: kategori fallback'ine geç
                                                const fallback = getCategoryFallback(currentItem.category);
                                                if (img.src !== fallback) {
                                                    img.src = fallback;
                                                } else {
                                                    // İkinci hata: evrensel yedek
                                                    img.onerror = null;
                                                    img.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80';
                                                }
                                            }}
                                        />

                                        {/* Overlay Swipe Color Animation */}
                                        <AnimatePresence>
                                            {dragOffset > 40 && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: Math.min(dragOffset / 200, 0.6) }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center rounded-[3.2rem]">
                                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                        <Heart size={40} className="text-emerald-500" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <AnimatePresence>
                                            {dragOffset < -40 && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: Math.min(Math.abs(dragOffset) / 200, 0.6) }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-500/30 flex items-center justify-center rounded-[3.2rem]">
                                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                        <X size={40} className="text-red-500" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Overlay details */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/50">{currentItem.brand}</span>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    currentItem.gender === 'Kadın'
                                                        ? 'bg-rose-400/40 text-rose-100'
                                                        : 'bg-sky-400/40 text-sky-100'
                                                }`}>{currentItem.gender}</span>
                                            </div>
                                            <h2 className="text-4xl font-serif font-light leading-tight mb-6 select-none tracking-tight">{currentItem.title}</h2>

                                            <div className="flex gap-3">
                                                <button onClick={() => advance('left', 'skip')} className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 flex items-center justify-center hover:bg-red-500/30 hover:border-red-400/30 transition-all active:scale-95">
                                                    <X size={20} />
                                                </button>

                                                <button
                                                    onClick={handleLink}
                                                    disabled={!isProductUrlValid(currentItem.productUrl)}
                                                    className={`flex-1 h-14 backdrop-blur-2xl rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95 ${isProductUrlValid(currentItem.productUrl)
                                                            ? 'bg-white/10 hover:bg-white/20'
                                                            : 'bg-white/5 opacity-40 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <ShoppingBag size={14} />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">
                                                        {isProductUrlValid(currentItem.productUrl) ? 'Siteye Git' : 'Özel Arşiv'}
                                                    </span>
                                                    {isProductUrlValid(currentItem.productUrl) && <ArrowRight size={12} className="opacity-60" />}
                                                </button>

                                                <button onClick={() => advance('right', 'save')} className="flex-[1.5] h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all shadow-xl">
                                                    <Heart size={16} />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Arşive Al</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center gap-6 py-20">
                                    <Sparkles className="text-gray-200" size={56} strokeWidth={1} />
                                    <p className="font-serif italic text-gray-400 text-2xl">Tüm parçalar keşfedildi.</p>
                                    <button onClick={() => { localStorage.removeItem('seenItemIds'); fetchShopItems(); }} className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all">
                                        Yeniden Başlat
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isLoading && currentItem && swipedCount < DAILY_LIMIT && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 text-[10px] font-bold uppercase tracking-widest text-gray-300 select-none">
                                {items.length - currentIndex - 1 > 0 ? `${items.length - currentIndex - 1} parça daha var` : 'Son parça'}
                            </motion.p>
                        )}
                    </div>
                ) : (
                    /* ── Editorial View ── */
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 select-none">
                        {editorialContent ? (
                            <div className="space-y-12">
                                <div className="bg-white/50 backdrop-blur-3xl rounded-[5rem] p-14 lg:p-20 border border-white/70 relative overflow-hidden">
                                    <div className="max-w-4xl">
                                        <div className="flex items-center gap-5 mb-10">
                                            <span className="w-10 h-[1px] bg-indigo-200" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-indigo-400">Editorial · {new Date().getFullYear()}</span>
                                        </div>
                                        <h2 className="text-7xl lg:text-[9rem] font-serif font-light text-gray-900 leading-[0.85] mb-12 tracking-tight">
                                            {editorialContent.headline ? editorialContent.headline : "Mevsimsiz Yansımalar."}
                                        </h2>
                                        <p className="text-3xl lg:text-4xl font-serif italic text-gray-600 leading-[1.4] border-l-4 border-black/5 pl-10 py-3">
                                            "{editorialContent.article}"
                                        </p>
                                    </div>
                                </div>

                                {(editorialContent.recommendations || []).length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {editorialContent.recommendations.map((rec: any, i: number) => (
                                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-50 flex flex-col justify-between hover:-translate-y-3 transition-all duration-600 group h-[420px] shadow-sm">
                                                <div>
                                                    <div className="flex justify-between items-center mb-8">
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-300">
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-500">
                                                            <Plus size={16} />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-3xl font-serif text-gray-900 mb-5 leading-tight group-hover:italic transition-all">
                                                        {rec.focus}
                                                    </h3>
                                                    <p className="text-gray-400 font-serif italic text-base leading-relaxed">
                                                        {rec.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-black/40">
                                                    <ShoppingBag size={13} />
                                                    Bu Stili Keşfet
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-32 gap-6">
                                <Sparkles className="animate-pulse text-indigo-200" size={48} />
                                <p className="font-serif italic text-gray-400 text-xl">Editöryal içerik hazırlanıyor...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscoverPage;
