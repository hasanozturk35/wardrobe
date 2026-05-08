import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, X, ArrowUpRight, Calendar, ShoppingBag, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { API_URL } from '../config';

interface Product {
    id: string;
    title: string;
    brand: string;
    gender: 'Kadın' | 'Erkek' | 'Unisex';
    category: string;
    imageUrl: string;
    productUrl: string;
    price?: string;
    tag?: string;
}

const BRAND_SEARCH: Record<string, string> = {
    'Zara':       'https://www.zara.com/tr/tr/search?searchTerm=',
    'Mavi':       'https://www.mavi.com/arama?q=',
    'H&M':        'https://www2.hm.com/tr_tr/search-results.html?q=',
    'Bershka':    'https://www.bershka.com/tr/search?searchTerm=',
    'Pull&Bear':  'https://www.pullandbear.com/tr/search?searchTerm=',
    'DeFacto':    'https://www.defacto.com.tr/arama?q=',
    'LC Waikiki': 'https://www.lcwaikiki.com/tr-TR/search?q=',
    'Mango':      'https://shop.mango.com/tr/search?q=',
    'Mango Man':  'https://shop.mango.com/tr/search?q=',
};
const brandUrl = (brand: string, _gender: string, item: string) => {
    const base = BRAND_SEARCH[brand];
    const q = encodeURIComponent(item);
    return base ? `${base}${q}` : `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${item} satın al`)}`;
};

const CATALOG: Product[] = [
    // ─── Kadın ────────────────────────────────────────────────────────────────
    { id: 'k-01', title: 'Oversize Blazer',       brand: 'Zara',       gender: 'Kadın',  category: 'Dış Giyim', price: '1.299 ₺', tag: 'Trend',
      imageUrl: 'https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Zara', 'Kadın', 'oversize blazer') },
    { id: 'k-02', title: 'Midi Trençkot',         brand: 'Mavi',       gender: 'Kadın',  category: 'Dış Giyim', price: '1.799 ₺', tag: 'Klasik',
      imageUrl: 'https://images.unsplash.com/photo-1760551937537-a29dbbfab30b?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Mavi', 'Kadın', 'midi trençkot') },
    { id: 'k-03', title: 'Saten Midi Etek',       brand: 'H&M',      gender: 'Kadın',  category: 'Alt Giyim', price: '499 ₺',   tag: 'Yeni',
      imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('H&M', 'Kadın', 'saten midi etek') },
    { id: 'k-04', title: 'Örme Kazak',            brand: 'Pull&Bear',  gender: 'Kadın',  category: 'Üst Giyim', price: '649 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1574013451939-0a7e542f128e?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Pull&Bear', 'Kadın', 'örme kazak') },
    { id: 'k-05', title: 'Crop Keten Gömlek',     brand: 'DeFacto',    gender: 'Kadın',  category: 'Üst Giyim', price: '349 ₺',   tag: 'Trend',
      imageUrl: 'https://images.unsplash.com/photo-1686491730839-c6f71dd712b0?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('DeFacto', 'Kadın', 'crop keten gömlek') },
    { id: 'k-06', title: 'Mom Jean',              brand: 'Bershka',    gender: 'Kadın',  category: 'Alt Giyim', price: '899 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Bershka', 'Kadın', 'mom jean') },
    { id: 'k-07', title: 'Floral Midi Elbise',    brand: 'Zara',       gender: 'Kadın',  category: 'Elbise',    price: '1.099 ₺', tag: 'İlkbahar',
      imageUrl: 'https://images.unsplash.com/photo-1745737603144-95d5afe1ade1?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Zara', 'Kadın', 'floral midi elbise') },
    { id: 'k-08', title: 'Deri Görünümlü Kemer',  brand: 'LC Waikiki', gender: 'Kadın',  category: 'Aksesuar',  price: '199 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1711443982852-b3df5c563448?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('LC Waikiki', 'Kadın', 'deri kemer') },
    { id: 'k-09', title: 'Triko Hırka',           brand: 'Mango',      gender: 'Kadın',  category: 'Dış Giyim', price: '1.199 ₺', tag: 'Premium',
      imageUrl: 'https://images.unsplash.com/photo-1582599926390-b4350d5dcd6b?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Mango', 'Kadın', 'triko hırka') },
    { id: 'k-10', title: 'Platform Sneaker',      brand: 'Bershka',    gender: 'Kadın',  category: 'Ayakkabı',  price: '799 ₺',   tag: 'Trend',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Bershka', 'Kadın', 'platform sneaker') },
    { id: 'k-11', title: 'Geniş Paça Pantolon',   brand: 'H&M',      gender: 'Kadın',  category: 'Alt Giyim', price: '599 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1580651214613-f4692d6d138f?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('H&M', 'Kadın', 'geniş paça pantolon') },
    { id: 'k-12', title: 'Siyah Mini Elbise',     brand: 'Zara',       gender: 'Kadın',  category: 'Elbise',    price: '999 ₺',   tag: 'Klasik',
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Zara', 'Kadın', 'siyah mini elbise') },
    // ─── Erkek ────────────────────────────────────────────────────────────────
    { id: 'e-01', title: 'Slim Fit Takım Elbise', brand: 'Mavi',       gender: 'Erkek',  category: 'Dış Giyim', price: '2.499 ₺', tag: 'Premium',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Mavi', 'Erkek', 'slim fit takım elbise') },
    { id: 'e-02', title: 'Oxford Gömlek',         brand: 'LC Waikiki', gender: 'Erkek',  category: 'Üst Giyim', price: '449 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1602107536707-a4a8111d3151?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('LC Waikiki', 'Erkek', 'oxford gömlek') },
    { id: 'e-03', title: 'Slim Fit Chino',        brand: 'Zara',       gender: 'Erkek',  category: 'Alt Giyim', price: '849 ₺',   tag: 'Trend',
      imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Zara', 'Erkek', 'slim fit chino') },
    { id: 'e-04', title: 'Oversize Sweatshirt',   brand: 'Bershka',    gender: 'Erkek',  category: 'Üst Giyim', price: '599 ₺',   tag: 'Streetwear',
      imageUrl: 'https://images.unsplash.com/photo-1770366927363-129518efaaac?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Bershka', 'Erkek', 'oversize sweatshirt') },
    { id: 'e-05', title: 'Denim Ceket',           brand: 'Pull&Bear',  gender: 'Erkek',  category: 'Dış Giyim', price: '999 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Pull&Bear', 'Erkek', 'denim ceket') },
    { id: 'e-06', title: 'Keten Gömlek',          brand: 'DeFacto',    gender: 'Erkek',  category: 'Üst Giyim', price: '399 ₺',   tag: 'Yaz',
      imageUrl: 'https://images.unsplash.com/photo-1627686011747-74adda3d2343?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('DeFacto', 'Erkek', 'keten gömlek') },
    { id: 'e-07', title: 'Şişme Mont',            brand: 'H&M',      gender: 'Erkek',  category: 'Dış Giyim', price: '1.199 ₺', tag: 'Kış',
      imageUrl: 'https://images.unsplash.com/photo-1608113562252-b320e7628e17?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('H&M', 'Erkek', 'şişme mont') },
    { id: 'e-08', title: 'Classic White Tee',     brand: 'Mavi',       gender: 'Erkek',  category: 'Üst Giyim', price: '249 ₺',   tag: 'Temel',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Mavi', 'Erkek', 'beyaz tişört') },
    { id: 'e-09', title: 'Slim Jean',             brand: 'LC Waikiki', gender: 'Erkek',  category: 'Alt Giyim', price: '699 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1599971133617-b2c781943b9a?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('LC Waikiki', 'Erkek', 'slim jean') },
    { id: 'e-10', title: 'Chelsea Bot',           brand: 'Zara',       gender: 'Erkek',  category: 'Ayakkabı',  price: '1.599 ₺', tag: 'Premium',
      imageUrl: 'https://images.unsplash.com/photo-1777987601423-f350ac29b3e9?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Zara', 'Erkek', 'chelsea bot') },
    { id: 'e-11', title: 'Polo Gömlek',           brand: 'H&M',      gender: 'Erkek',  category: 'Üst Giyim', price: '349 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1775816364124-b305f2b06ce7?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('H&M', 'Erkek', 'polo gömlek') },
    { id: 'e-12', title: 'Trençkot',              brand: 'Mango Man',  gender: 'Erkek',  category: 'Dış Giyim', price: '2.199 ₺', tag: 'Klasik',
      imageUrl: 'https://images.unsplash.com/photo-1737508945707-ebdccee97cc5?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Mango Man', 'Erkek', 'trençkot') },
    // ─── Unisex ───────────────────────────────────────────────────────────────
    { id: 'u-01', title: 'Oversize Hoodie',       brand: 'Pull&Bear',  gender: 'Unisex', category: 'Üst Giyim', price: '749 ₺',   tag: 'Streetwear',
      imageUrl: 'https://images.unsplash.com/photo-1721111259873-5a13f7fcd67b?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Pull&Bear', 'Unisex', 'oversize hoodie') },
    { id: 'u-02', title: 'Canvas Sneaker',        brand: 'Bershka',    gender: 'Unisex', category: 'Ayakkabı',  price: '649 ₺',   tag: 'Trend',
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('Bershka', 'Unisex', 'canvas sneaker') },
    { id: 'u-03', title: 'Beyzbol Şapka',         brand: 'DeFacto',    gender: 'Unisex', category: 'Aksesuar',  price: '149 ₺',
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('DeFacto', 'Unisex', 'beyzbol şapka') },
    { id: 'u-04', title: 'Kanvas Tote Çanta',     brand: 'H&M',      gender: 'Unisex', category: 'Aksesuar',  price: '299 ₺',   tag: 'Yeni',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=800&fit=crop&q=80',
      productUrl: brandUrl('H&M', 'Unisex', 'kanvas tote çanta') },
];

const CATEGORIES_ALL = ['Tümü', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Elbise', 'Ayakkabı', 'Aksesuar'];
const GENDERS = ['Tümü', 'Kadın', 'Erkek', 'Unisex'] as const;

const TAG_STYLES: Record<string, string> = {
    'Trend':      'bg-rose-50/90 text-rose-600 border-rose-100',
    'Yeni':       'bg-emerald-50/90 text-emerald-600 border-emerald-100',
    'Klasik':     'bg-stone-50/90 text-stone-600 border-stone-200',
    'Premium':    'bg-amber-50/90 text-amber-600 border-amber-100',
    'Streetwear': 'bg-indigo-50/90 text-indigo-600 border-indigo-100',
    'Temel':      'bg-gray-50/90 text-gray-500 border-gray-100',
    'Kış':        'bg-sky-50/90 text-sky-600 border-sky-100',
    'Yaz':        'bg-orange-50/90 text-orange-600 border-orange-100',
    'İlkbahar':   'bg-green-50/90 text-green-600 border-green-100',
};

// ─── Daily pool ───────────────────────────────────────────────────────────────
const getDailySlice = (): Product[] => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const seededRandom = (n: number) => { const x = Math.sin(n + seed) * 10000; return x - Math.floor(x); };
    const shuffled = [...CATALOG];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 20);
};

// ─── localStorage daily state ─────────────────────────────────────────────────
const DAILY_KEY = 'boutique_discover_v3';
interface DailyData { date: string; swipedIds: string[]; likedIds: string[]; }

function loadDaily(): DailyData {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const raw = localStorage.getItem(DAILY_KEY);
        if (raw) { const d = JSON.parse(raw) as DailyData; if (d.date === today) return d; }
    } catch {}
    return { date: today, swipedIds: [], likedIds: [] };
}
function saveDaily(d: DailyData) { try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch {} }

// ─── TopCard ──────────────────────────────────────────────────────────────────
const TopCard: React.FC<{
    product: Product;
    exitTrigger: 'left' | 'right' | null;
    onExited: (dir: 'left' | 'right') => void;
    onSwipeChange: (dir: 'left' | 'right' | null) => void;
    onLike: () => void;
}> = ({ product, exitTrigger, onExited, onSwipeChange, onLike }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-280, 0, 280], [-16, 0, 16]);
    const rightOpacity = useTransform(x, [25, 110], [0, 1]);
    const leftOpacity  = useTransform(x, [-110, -25], [1, 0]);
    const controls = useAnimation();
    const doneRef = useRef(false);

    useEffect(() => {
        controls.start({ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 38 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return x.on('change', v => {
            if (v > 50) onSwipeChange('right');
            else if (v < -50) onSwipeChange('left');
            else onSwipeChange(null);
        });
    }, [x, onSwipeChange]);

    useEffect(() => {
        if (!exitTrigger || doneRef.current) return;
        doneRef.current = true;
        const dir = exitTrigger;
        controls.start({
            x: dir === 'right' ? 900 : -900, y: -50,
            rotate: dir === 'right' ? 22 : -22, opacity: 0,
            transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
        }).then(() => onExited(dir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exitTrigger]);

    const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        onSwipeChange(null);
        if (doneRef.current) return;
        const { offset, velocity } = info;
        if (offset.x > 110 || velocity.x > 500) {
            doneRef.current = true;
            controls.start({ x: 1000, y: -80, rotate: 25, opacity: 0, transition: { duration: 0.38 } }).then(() => onExited('right'));
        } else if (offset.x < -110 || velocity.x < -500) {
            doneRef.current = true;
            controls.start({ x: -1000, y: -80, rotate: -25, opacity: 0, transition: { duration: 0.38 } }).then(() => onExited('left'));
        } else {
            controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 450, damping: 32 } });
        }
    };

    return (
        <motion.div
            animate={controls}
            initial={{ scale: 0.94, y: 16, opacity: 0.9 }}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-none select-none"
        >
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative shadow-[0_32px_90px_rgba(0,0,0,0.26),0_4px_18px_rgba(0,0,0,0.10)]">
                <img
                    src={product.imageUrl} alt={product.title}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ filter: 'contrast(1.05) brightness(0.95) saturate(0.85)' }}
                    draggable={false}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=800&fit=crop&q=80'; }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/5 to-transparent pointer-events-none" />

                {/* BEĞENDİM stamp */}
                <motion.div style={{ opacity: rightOpacity, rotate: -14 }}
                    className="absolute top-9 left-6 z-30 border-[3px] border-emerald-400 rounded-2xl px-4 py-2 pointer-events-none">
                    <span className="text-emerald-400 text-[18px] font-black tracking-[0.22em] uppercase">BEĞENDİM</span>
                </motion.div>

                {/* GEÇ stamp */}
                <motion.div style={{ opacity: leftOpacity, rotate: 14 }}
                    className="absolute top-9 right-6 z-30 border-[3px] border-rose-400 rounded-2xl px-4 py-2 pointer-events-none">
                    <span className="text-rose-400 text-[18px] font-black tracking-[0.22em] uppercase">GEÇ</span>
                </motion.div>

                {/* Tag */}
                {product.tag && (
                    <div className="absolute top-5 left-5 z-20 pointer-events-none">
                        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border backdrop-blur-sm ${TAG_STYLES[product.tag] || 'bg-gray-50/90 text-gray-500 border-gray-100'}`}>
                            {product.tag}
                        </span>
                    </div>
                )}

                {/* Quick-like button */}
                <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onLike(); }}
                    className="absolute top-5 right-5 z-30 w-10 h-10 bg-black/25 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/45 transition-all"
                >
                    <Heart size={15} className="text-white/80" />
                </button>

                {/* Product info */}
                <div className="absolute inset-x-0 bottom-0 p-6 z-20 pointer-events-none">
                    <p className="text-white/40 text-[8px] font-mono uppercase tracking-[0.5em] mb-1.5">
                        {product.brand} · {product.category}
                    </p>
                    <h3 className="text-white text-[24px] font-serif font-light leading-tight tracking-tight">
                        {product.title}
                    </h3>
                    {product.price && (
                        <p className="text-white/50 text-[11px] font-mono mt-2 tracking-[0.18em]">{product.price}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─── BehindCard ───────────────────────────────────────────────────────────────
const BehindCard: React.FC<{ product: Product; pos: 0 | 1 }> = ({ product, pos }) => (
    <motion.div
        className="absolute inset-0"
        initial={{ scale: pos === 0 ? 0.88 : 0.82, y: pos === 0 ? 32 : 50 }}
        animate={{ scale: pos === 0 ? 0.94 : 0.88, y: pos === 0 ? 16 : 32 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        style={{ zIndex: pos === 0 ? 5 : 2 }}
    >
        <div className="w-full h-full rounded-[2.2rem] overflow-hidden shadow-md">
            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.0) brightness(0.85) saturate(0.7)' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=800&fit=crop&q=80'; }}
            />
        </div>
    </motion.div>
);

// ─── DiscoverPage ─────────────────────────────────────────────────────────────
const DiscoverPage: React.FC = () => {
    const navigate      = useNavigate();
    const { showToast } = useUIStore();

    const [daily, setDaily]             = useState<DailyData>(() => loadDaily());
    const dailyPool                      = useMemo(() => getDailySlice(), []);
    const [gender, setGender]            = useState<typeof GENDERS[number]>('Tümü');
    const [category, setCategory]        = useState('Tümü');
    const [showFilters, setShowFilters]  = useState(false);
    const [exitTrigger, setExitTrigger]  = useState<'left' | 'right' | null>(null);
    const [liveDir, setLiveDir]          = useState<'left' | 'right' | null>(null);
    const [mousePos, setMousePos]        = useState({ x: 0, y: 0 });
    const likedScrollRef                 = useRef<HTMLDivElement>(null);

    useEffect(() => { saveDaily(daily); }, [daily]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    useEffect(() => { setExitTrigger(null); setLiveDir(null); }, [gender, category]);

    const filtered = useMemo(() => dailyPool.filter(p => {
        if (gender !== 'Tümü' && p.gender !== gender) return false;
        if (category !== 'Tümü' && p.category !== category) return false;
        return true;
    }), [dailyPool, gender, category]);

    const pending = useMemo(
        () => filtered.filter(p => !daily.swipedIds.includes(p.id)),
        [filtered, daily.swipedIds]
    );

    const likedProducts = useMemo(
        () => daily.likedIds.map(id => CATALOG.find(p => p.id === id)).filter(Boolean) as Product[],
        [daily.likedIds]
    );

    const currentProduct = pending[0];
    const isDone = daily.swipedIds.length >= 20 || (pending.length === 0 && filtered.length > 0);
    const swipedToday = daily.swipedIds.length;

    const handleExited = useCallback((dir: 'left' | 'right') => {
        const product = pending[0];
        if (!product) return;
        setDaily(prev => ({
            ...prev,
            swipedIds: [...prev.swipedIds, product.id],
            likedIds: dir === 'right' ? [...prev.likedIds, product.id] : prev.likedIds,
        }));
        if (dir === 'right') {
            showToast(`${product.title} beğenildi!`);
            setTimeout(() => {
                likedScrollRef.current?.scrollTo({ left: likedScrollRef.current.scrollWidth, behavior: 'smooth' });
            }, 250);
        }
        setExitTrigger(null);
        setLiveDir(null);
    }, [pending, showToast]);

    const handleSkip = useCallback(() => {
        if (exitTrigger || !currentProduct) return;
        setExitTrigger('left');
    }, [exitTrigger, currentProduct]);

    const handleLike = useCallback(() => {
        if (exitTrigger || !currentProduct) return;
        setExitTrigger('right');
    }, [exitTrigger, currentProduct]);

    const handleUndo = useCallback(() => {
        setDaily(prev => {
            if (prev.swipedIds.length === 0) return prev;
            const lastId = prev.swipedIds[prev.swipedIds.length - 1];
            return {
                ...prev,
                swipedIds: prev.swipedIds.slice(0, -1),
                likedIds: prev.likedIds.filter(id => id !== lastId),
            };
        });
        setExitTrigger(null);
        setLiveDir(null);
    }, []);

    const handleUnlike = useCallback((id: string) => {
        setDaily(prev => ({ ...prev, likedIds: prev.likedIds.filter(lid => lid !== id) }));
    }, []);

    const addToWardrobe = useCallback(async (product: Product) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/wardrobe/items`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: product.category, brand: product.brand, imageUrl: product.imageUrl }),
            });
            if (res.ok) showToast(`${product.title} gardıroba eklendi!`);
            else showToast('Eklenemedi.');
        } catch { showToast('Bağlantı hatası.'); }
    }, [showToast]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="min-h-screen bg-[#F5F1EB] overflow-x-hidden cursor-default">

            {/* Custom cursor */}
            <motion.div
                className="fixed top-0 left-0 w-7 h-7 rounded-full border border-[#1a1410]/30 pointer-events-none z-[9999] hidden lg:flex items-center justify-center"
                animate={{ x: mousePos.x - 14, y: mousePos.y - 14 }}
                transition={{ type: 'spring', stiffness: 700, damping: 30, mass: 0.5 }}
            >
                <div className="w-1 h-1 bg-[#1a1410] rounded-full" />
            </motion.div>

            {/* Ambient */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 right-0 w-[800px] h-[800px] bg-rose-100/15 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 -left-40 w-[900px] h-[700px] bg-amber-100/20 rounded-full blur-[220px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-200/30 rounded-full blur-[180px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">

                {/* ── Header ── */}
                <header className="pt-24 pb-4 px-6 lg:px-16 max-w-[1200px] mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30, filter: 'blur(16px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                        transition={{ duration: 0.9 }}
                        className="flex items-end justify-between gap-6"
                    >
                        <div>
                            <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#9a9080] mb-3 flex items-center gap-3">
                                <span className="w-6 h-px bg-[#c8bfb0] inline-block" />
                                Günün Koleksiyonu
                                <span className="w-6 h-px bg-[#c8bfb0] inline-block" />
                            </p>
                            <h1 className="text-[56px] lg:text-[80px] font-serif font-light tracking-[-0.02em] leading-none text-[#1a1410]">
                                Keşfet<span className="italic text-[#c8b89a]">.</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 pb-2">
                            {likedProducts.length > 0 && (
                                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-[#e8e0d8] rounded-full shadow-sm">
                                    <Heart size={10} className="text-rose-500 fill-rose-500" />
                                    <span className="text-[9px] font-mono text-[#5a4a3a] tracking-widest">{likedProducts.length} beğeni</span>
                                </motion.div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-[#e8e0d8] rounded-full shadow-sm">
                                <Calendar size={10} className="text-[#9a9080]" />
                                <span className="text-[9px] font-mono text-[#7a6a5a] tracking-widest">{swipedToday} / 20</span>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* ── Filters ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="px-6 lg:px-16 max-w-[1200px] mx-auto w-full mb-8"
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        {GENDERS.map(g => (
                            <button key={g} onClick={() => setGender(g)}
                                className={`px-5 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.22em] transition-all duration-300 ${
                                    gender === g
                                        ? 'bg-[#1a1410] text-[#f5f1eb] shadow-md'
                                        : 'bg-white/70 border border-[#d8d0c4] text-[#7a6a5a] hover:border-[#a89880] hover:text-[#1a1410]'
                                }`}>{g}</button>
                        ))}
                        <div className="w-px h-5 bg-[#d8d0c4] mx-1" />
                        <button onClick={() => setShowFilters(p => !p)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[9px] font-mono uppercase tracking-[0.22em] transition-all duration-300 ${
                                showFilters || category !== 'Tümü'
                                    ? 'bg-[#1a1410] text-[#f5f1eb] border-[#1a1410]'
                                    : 'bg-white/70 border-[#d8d0c4] text-[#7a6a5a] hover:border-[#a89880]'
                            }`}>
                            <X size={10} className={showFilters || category !== 'Tümü' ? '' : 'rotate-45'} />
                            Kategori
                            {category !== 'Tümü' && (
                                <span className="w-4 h-4 bg-[#f5f1eb] text-[#1a1410] rounded-full text-[7px] flex items-center justify-center font-black">1</span>
                            )}
                        </button>
                        {category !== 'Tümü' && (
                            <button onClick={() => setCategory('Tümü')}
                                className="text-[9px] font-mono uppercase tracking-widest text-[#9a9080] hover:text-[#1a1410] transition-colors flex items-center gap-1">
                                <X size={9} /> Temizle
                            </button>
                        )}
                    </div>
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#d8d0c4]/60">
                                    {CATEGORIES_ALL.map(c => (
                                        <button key={c} onClick={() => { setCategory(c); setShowFilters(false); }}
                                            className={`px-4 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all ${
                                                category === c ? 'bg-[#1a1410] text-[#f5f1eb]' : 'bg-white/80 border border-[#d8d0c4] text-[#7a6a5a] hover:border-[#a89880]'
                                            }`}>{c}</button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Main content ── */}
                <div className="flex-1 px-6 lg:px-16 max-w-[1200px] mx-auto w-full pb-16">
                    <div className="flex gap-10 lg:gap-16 items-start justify-center">

                        {/* ── Card column ── */}
                        <div className="flex flex-col items-center w-full max-w-[420px] shrink-0">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.7 }}
                                className="relative w-full"
                                style={{ height: 'clamp(460px, 60vh, 560px)' }}
                            >
                                <AnimatePresence mode="sync">
                                    {isDone ? (
                                        /* ── End of day screen ── */
                                        <motion.div
                                            key="done"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                            className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-[2.2rem] bg-[#1a1410] overflow-hidden"
                                            style={{ boxShadow: '0 40px 120px rgba(26,20,16,0.5)' }}
                                        >
                                            {/* Decorative rings */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-white/5" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-white/5" />
                                                <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] rounded-full bg-[#c8b89a]/5 blur-3xl" />
                                            </div>

                                            <motion.div
                                                animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
                                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                                className="relative w-24 h-24 rounded-full flex items-center justify-center mb-7"
                                                style={{ background: 'linear-gradient(135deg, #c8b89a, #8a7060)' }}
                                            >
                                                <Calendar size={34} className="text-[#1a1410]" />
                                            </motion.div>

                                            <p className="text-[#6a5a4a] text-[8px] font-mono uppercase tracking-[0.55em] mb-4">
                                                Bugünlük Bitti
                                            </p>
                                            <h3 className="text-[40px] font-serif font-light text-white leading-tight mb-2">
                                                Yarın<br/>görüşürüz<span className="text-[#c8b89a]">.</span>
                                            </h3>
                                            <p className="text-[#9a8a7a] text-[11px] font-serif italic mb-1">{tomorrowStr}</p>
                                            <p className="text-[#5a4a3a] text-[8px] font-mono uppercase tracking-[0.35em] mb-8">
                                                Yeni koleksiyon seni bekliyor
                                            </p>

                                            {likedProducts.length > 0 && (
                                                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/8">
                                                    <Heart size={13} className="text-rose-400 fill-rose-400" />
                                                    <span className="text-white/60 text-[10px] font-mono tracking-widest">
                                                        {likedProducts.length} parça beğendin
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <>
                                            {pending[2] && <BehindCard key={`b2-${pending[2].id}`} product={pending[2]} pos={1} />}
                                            {pending[1] && <BehindCard key={`b1-${pending[1].id}`} product={pending[1]} pos={0} />}
                                            {currentProduct && (
                                                <TopCard
                                                    key={currentProduct.id}
                                                    product={currentProduct}
                                                    exitTrigger={exitTrigger}
                                                    onExited={handleExited}
                                                    onSwipeChange={setLiveDir}
                                                    onLike={handleLike}
                                                />
                                            )}
                                        </>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Hint */}
                            {!isDone && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    className="flex items-center gap-5 mt-4 text-[8px] font-mono uppercase tracking-[0.4em] text-[#b0a898]"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <X size={8} className="text-rose-400" /> Geç
                                    </span>
                                    <span className="w-10 h-px bg-[#d8d0c4]" />
                                    <span className="flex items-center gap-1.5">
                                        Beğen <Heart size={8} className="text-emerald-500" />
                                    </span>
                                </motion.div>
                            )}

                            {/* Action buttons */}
                            {!isDone && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45, duration: 0.6 }}
                                    className="flex items-center gap-5 mt-6"
                                >
                                    {/* Skip */}
                                    <motion.button
                                        onClick={handleSkip} disabled={!!exitTrigger}
                                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                                        className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${
                                            liveDir === 'left'
                                                ? 'bg-rose-500 shadow-[0_8px_32px_rgba(244,63,94,0.45)]'
                                                : 'bg-white border border-[#e8e0d8] shadow-[0_4px_20px_rgba(0,0,0,0.09)]'
                                        }`}
                                    >
                                        <X size={22} className={liveDir === 'left' ? 'text-white' : 'text-rose-400'} />
                                    </motion.button>

                                    {/* Buy */}
                                    {currentProduct && (
                                        <motion.a href={currentProduct.productUrl} target="_blank" rel="noopener noreferrer"
                                            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                            className="w-[46px] h-[46px] bg-white/80 rounded-full shadow-[0_2px_14px_rgba(0,0,0,0.08)] flex items-center justify-center border border-[#e8e0d8] hover:bg-white transition-all"
                                            onClick={e => e.stopPropagation()}>
                                            <ArrowUpRight size={16} className="text-[#7a6a5a]" />
                                        </motion.a>
                                    )}

                                    {/* Like */}
                                    <motion.button
                                        onClick={handleLike} disabled={!!exitTrigger}
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                                        className={`w-[76px] h-[76px] rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                                            liveDir === 'right'
                                                ? 'bg-emerald-500 shadow-[0_12px_48px_rgba(16,185,129,0.5)]'
                                                : 'bg-[#1a1410] shadow-[0_10px_40px_rgba(26,20,16,0.35)]'
                                        }`}
                                    >
                                        <Heart size={28} className={`text-white transition-all ${liveDir === 'right' ? 'fill-white scale-110' : ''}`} />
                                    </motion.button>

                                    {/* Wardrobe */}
                                    <motion.button onClick={() => navigate('/wardrobe')}
                                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                        className="w-[46px] h-[46px] bg-white/80 rounded-full shadow-[0_2px_14px_rgba(0,0,0,0.08)] flex items-center justify-center border border-[#e8e0d8] hover:bg-white transition-all">
                                        <ShoppingBag size={16} className="text-[#7a6a5a]" />
                                    </motion.button>

                                    {/* Undo last swipe */}
                                    <motion.button
                                        onClick={handleUndo}
                                        disabled={swipedToday === 0 || !!exitTrigger}
                                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                                        title="Son işlemi geri al"
                                        className="w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all disabled:opacity-20 bg-white border border-[#e8e0d8] shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:border-[#c8b89a]"
                                    >
                                        <RotateCcw size={18} className="text-[#9a8a7a]" />
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Progress */}
                            {!isDone && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                    className="flex items-center gap-3 mt-5">
                                    <div className="w-32 h-[2px] bg-[#d8d0c4] rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-[#1a1410] rounded-full"
                                            animate={{ width: `${(swipedToday / 20) * 100}%` }}
                                            transition={{ duration: 0.4, ease: 'easeOut' }} />
                                    </div>
                                    <span className="text-[9px] font-mono text-[#9a9080] tabular-nums tracking-widest">
                                        {swipedToday} / 20
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* ── Liked sidebar (desktop) ── */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55, duration: 0.7 }}
                            className="hidden lg:flex flex-col w-[270px] shrink-0 sticky top-28"
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <Heart size={12} className="text-rose-500 fill-rose-500" />
                                <h2 className="text-[10px] font-mono uppercase tracking-[0.38em] text-[#1a1410]">Beğendiklerim</h2>
                                {likedProducts.length > 0 && (
                                    <span className="ml-auto w-5 h-5 rounded-full bg-[#1a1410] text-[#f5f1eb] text-[8px] flex items-center justify-center font-mono font-bold">
                                        {likedProducts.length}
                                    </span>
                                )}
                            </div>

                            {likedProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-52 rounded-2xl border border-dashed border-[#d8d0c4] bg-white/30 text-center gap-3 px-6">
                                    <Heart size={22} className="text-[#d0c8c0]" />
                                    <p className="text-[11px] font-serif italic text-[#b8b0a4]">Henüz beğenilen yok</p>
                                    <p className="text-[8px] font-mono text-[#c8c0b4] uppercase tracking-[0.3em]">Sağa kaydırarak beğen</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1"
                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#d8d0c4 transparent' }}>
                                    <AnimatePresence>
                                        {likedProducts.map((p, i) => (
                                            <motion.div key={p.id}
                                                initial={{ opacity: 0, x: 24, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 30 }}
                                                className="group flex items-center gap-3 p-2.5 bg-white/80 rounded-2xl border border-[#ece4dc] hover:border-[#c8b89a] hover:shadow-md transition-all"
                                            >
                                                <div className="w-[52px] h-[64px] rounded-xl overflow-hidden shrink-0">
                                                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[7px] font-mono uppercase tracking-widest text-[#9a9080] mb-0.5">{p.brand}</p>
                                                    <p className="text-[12px] font-serif text-[#1a1410] leading-tight truncate">{p.title}</p>
                                                    {p.price && <p className="text-[9px] font-mono text-[#7a6a5a] mt-0.5 tracking-widest">{p.price}</p>}
                                                </div>
                                                <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                                    <motion.button
                                                        onClick={() => handleUnlike(p.id)}
                                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                                        className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-500 flex items-center justify-center transition-all group/btn"
                                                        title="Beğeniyi Geri Al"
                                                    >
                                                        <Heart size={10} className="text-rose-400 group-hover/btn:text-white fill-rose-300 group-hover/btn:fill-white" />
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => addToWardrobe(p)}
                                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                                        className="w-7 h-7 rounded-full bg-[#f0ebe4] hover:bg-[#1a1410] flex items-center justify-center transition-all group/btn"
                                                        title="Gardıroba Ekle"
                                                    >
                                                        <ShoppingBag size={10} className="text-[#7a6a5a] group-hover/btn:text-white" />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            {likedProducts.length > 0 && (
                                <button onClick={() => navigate('/wardrobe')}
                                    className="mt-4 w-full py-3 rounded-2xl border border-[#d8d0c4] text-[9px] font-mono uppercase tracking-[0.28em] text-[#7a6a5a] hover:bg-[#1a1410] hover:text-[#f5f1eb] hover:border-[#1a1410] transition-all flex items-center justify-center gap-2">
                                    <ShoppingBag size={11} /> Gardırobumu Gör
                                </button>
                            )}
                        </motion.div>
                    </div>

                    {/* ── Liked strip (mobile) ── */}
                    <AnimatePresence>
                        {likedProducts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}
                                className="lg:hidden mt-10 border-t border-[#e0d8d0]/60 pt-8"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart size={12} className="text-rose-500 fill-rose-500" />
                                    <h2 className="text-[10px] font-mono uppercase tracking-[0.38em] text-[#1a1410]">Beğendiklerim</h2>
                                    <span className="ml-auto text-[9px] font-mono text-[#9a9080] tracking-widest">{likedProducts.length} parça</span>
                                </div>
                                <div ref={likedScrollRef} className="flex gap-3 overflow-x-auto pb-3"
                                    style={{ scrollbarWidth: 'none' }}>
                                    <AnimatePresence>
                                        {likedProducts.map((p, i) => (
                                            <motion.div key={p.id}
                                                initial={{ opacity: 0, scale: 0.8, x: 16 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                transition={{ delay: i * 0.05, type: 'spring', stiffness: 380, damping: 30 }}
                                                className="shrink-0 flex flex-col gap-1.5 group/card"
                                            >
                                                <div className="relative w-[76px] h-[96px] rounded-2xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.14)] border border-[#e8e0d8]">
                                                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                                    {/* Unlike overlay */}
                                                    <button
                                                        onClick={() => handleUnlike(p.id)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-rose-500"
                                                    >
                                                        <X size={10} className="text-white" />
                                                    </button>
                                                </div>
                                                <p className="text-[9px] font-serif text-[#1a1410] text-center max-w-[76px] leading-tight truncate">{p.title}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Footer ── */}
                <div className="px-6 lg:px-16 pb-12 max-w-[1200px] mx-auto w-full border-t border-[#e0d8d0]/50 pt-8 mt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-5xl font-serif font-light text-[#e8e0d4] leading-none select-none">
                            Discover<span className="italic text-[#d8d0c4]">.</span>
                        </h2>
                        <p className="text-[8px] font-mono text-[#b8b0a4] uppercase tracking-[0.38em]">
                            20 parça / gün
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscoverPage;
