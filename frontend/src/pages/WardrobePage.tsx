import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Heart, Bookmark, RefreshCw,
    Sparkles, TrendingUp, Menu, Package, PlusCircle, User, X,
    Wand2, ShoppingBag, Flame, Zap, Shirt, Loader2
} from 'lucide-react';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';
import { getImageUrl, API_URL } from '../config';
import { AddItemModal } from '../components/wardrobe/AddItemModal';

const CATEGORIES = ['Hepsi', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

const CITIES = [
    { city: 'New York', style: 'Güneşli Elegance', temp: 22, color: 'from-amber-500/20 to-orange-900/40', accent: 'text-amber-200' },
    { city: 'Paris', style: 'Romantik Minimalizm', temp: 18, color: 'from-rose-500/20 to-pink-900/40', accent: 'text-rose-200' },
    { city: 'Tokyo', style: 'Neon Avant-Garde', temp: 24, color: 'from-purple-500/20 to-indigo-900/40', accent: 'text-purple-200' },
    { city: 'Milan', style: 'Klasik İhtişam', temp: 26, color: 'from-emerald-500/20 to-green-900/40', accent: 'text-emerald-200' },
];

const WardrobePage: React.FC = () => {
    const { fetchItems, deleteItem, items } = useWardrobeStore();

    const { openMenu, showToast } = useUIStore();
    const [searchTerm, setSearchTerm]         = useState('');
    const [activeCategory, setActiveCategory] = useState('Hepsi');
    
    const [selectedItem, setSelectedItem]     = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userGender, setUserGender]         = useState<'Erkek' | 'Kadın'>('Erkek');
    
    // Luxury UX states
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [outfitItems, setOutfitItems] = useState<any[]>([]);
    const [isOutfitBuilderOpen, setIsOutfitBuilderOpen] = useState(false);
    
    const [isAIFullscreen, setIsAIFullscreen] = useState(false);
    const [cityIdx, setCityIdx] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetchItems();
        
        const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        
        const interval = setInterval(() => {
            setCityIdx((prev) => (prev + 1) % CITIES.length);
        }, 6000);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
        };
    }, []);

    const stats = useMemo(() => {
        const total = items.length;
        if (total === 0) return { total: 0, label: 'Boş Arşiv' };
        const label = total > 15 ? 'Avant-Garde' : total > 5 ? 'Capsule' : 'Minimalist';
        return { total, label };
    }, [items]);

    const categoryCount = (cat: string) =>
        cat === 'Hepsi' ? items.length : items.filter(i => i.category === cat).length;

    const filteredItems = items.filter(item => {
        const q = searchTerm.toLowerCase();
        const matchSearch = !q ||
            item.brand?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q);
        const matchCat = activeCategory === 'Hepsi' || item.category === activeCategory;
        return matchSearch && matchCat;
    });

    const handleAdd = () => setIsAddModalOpen(true);
    const handleDelete = async (id: string) => {
        await deleteItem(id);
        setSelectedItem(null);
        setTryOnResult(null);
        showToast('Parça arşivden çıkarıldı.');
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) newFavs.delete(id);
        else newFavs.add(id);
        setFavorites(newFavs);
    };

    const addToOutfit = (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        if (!outfitItems.find(i => i.id === item.id)) {
            setOutfitItems([...outfitItems, item]);
            setIsOutfitBuilderOpen(true);
            showToast('Kombine eklendi!');
        }
    };

    const removeFromOutfit = (id: string) => {
        setOutfitItems(outfitItems.filter(i => i.id !== id));
        if (outfitItems.length === 1) setIsOutfitBuilderOpen(false);
    };

    // Gamification & AI Data
    const dominantStyle = items.length > 5 ? 'Minimalist' : 'Casual';
    const stylePercentage = items.length > 5 ? 88 : 60;
    const styleScore = 85;
    const dailyStreak = 12;

    const activeCity = CITIES[cityIdx];

    // Virtual Try-On
    const [tryOnLoading, setTryOnLoading] = useState(false);
    const [tryOnResult, setTryOnResult] = useState<{ imageUrl: string | null; error?: string; mock?: boolean; model?: string } | null>(null);
    const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
    const [tryOnFullscreen, setTryOnFullscreen] = useState(false);
    const [tryOnStep, setTryOnStep] = useState(0);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setSelfieDataUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleTryOn = async (item: any) => {
        if (!selfieDataUrl) { showToast('Önce bir fotoğraf seç!'); return; }
        const garmentImageUrl = item.photos?.[0]?.url
            ? getImageUrl(item.photos[0].url, item.category)
            : null;
        if (!garmentImageUrl) { showToast('Bu kıyafetin fotoğrafı bulunamadı.'); return; }

        setTryOnLoading(true);
        setTryOnResult(null);
        setTryOnStep(0);

        const stepInterval = setInterval(() => {
            setTryOnStep(s => s < 3 ? s + 1 : s);
        }, 8000);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/try-on`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personImageUrl: selfieDataUrl,
                    garmentImageUrl,
                    category: item.category,
                    brand: item.brand || undefined,
                })
            });
            const data = await res.json();
            setTryOnResult(data);
            if (data.imageUrl) setTryOnFullscreen(true);
        } catch {
            showToast('Try-On başarısız oldu.');
        } finally {
            clearInterval(stepInterval);
            setTryOnLoading(false);
        }
    };

    // AI Outfit Logic
    const [aiOutfitCards, setAiOutfitCards] = useState<any[]>([]);
    const [aiExplanation, setAiExplanation] = useState<string>('');
    
    const generateOutfit = () => {
        if (items.length === 0) return;
        
        // Show skeleton/loading state
        setAiOutfitCards([]);
        setAiExplanation("AI Stilist dolabını analiz ediyor ve sana özel bir kombin seçiyor...");
        
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/ai/generate-outfit-from-list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ items, city: activeCity.city, style: activeCity.style, gender: userGender })
        })
        .then(r => r.json())
        .then(data => {
            if(data.outfitIds) {
                const selected = data.outfitIds.map((id: string) => items.find(i => i.id === id)).filter(Boolean);
                setAiOutfitCards(selected);
            }
            if(data.explanation) setAiExplanation(data.explanation);
        })
        .catch(err => {
            // Fallback if AI server fails
            const tops = items.filter(i => i.category === 'Üst Giyim');
            const bottoms = items.filter(i => i.category === 'Alt Giyim');
            const shoes = items.filter(i => i.category === 'Ayakkabı' || i.category === 'Dış Giyim' || i.category === 'Aksesuar');
            const top = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : items[Math.floor(Math.random() * items.length)];
            const bottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : items[Math.floor(Math.random() * items.length)];
            const shoe = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : items[Math.floor(Math.random() * items.length)];
            
            const outfit = [top, bottom, shoe].filter(Boolean);
            const unique = Array.from(new Map(outfit.map(item => [item.id, item])).values());
            setAiOutfitCards(unique.slice(0, 3));
            setAiExplanation(`Dolabını analiz ettim. Özellikle seçtiğim bu kombin, ${activeCity.style} aurasının dinamiklerini kusursuz taşıyor.`);
        });
    };

    useEffect(() => {
        if (items.length > 0 && aiOutfitCards.length === 0) {
            generateOutfit();
        }
    }, [items, aiOutfitCards.length]);

    return (
        <div className="min-h-screen pt-24 pb-48 px-4 lg:px-12 relative overflow-x-hidden bg-[#FDFBF7] text-gray-900 cursor-default">
            
            {/* ── Custom Cursor ── */}
            <motion.div 
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#5a1e2a]/40 pointer-events-none z-[9999] hidden lg:flex items-center justify-center mix-blend-difference"
                animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
                transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            >
                <div className="w-1.5 h-1.5 bg-[#5a1e2a] rounded-full" />
            </motion.div>

            {/* ── Background Depth Layers ── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-900/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-stone-300/30 rounded-full blur-[160px]" />
                {/* Subtle Noise */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            </div>

            <div className="max-w-[1700px] mx-auto relative z-10">
                
                {/* ── Header ── */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <motion.div initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <h1 className="text-[48px] lg:text-[72px] font-serif font-light tracking-tight text-gray-900 leading-[0.9]">
                            Gardırop<span className="text-[#5a1e2a] italic">.</span>
                        </h1>
                        <p className="text-sm lg:text-lg font-serif italic text-gray-500 mt-4 tracking-wide flex items-center gap-2">
                            <Sparkles size={14} className="text-[#5a1e2a]" /> Your luxury AI-powered wardrobe
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex items-center gap-4 lg:gap-6">
                        <div className="hidden lg:flex items-center bg-white/60 backdrop-blur-xl border border-white/80 rounded-full p-1.5 shadow-sm hover:shadow-md transition-all group">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a1e2a] transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Koleksiyonda ara..." 
                                    className="w-48 lg:w-72 pl-12 pr-4 py-2.5 bg-transparent text-sm outline-none font-serif italic placeholder:text-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <button onClick={() => setIsOutfitBuilderOpen(!isOutfitBuilderOpen)} className="hidden lg:flex items-center gap-2 px-8 py-3.5 bg-white/60 backdrop-blur-xl border border-white/80 hover:border-[#5a1e2a]/50 text-gray-800 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-lg group">
                            <Wand2 size={16} className="text-[#5a1e2a] group-hover:rotate-12 transition-transform" />
                            Stüdyo
                        </button>

                        <button onClick={handleAdd} className="px-8 py-3.5 bg-[#1a1a1a] text-white rounded-full flex items-center gap-3 hover:bg-[#5a1e2a] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(90,30,42,0.3)] text-sm font-medium group">
                            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                            Yeni Parça
                        </button>
                        
                        <button className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center border border-white/80 overflow-hidden shadow-sm hover:scale-105 transition-transform">
                            <User size={18} className="text-[#5a1e2a]" />
                        </button>
                    </motion.div>
                </header>

                {/* ── Gamification & AI Dashboard ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mb-20">
                    
                    {/* Left: Gamification & Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-4 bg-white/50 backdrop-blur-2xl rounded-[2.5rem] p-8 lg:p-10 border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-[22px] font-serif font-medium tracking-wide">Stil Profili</h2>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                                    <Flame size={14} fill="currentColor" /> {dailyStreak} Gün Serisi
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                {/* Style Score */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Stil Skoru</span>
                                        <span className="text-2xl font-serif text-[#5a1e2a]">{styleScore}<span className="text-sm text-gray-400">/100</span></span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200/50 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${styleScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-gray-800 to-[#5a1e2a]" />
                                    </div>
                                </div>

                                {/* Style Dominance */}
                                <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-serif italic text-gray-600">Baskın Aura</span>
                                        <span className="text-sm font-bold text-gray-900">{stylePercentage}% {dominantStyle}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10 pt-6">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Koleksiyon</p>
                                        <p className="text-4xl font-serif font-light">{stats.total} <span className="text-sm italic text-gray-400 font-serif">parça</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Dynamic Hero AI Carousel */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-8 bg-[#0a0a0a] text-white rounded-[2.5rem] p-8 lg:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col justify-between min-h-[400px] group cursor-pointer"
                        onClick={() => setIsAIFullscreen(true)}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeCity.city}
                                initial={{ opacity: 0, scale: 1.1 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.9 }} 
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className={`absolute inset-0 bg-gradient-to-br ${activeCity.color} opacity-50 mix-blend-screen`} 
                            />
                        </AnimatePresence>
                        
                        {/* Animated Mesh Blobs */}
                        <motion.div 
                            animate={{ x: [0, 50, 0], y: [0, -50, 0] }} 
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-tr ${activeCity.color} rounded-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none`}
                        />
                        <motion.div 
                            animate={{ x: [0, -50, 0], y: [0, 50, 0] }} 
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className={`absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-gradient-to-bl ${activeCity.color} rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none`}
                        />
                        
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 pointer-events-none mix-blend-overlay" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-8">
                                <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-mono uppercase tracking-[0.3em] border border-white/10 flex items-center gap-2">
                                    <Zap size={12} className={activeCity.accent} /> Style Oracle
                                </span>
                                <AnimatePresence mode="wait">
                                    <motion.span key={activeCity.city} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-[12px] font-mono text-white/50 tracking-wider">
                                        {activeCity.city} · {activeCity.temp}°C
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div key={activeCity.city} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.6 }} className="max-w-2xl">
                                    <h3 className="text-4xl lg:text-[56px] font-serif leading-[1.1] mb-6 tracking-tight text-white font-light">
                                        {activeCity.style}
                                    </h3>
                                    <p className="text-lg text-white/60 font-serif italic max-w-xl leading-relaxed">
                                        Şehrin aurası senin dolabınla birleştiğinde ortaya çıkacak muhteşem kombinleri görmek için dokun.
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex items-center justify-between mt-12">
                                <div className="flex items-center gap-4">
                                    <button 
                                        className="flex items-center gap-3 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full text-sm font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105"
                                        onClick={(e) => { e.stopPropagation(); setIsAIFullscreen(true); }}
                                    >
                                        <Wand2 size={18} />
                                        Bugün Ne Giysem?
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setUserGender(userGender === 'Erkek' ? 'Kadın' : 'Erkek'); }}
                                        className="px-5 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[11px] font-mono uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                                        title="Kombin cinsiyetini değiştir"
                                    >
                                        <User size={14} /> {userGender}
                                    </button>
                                </div>
                                
                                <div className="flex gap-2">
                                    {CITIES.map((c, i) => (
                                        <div key={c.city} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === cityIdx ? 'bg-white w-6' : 'bg-white/30'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Filters ── */}
                <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar mb-10 pb-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-8 py-3.5 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 ${
                                activeCategory === cat
                                    ? 'bg-[#1a1a1a] text-white shadow-xl scale-105'
                                    : 'bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black'
                            }`}
                        >
                            {cat} <span className="ml-2 opacity-40 font-sans">{categoryCount(cat)}</span>
                        </button>
                    ))}
                </div>

                {/* ── Asymmetric Grid ── */}
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="w-32 h-32 bg-white/60 backdrop-blur-xl rounded-full shadow-sm flex items-center justify-center mb-8 border border-white/80">
                            <Package size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-4xl font-serif text-gray-900 mb-4 font-light">Koleksiyon Boş</h3>
                        <p className="text-gray-500 font-serif italic text-lg mb-10 max-w-md">
                            Lüks gardırobunu oluşturmaya başlamak için ilk imza parçanı ekle.
                        </p>
                        <button onClick={handleAdd} className="px-10 py-4 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#5a1e2a] transition-all shadow-xl hover:shadow-2xl">
                            Parça Ekle
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10 auto-rows-[minmax(350px,auto)]">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, index) => {
                                // Dynamic grid layout (every 5th item is large)
                                const isFeatured = index % 5 === 0;
                                
                                return (
                                    <motion.div
                                        layoutId={`card-${item.id}`}
                                        key={item.id}
                                        initial={{ opacity: 0, y: 80, rotateX: -20, scale: 0.9, z: -100 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, z: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                                        transition={{ delay: index * 0.1, duration: 0.8, type: "spring", stiffness: 100, damping: 20 }}
                                        className={`group cursor-pointer flex flex-col ${isFeatured ? 'lg:col-span-2 lg:row-span-2' : 'col-span-1'} relative perspective-[1000px]`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                        draggable
                                        onDragStart={(e: any) => { e.dataTransfer.setData('item', JSON.stringify(item)); setIsOutfitBuilderOpen(true); }}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className={`w-full ${isFeatured ? 'h-[400px] lg:h-[calc(100%-4rem)]' : 'aspect-[3/4]'} rounded-[2rem] overflow-hidden bg-stone-100 relative shadow-sm group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out border border-white/50`}>
                                            <motion.img
                                                layoutId={`image-${item.id}`}
                                                src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                                alt={item.brand}
                                            />
                                            
                                            {/* X-Ray Style DNA Frosted Glass Overlay */}
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex items-center justify-center overflow-hidden">
                                                {/* Scanline Animation */}
                                                <motion.div 
                                                    className="absolute inset-x-0 h-[1px] bg-[#E5C158] shadow-[0_0_20px_2px_#E5C158] opacity-0 group-hover:opacity-100"
                                                    initial={{ top: "-10%" }}
                                                    whileHover={{ top: "110%" }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                />
                                                <div className="p-6 text-center transform translate-y-8 group-hover:translate-y-0 transition-all duration-700 delay-75">
                                                    <p className="text-[#E5C158] text-[10px] font-mono uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-2">
                                                        <Wand2 size={12} /> Stil DNA
                                                    </p>
                                                    <div className="space-y-5 font-mono text-[11px] text-white/90 uppercase tracking-widest flex flex-col items-center">
                                                        <div className="flex items-center gap-3"><Package size={14} className="text-[#E5C158]" /> Doku: {item.fabric || 'İpek/Keten'}</div>
                                                        <div className="flex items-center gap-3"><Zap size={14} className="text-[#E5C158]" /> Uyum: %94</div>
                                                        <div className="flex items-center gap-3"><Flame size={14} className="text-[#E5C158]" /> Aura: {item.category || 'Premium'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Micro-interactions Overlay */}
                                            <div className="absolute right-4 top-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-30">
                                                <button onClick={(e) => toggleFavorite(e, item.id)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white text-gray-700 shadow-lg transition-transform hover:scale-110 active:scale-95">
                                                    <Heart size={18} className={favorites.has(item.id) ? 'fill-[#5a1e2a] text-[#5a1e2a]' : ''} />
                                                </button>
                                                <button onClick={(e) => addToOutfit(e, item)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white text-gray-700 shadow-lg transition-transform hover:scale-110 active:scale-95">
                                                    <PlusCircle size={18} />
                                                </button>
                                            </div>

                                            {/* Luxury Bottom Gradient */}
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-6 lg:p-8 z-20 pointer-events-none">
                                                <p className="text-white/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">{item.category}</p>
                                                <h3 className="text-white font-serif text-2xl lg:text-3xl leading-none transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-150">{item.brand || 'Premium Parça'}</h3>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-5 px-2 flex justify-between items-start">
                                            <div>
                                                <h3 className="text-base font-medium text-gray-900 leading-tight">{item.brand || 'İsimsiz Parça'}</h3>
                                                <p className="text-[12px] text-gray-400 mt-1.5 font-mono uppercase tracking-widest">{item.category}</p>
                                            </div>
                                            {isFeatured && <span className="px-3 py-1 bg-black text-white text-[10px] font-mono uppercase tracking-widest rounded-full">Featured</span>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Apple-Style Fullscreen Item Detail Expansion ── */}
            {createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div 
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-0 lg:p-12 overflow-hidden"
                        >
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-white/70 backdrop-blur-2xl"
                            onClick={() => setSelectedItem(null)}
                        />
                        <motion.div 
                            layoutId={`card-${selectedItem.id}`}
                            className="relative w-full h-full lg:max-w-7xl lg:max-h-[85vh] bg-[#FDFBF7] lg:rounded-[3rem] shadow-2xl overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row z-10"
                        >
                            {/* Left: Huge Image */}
                            <div className="w-full h-[60vh] lg:w-1/2 lg:h-full relative">
                                <motion.img 
                                    layoutId={`image-${selectedItem.id}`}
                                    src={getImageUrl(selectedItem.photos?.[0]?.url, selectedItem.category)}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] lg:bg-none to-transparent lg:hidden" />
                            </div>
                            
                            {/* Right: AI Analysis & Details */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                                className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col relative bg-[#FDFBF7]"
                            >
                                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 lg:top-10 lg:right-10 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 hover:rotate-90 transition-all z-20">
                                    <X size={20} />
                                </button>

                                <div className="mt-4 lg:mt-10 flex-1 overflow-y-auto hide-scrollbar pr-4">
                                    <p className="text-gray-400 uppercase tracking-[0.3em] text-[11px] font-mono mb-4">{selectedItem.category}</p>
                                    <h2 className="text-5xl lg:text-7xl font-serif mb-12 tracking-tight text-gray-900 leading-none">{selectedItem.brand || 'İmza Parça'}</h2>
                                    
                                    <div className="space-y-12">
                                        {/* AI Analysis Block */}
                                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#5a1e2a]" />
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-[#5a1e2a]">
                                                <Sparkles size={14} /> Style Oracle Analizi
                                            </h4>
                                            <p className="text-gray-600 leading-relaxed font-serif text-lg italic">
                                                "Bu parça senin %{stylePercentage} oranındaki {dominantStyle} auranla kusursuz bir frekans yakalıyor. 
                                                Kumaş dokusu ve kalıbı, gardırobundaki diğer {Math.max(1, items.length - 1)} parçayla kolayca entegre olarak premium bir duruş sergiliyor."
                                            </p>
                                            <div className="mt-6 flex items-center gap-4">
                                                <span className="px-4 py-1.5 bg-[#5a1e2a]/10 text-[#5a1e2a] rounded-full text-[10px] font-mono uppercase tracking-widest font-bold">
                                                    %94 Uyum Skoru
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Virtual Try-On */}
                                        <div className="pt-8 border-t border-gray-200">
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2 text-[#5a1e2a]">
                                                <Shirt size={14}/> AI Virtual Try-On
                                            </h4>

                                            {/* Step 1: Selfie */}
                                            <div className="flex gap-4 mb-5">
                                                <div
                                                    onClick={() => selfieInputRef.current?.click()}
                                                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#5a1e2a] hover:bg-[#5a1e2a]/5 transition-all shrink-0 overflow-hidden"
                                                >
                                                    {selfieDataUrl ? (
                                                        <img src={selfieDataUrl} className="w-full h-full object-cover" alt="selfie" />
                                                    ) : (
                                                        <>
                                                            <User size={22} className="text-gray-300 mb-1" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 text-center leading-tight">Fotoğraf<br/>Seç</span>
                                                        </>
                                                    )}
                                                </div>
                                                <input ref={selfieInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelfieChange} />

                                                <div className="flex-1 flex flex-col justify-center gap-2">
                                                    <p className="text-[11px] font-bold text-gray-700">Kendi fotoğrafını yükle</p>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                                        Tam vücut veya üst beden fotoğrafın en iyi sonucu verir. Sade arka plan tercih edilir.
                                                    </p>
                                                    {selfieDataUrl && (
                                                        <button onClick={() => setSelfieDataUrl(null)} className="text-[9px] text-red-400 font-bold uppercase tracking-widest text-left">
                                                            × Kaldır
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Generate button */}
                                            <button
                                                onClick={() => handleTryOn(selectedItem)}
                                                disabled={tryOnLoading || !selfieDataUrl}
                                                className="w-full py-4 bg-gradient-to-r from-[#1a1a1a] to-[#5a1e2a] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-40 shadow-lg"
                                            >
                                                {tryOnLoading ? (
                                                    <><Loader2 size={16} className="animate-spin" /> Try-On AI çalışıyor (~60sn)...</>
                                                ) : (
                                                    <><Sparkles size={16} /> Üzerimde Nasıl Görünür?</>
                                                )}
                                            </button>

                                            {/* Result */}
                                            {tryOnResult && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                                                    {tryOnResult.imageUrl ? (
                                                        <img
                                                            src={tryOnResult.imageUrl}
                                                            alt="Virtual try-on result"
                                                            className="w-full rounded-2xl object-cover shadow-2xl border border-white"
                                                            style={{ maxHeight: '520px', objectPosition: 'top' }}
                                                        />
                                                    ) : selfieDataUrl ? (
                                                        /* Demo composite preview */
                                                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white bg-gray-50">
                                                            <img src={selfieDataUrl} alt="person" className="w-full object-cover" style={{ maxHeight: '480px', objectPosition: 'top center' }} />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                            {selectedItem?.photos?.[0]?.url && (
                                                                <div className="absolute inset-x-0 bottom-0 top-1/4 flex items-center justify-center">
                                                                    <img
                                                                        src={getImageUrl(selectedItem.photos[0].url, selectedItem.category)}
                                                                        alt="garment"
                                                                        className="h-48 object-contain opacity-75 mix-blend-multiply drop-shadow-2xl"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-3 left-3 px-3 py-1.5 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                Space Uyku Modunda
                                                            </div>
                                                            <div className="absolute bottom-4 inset-x-4 text-center">
                                                                <p className="text-white text-[10px] font-black uppercase tracking-wider">
                                                                    HuggingFace Space uyandırılıyor — tekrar dene
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-8 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-4">
                                                <button onClick={() => handleDelete(selectedItem.id)} className="w-14 h-14 border border-gray-200 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-all ml-auto">
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

            {/* ── WOW MOMENT: Fullscreen AI Experience ── */}
            {createPortal(
                <AnimatePresence>
                    {isAIFullscreen && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-0 z-[99999] flex flex-col bg-[#050505] overflow-y-auto hide-scrollbar"
                        >
                            {/* Cinematic Backgrounds */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.05] pointer-events-none fixed" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="fixed -top-[20%] -left-[10%] w-[1000px] h-[1000px] bg-[#5a1e2a]/40 rounded-full blur-[200px] pointer-events-none" />
                            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="fixed -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-amber-900/30 rounded-full blur-[150px] pointer-events-none" />
                            
                            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto px-6 py-20">
                            
                            <motion.button 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                                onClick={() => setIsAIFullscreen(false)}
                                className="absolute top-10 right-10 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all border border-white/10 z-50"
                            >
                                <X size={24} />
                            </motion.button>

                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }} className="text-center w-full">
                                <Sparkles size={40} className="text-amber-200/80 mx-auto mb-10 animate-pulse" />
                                <h2 className="text-5xl md:text-7xl lg:text-[100px] font-serif text-white mb-8 italic tracking-tight font-light leading-none">
                                    Senin İçin <br/>Tasarlandı.
                                </h2>
                                <p className="text-xl lg:text-3xl text-white/60 font-serif mb-20 max-w-3xl mx-auto leading-relaxed font-light">
                                    Bugün {activeCity.city} havası var. {activeCity.style} tarzını yansıtacak, özgüvenini artıracak kusursuz bir seçki hazırladım.
                                </p>
                            </motion.div>
                            
                            {aiOutfitCards.length > 0 && (
                                <motion.div 
                                    initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex flex-wrap justify-center items-center gap-6 lg:gap-10 w-full"
                                >
                                    {aiOutfitCards.map((it: any, i: number) => (
                                        <motion.div 
                                            key={i} 
                                            whileHover={{ y: -20, scale: 1.05 }} 
                                            className={`w-40 h-56 md:w-56 md:h-80 lg:w-72 lg:h-[400px] bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/20 p-2 lg:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group ${i === 1 ? 'lg:-translate-y-12' : ''}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-100 transition-all duration-700" />
                                            <img src={getImageUrl(it.photos?.[0]?.url, it.category)} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400'; }} className="w-full h-full object-cover rounded-[1.5rem] grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000" alt="ai-pick" />
                                            <div className="absolute bottom-6 inset-x-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                <span className="text-[10px] text-amber-200/80 font-mono tracking-[0.3em] uppercase block mb-1">Eşleşme: %9{8-i}</span>
                                                <h4 className="text-white font-serif text-xl lg:text-2xl">{it.brand || 'Seçim'}</h4>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* AI Reasoning & Action Bar */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1 }}
                                className="mt-16 w-full max-w-4xl mx-auto flex flex-col items-center"
                            >
                                {/* AI Reasoning Block */}
                                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 lg:p-8 rounded-[2rem] mb-10 flex flex-col md:flex-row items-start gap-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-200 to-amber-600" />
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                                        <Sparkles size={20} className="text-amber-200" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-serif text-xl mb-3 flex items-center gap-3">
                                            Style Oracle Kararı
                                            <span className="px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full text-[10px] font-mono tracking-widest uppercase">Güven Oranı: %98</span>
                                        </h4>
                                        <p className="text-white/70 font-serif italic text-base lg:text-lg leading-relaxed min-h-[80px]">
                                            "{aiOutfitCards[0] ? aiExplanation : "Analiz ediliyor..."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Purposeful Actions */}
                                <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
                                    <button 
                                        onClick={() => { 
                                            showToast('Bugün bu kombini giyiyorsun! Gardırop Streak +1 🔥'); 
                                            setIsAIFullscreen(false); 
                                        }}
                                        className="px-8 py-4 lg:px-10 lg:py-5 bg-white text-black rounded-full font-serif italic text-lg lg:text-xl hover:scale-105 hover:bg-amber-50 hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all flex items-center gap-3"
                                        title="Kombini giyildi olarak işaretle ve günlük serini artır."
                                    >
                                        <Flame size={20} className="text-orange-500" /> Bugün Bunu Giyeceğim
                                    </button>
                                    
                                    <button 
                                        onClick={() => {
                                            setOutfitItems(aiOutfitCards);
                                            setIsAIFullscreen(false);
                                            setIsOutfitBuilderOpen(true);
                                            showToast('Kombin Stüdyoya Aktarıldı!');
                                        }}
                                        className="px-6 py-4 lg:px-8 lg:py-5 bg-white/5 border border-white/20 text-white rounded-full font-serif italic text-lg hover:bg-white/10 transition-all flex items-center gap-3"
                                        title="Bu kombini daha sonra düzenlemek için Stüdyo'ya kaydet."
                                    >
                                        <Bookmark size={20} /> Stüdyoya Kaydet
                                    </button>

                                    <button 
                                        onClick={() => {
                                            generateOutfit();
                                            showToast('Alternatif kombin hesaplandı.');
                                        }}
                                        className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:rotate-180 transition-all duration-500 shadow-lg"
                                        title="Sana yeni bir kombin önerisi sunar."
                                    >
                                        <RefreshCw size={22} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}

            {/* ── Virtual Try-On Fullscreen ── */}
            {createPortal(
                <AnimatePresence>
                    {(tryOnLoading || tryOnFullscreen) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
                        >
                            {/* Ambient blobs */}
                            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -top-1/4 -left-1/4 w-[900px] h-[900px] bg-[#5a1e2a]/40 rounded-full blur-[200px] pointer-events-none" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 1 }} className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-indigo-900/30 rounded-full blur-[180px] pointer-events-none" />

                            {/* Close (only when result is ready) */}
                            {tryOnFullscreen && !tryOnLoading && (
                                <motion.button
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                    onClick={() => { setTryOnFullscreen(false); setTryOnResult(null); }}
                                    className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <X size={22} />
                                </motion.button>
                            )}

                            {/* LOADING STATE */}
                            {tryOnLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-10 px-6 text-center"
                                >
                                    {/* Spinning ring */}
                                    <div className="relative w-28 h-28">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#5a1e2a] border-r-[#5a1e2a]/40"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-3 rounded-full border border-transparent border-t-amber-400/50"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Shirt size={28} className="text-white/60" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-3xl lg:text-5xl font-serif text-white font-light tracking-tight mb-3">
                                            AI Oluşturuyor
                                        </h3>
                                        <p className="text-white/40 font-serif italic text-lg">Virtual Try-On AI çalışıyor...</p>
                                    </div>

                                    {/* Step indicators */}
                                    <div className="flex flex-col gap-3 w-full max-w-sm">
                                        {[
                                            { label: 'Görseller Yükleniyor', icon: '📤' },
                                            { label: 'Giysi Analiz Ediliyor', icon: '🔍' },
                                            { label: 'AI Üretiyor', icon: '✨' },
                                            { label: 'Sonuç Hazırlanıyor', icon: '🎨' },
                                        ].map((step, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0.2 }}
                                                animate={{ opacity: tryOnStep >= i ? 1 : 0.25 }}
                                                transition={{ duration: 0.5 }}
                                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${
                                                    tryOnStep >= i
                                                        ? 'bg-white/10 border-white/20 text-white'
                                                        : 'border-white/5 text-white/20'
                                                }`}
                                            >
                                                <span className="text-lg">{step.icon}</span>
                                                <span className="text-sm font-mono tracking-widest uppercase">{step.label}</span>
                                                {tryOnStep === i && tryOnLoading && (
                                                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
                                                )}
                                                {tryOnStep > i && (
                                                    <span className="ml-auto text-emerald-400 text-xs font-bold">✓</span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <p className="text-white/20 text-[11px] font-mono tracking-widest uppercase">~30-60 saniye sürebilir</p>
                                </motion.div>
                            )}

                            {/* RESULT STATE */}
                            {!tryOnLoading && tryOnFullscreen && tryOnResult?.imageUrl && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    className="relative flex flex-col lg:flex-row items-center gap-10 w-full max-w-5xl mx-auto px-6"
                                >
                                    {/* Result image */}
                                    <div className="relative flex-1 max-w-md w-full">
                                        <div className="absolute -inset-4 bg-gradient-to-br from-[#5a1e2a]/30 to-indigo-900/20 rounded-[3rem] blur-2xl" />
                                        <img
                                            src={tryOnResult.imageUrl}
                                            alt="Virtual Try-On Result"
                                            className="relative w-full rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/10 object-contain"
                                            style={{ maxHeight: '80vh', background: '#111' }}
                                        />
                                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                            <span>✓</span> {tryOnResult.model || 'IDM-VTON'}
                                        </div>
                                    </div>

                                    {/* Side panel */}
                                    <div className="flex flex-col gap-6 lg:max-w-xs w-full">
                                        <div>
                                            <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Virtual Try-On</p>
                                            <h3 className="text-3xl lg:text-4xl font-serif text-white font-light leading-tight">
                                                İşte böyle<br />görünürsün.
                                            </h3>
                                            <p className="text-white/50 font-serif italic mt-3 text-sm leading-relaxed">
                                                {tryOnResult.model || 'AI'} modeli senin fotoğrafını ve kıyafeti analiz ederek gerçekçi bir önizleme oluşturdu.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {/* Download */}
                                            <a
                                                href={tryOnResult.imageUrl}
                                                download="virtual-tryon.jpg"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all shadow-xl"
                                            >
                                                <span>⬇</span> İndir
                                            </a>

                                            {/* Retry */}
                                            <button
                                                onClick={() => {
                                                    setTryOnFullscreen(false);
                                                    setTryOnResult(null);
                                                    if (selectedItem) setTimeout(() => handleTryOn(selectedItem), 100);
                                                }}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-white/10 border border-white/20 text-white rounded-full font-medium text-sm hover:bg-white/15 transition-all"
                                            >
                                                <RefreshCw size={16} /> Tekrar Dene
                                            </button>

                                            {/* Close */}
                                            <button
                                                onClick={() => { setTryOnFullscreen(false); setTryOnResult(null); }}
                                                className="flex items-center justify-center gap-3 px-6 py-3.5 text-white/40 rounded-full text-sm hover:text-white/70 transition-all"
                                            >
                                                <X size={14} /> Kapat
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

            {/* ── Outfit Builder Drawer (Studio) ── */}
            {createPortal(
                <AnimatePresence>
                {isOutfitBuilderOpen && (
                    <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-white shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-40 p-6 lg:p-8"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const itemData = e.dataTransfer.getData('item');
                            if(itemData) {
                                const item = JSON.parse(itemData);
                                if (!outfitItems.find(i => i.id === item.id)) setOutfitItems([...outfitItems, item]);
                            }
                        }}
                    >
                        <div className="max-w-[1700px] mx-auto flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-serif font-medium flex items-center gap-3">
                                        <Wand2 size={24} className="text-[#5a1e2a]" /> Kombin Stüdyosu
                                    </h3>
                                    <p className="text-gray-500 font-serif italic text-sm mt-1">Parçaları sürükle ve kendi imza görünümünü yarat.</p>
                                </div>
                                <button onClick={() => setIsOutfitBuilderOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar min-h-[160px] p-4 bg-stone-50/50 rounded-3xl border border-dashed border-gray-300">
                                {outfitItems.length === 0 ? (
                                    <div className="w-full text-center text-gray-400 font-serif italic text-lg">
                                        Seçimlerini bekliyor...
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {outfitItems.map((item, idx) => (
                                            <motion.div key={item.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0, width: 0 }} transition={{ type: 'spring' }} className="relative w-28 h-40 shrink-0 rounded-2xl overflow-hidden border border-white shadow-lg group">
                                                <img src={getImageUrl(item.photos?.[0]?.url, item.category)} className="w-full h-full object-cover" alt="" />
                                                <button onClick={() => removeFromOutfit(item.id)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                                                    <X size={14} />
                                                </button>
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                    <span className="text-white text-[9px] font-mono uppercase tracking-widest">{item.category}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                            
                            {outfitItems.length > 0 && (
                                <div className="mt-6 flex justify-end">
                                    <button className="px-8 py-3.5 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#5a1e2a] transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(90,30,42,0.3)]">
                                        Görünümü Kaydet
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchItems()}
                editItem={null}
            />

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default WardrobePage;
