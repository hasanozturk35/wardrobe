import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2,
    Sparkles, TrendingUp, Menu, Package
} from 'lucide-react';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';
import { getImageUrl } from '../config';
import { AddItemModal } from '../components/wardrobe/AddItemModal';
import GarmentDetailModal from '../components/wardrobe/GarmentDetailModal';

const CATEGORIES = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

const WardrobePage: React.FC = () => {
    const { items, fetchItems, deleteItem } = useWardrobeStore();
    const { openMenu, showToast } = useUIStore();
    const [searchTerm, setSearchTerm]         = useState('');
    const [activeCategory, setActiveCategory] = useState('Hepsi');
    const [selectedItem, setSelectedItem]     = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem]       = useState<any>(null);
    const [editorial, setEditorial]           = useState<any>(null);

    useEffect(() => {
        fetchItems();
        fetchEditorial();
    }, []);

    const fetchEditorial = async () => {
        try {
            const token  = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res    = await fetch(`${apiUrl}/ai/editorial`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setEditorial(await res.json());
            } else {
                setEditorial({ headline: 'Style Oracle', article: 'Gardırobun analiz ediliyor, birkaç saniye bekle.' });
            }
        } catch {
            setEditorial({ headline: 'Style Oracle', article: 'Sunucuya bağlanılamadı.' });
        }
    };

    const stats = useMemo(() => {
        const total = items.length;
        if (total === 0) return { total: 0, data: [], label: 'Boş Arşiv' };
        const data = CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat).length;
            return { name: cat, count, percentage: Math.round((count / total) * 100) };
        });
        const label = total > 15 ? 'Avant-Garde' : total > 5 ? 'Capsule' : 'Minimalist';
        return { total, data, label };
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

    const handleAdd    = () => { setEditingItem(null); setIsAddModalOpen(true); };
    const handleEdit   = (item: any) => { setEditingItem(item); setSelectedItem(null); setIsAddModalOpen(true); };
    const handleDelete = async (id: string) => { await deleteItem(id); setSelectedItem(null); showToast('Parça arşivden çıkarıldı.'); };

    return (
        <div className="min-h-screen pt-24 pb-48 px-8 lg:px-20 relative overflow-x-hidden">

            {/* ── Animated Background ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FDF9F4] via-[#FDFBF7] to-[#F7F3EE]" />
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-[25%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100/25 blur-[180px]"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
                    className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-amber-100/20 blur-[160px]"
                />
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
                    className="absolute top-[40%] left-[30%] w-[30%] h-[35%] rounded-full bg-rose-100/15 blur-[140px]"
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '44px 44px' }}
                />
            </div>

            <div className="max-w-[1800px] mx-auto relative z-10">

                {/* ── Header ── */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 mb-6"
                        >
                            <span className="w-16 h-[1px] bg-black opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400">Dijital Gardırop Arşivi</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            className="text-[9rem] lg:text-[13rem] font-serif font-light leading-[0.82] tracking-tightest text-gray-900 whitespace-nowrap"
                        >
                            Gardırop<span className="italic font-normal text-gray-400">.</span>
                        </motion.h1>

                        {/* İstatistik şeridi */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="flex items-center gap-8 mt-8"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-serif font-light text-gray-900">{stats.total}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Parça</span>
                            </div>
                            <span className="w-px h-6 bg-gray-200" />
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-serif font-light text-gray-900">
                                    {new Set(items.map(i => i.brand).filter(Boolean)).size}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Marka</span>
                            </div>
                            <span className="w-px h-6 bg-gray-200" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic font-serif">{stats.label}</span>
                        </motion.div>
                    </div>

                    <div className="flex flex-col items-end gap-6">
                        {/* Küçük kıyafet önizleme kolajı */}
                        <div className="hidden lg:flex gap-3 mb-2">
                            {[
                                'https://images.unsplash.com/photo-ogmenj2NGho?w=160&q=70',
                                'https://images.unsplash.com/photo-oB7lLU9dwLc?w=160&q=70',
                                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&q=70',
                            ].map((src, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="w-20 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-elite"
                                    style={{ rotate: [-4, 0, 4][i] + 'deg' }}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={openMenu}
                                className="w-16 h-16 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center shadow-elite hover:scale-110 transition-all group"
                            >
                                <Menu size={20} className="text-gray-900 group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                            <button
                                onClick={handleAdd}
                                className="px-12 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center gap-4 hover:bg-gray-900 transition-all font-serif italic text-xl group shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                            >
                                <Plus size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                                Arşive Ekle
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Stats Dashboard ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">

                    {/* Sol: Koleksiyon dağılımı */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 bg-white/50 backdrop-blur-3xl rounded-[4rem] p-12 border border-white/70 shadow-elite flex flex-col justify-between h-[420px]"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30">Koleksiyon Dağılımı</span>
                            <TrendingUp size={18} className="text-gray-200" />
                        </div>

                        {stats.total === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                                <Package size={40} strokeWidth={1} className="text-gray-200" />
                                <p className="text-gray-300 font-serif italic text-lg">Henüz kıyafet eklenmedi</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-10">
                                {stats.data.filter(s => s.count > 0).map((stat) => (
                                    <div key={stat.name} className="group">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-2">{stat.name}</p>
                                        <p className="text-4xl font-serif leading-none">{stat.percentage}<span className="text-lg text-gray-300">%</span></p>
                                        <div className="w-full h-[1px] bg-gray-100 mt-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stat.percentage}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                                className="h-full bg-black"
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-300 mt-1">{stat.count} parça</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.4em] mb-2">Toplam Parça</p>
                                <p className="text-6xl font-serif font-light">{stats.total}</p>
                            </div>
                            <p className="text-stone-400 italic font-serif text-xl">{stats.label}</p>
                        </div>
                    </motion.div>

                    {/* Sağ: AI Style Oracle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-black text-white rounded-[4rem] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col justify-between h-[420px]"
                    >
                        <div className="absolute top-0 right-0 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[18rem] h-[18rem] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="px-5 py-2 bg-white/10 rounded-full text-[9px] font-black tracking-[0.4em] uppercase border border-white/10">Style Oracle AI</span>
                                    {editorial?.weather && (
                                        <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black tracking-widest uppercase text-white/50">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            {editorial.weather.city} · {editorial.weather.condition} · {editorial.weather.temp}°C
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={fetchEditorial}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:rotate-180 duration-500 border border-white/10"
                                    title="Yenile"
                                >
                                    <Sparkles size={16} className="text-amber-200/70" />
                                </button>
                            </div>

                            <div className="max-w-3xl">
                                <h4 className="text-5xl lg:text-6xl font-serif mb-6 leading-[1.1] italic font-light tracking-tight">
                                    {editorial?.headline || 'Koleksiyonun analiz ediliyor...'}
                                </h4>
                                <p className="text-lg font-serif text-white/50 leading-relaxed italic max-w-2xl">
                                    {editorial?.article || 'Stil kahinin saniyeler içinde senin için bir manifesto hazırlayacak.'}
                                </p>
                            </div>

                            <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                                <div className="flex -space-x-3">
                                    {(editorial?.suggestedItems?.length > 0
                                        ? editorial.suggestedItems.slice(0, 3).map((it: any) => getImageUrl(it.imageUrl, it.category))
                                        : [
                                            'https://images.unsplash.com/photo-ogmenj2NGho?w=200&q=80',
                                            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80',
                                            'https://images.unsplash.com/photo-oB7lLU9dwLc?w=200&q=80',
                                          ]
                                    ).map((src: string, i: number) => (
                                        <div key={i} className="w-14 h-14 rounded-full border-[3px] border-black/80 bg-stone-800 overflow-hidden shadow-xl" style={{ zIndex: 3 - i }}>
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Günün Kombini</span>
                                    <span className="text-xs font-serif italic text-white/40">Oracle tarafından hazırlandı</span>
                                </div>
                                <button
                                    onClick={fetchEditorial}
                                    className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 transition-all text-[9px] font-black tracking-widest uppercase text-white/40 hover:text-white/70"
                                >
                                    <Sparkles size={10} />
                                    Yenile
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Filtreler & Arama ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-20 bg-white/40 backdrop-blur-xl p-5 rounded-[3rem] border border-white/60 shadow-elite">
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-2">
                        {['Hepsi', ...CATEGORIES].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.6rem] text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-all duration-500 ${
                                    activeCategory === cat
                                        ? 'bg-black text-white shadow-xl'
                                        : 'text-gray-400 hover:text-black'
                                }`}
                            >
                                {cat}
                                <span className={`text-[9px] font-mono ${activeCategory === cat ? 'text-white/50' : 'text-gray-300'}`}>
                                    {categoryCount(cat)}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="relative group min-w-[360px] mr-4">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-black transition-colors" size={15} />
                        <input
                            type="text"
                            placeholder="Arşivde ara..."
                            className="w-full pl-9 pr-4 py-3 bg-transparent border-b border-gray-100 focus:border-black outline-none transition-all font-serif italic text-xl placeholder:text-gray-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Kıyafet Grid ── */}
                {filteredItems.length === 0 && items.length === 0 ? (
                    /* Boş gardırop durumu */
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center py-40 text-center"
                    >
                        <div className="w-40 h-40 bg-white/60 backdrop-blur-xl rounded-[4rem] border border-white/80 shadow-elite flex items-center justify-center mb-12">
                            <Package size={56} strokeWidth={0.8} className="text-gray-200" />
                        </div>
                        <h3 className="text-6xl font-serif font-light text-gray-900 mb-4">
                            Arşiv <span className="italic text-gray-400">Boş.</span>
                        </h3>
                        <p className="text-gray-400 font-serif italic text-xl mb-16 max-w-sm leading-relaxed">
                            İlk kıyafetini ekleyerek dijital gardırobunu oluşturmaya başla.
                        </p>
                        <button
                            onClick={handleAdd}
                            className="px-16 py-6 bg-black text-white rounded-[2rem] font-serif italic text-2xl flex items-center gap-4 hover:bg-gray-900 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.2)] group"
                        >
                            <Plus size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                            İlk Parçayı Ekle
                        </button>
                    </motion.div>
                ) : filteredItems.length === 0 ? (
                    /* Arama sonucu boş */
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <p className="text-5xl font-serif italic text-gray-300 mb-4">Sonuç bulunamadı.</p>
                        <p className="text-gray-400 font-serif text-lg">"{searchTerm}" için arşivde eşleşen parça yok.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 lg:gap-16">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, index) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.04, duration: 0.8 }}
                                    className="group relative cursor-pointer"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="aspect-[3/4.2] rounded-[4rem] overflow-hidden bg-white shadow-elite relative border-[12px] border-white group-hover:shadow-[0_50px_100px_rgba(0,0,0,0.1)] group-hover:-translate-y-4 transition-all duration-700">
                                        <img
                                            src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out"
                                            alt={item.brand || 'Kıyafet'}
                                        />
                                        {/* Kategori badge */}
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-black/50 group-hover:bg-black group-hover:text-white transition-all duration-500">
                                                {item.meshUrl ? '3D' : item.category?.split(' ')[0] || 'Parça'}
                                            </span>
                                        </div>
                                        {/* Sil butonu */}
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="w-10 h-10 bg-white/90 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {/* Alt gradient */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>

                                    <div className="mt-8 px-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 block mb-2">{item.category}</span>
                                        <h3 className="text-3xl font-serif text-gray-900 tracking-tight leading-none group-hover:italic transition-all duration-500">
                                            {item.brand || 'Kıyafet'}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-300 font-serif italic opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
                                            Arşiv Parçası
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Ekle kartı */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={handleAdd}
                            className="aspect-[3/4.2] rounded-[4rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center group hover:bg-white/50 hover:border-stone-300 transition-all duration-500"
                        >
                            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-sm mb-8">
                                <Plus size={32} strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 group-hover:text-black transition-colors">Ekle</span>
                        </motion.button>
                    </div>
                )}
            </div>

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchItems()}
                editItem={editingItem}
            />
            {selectedItem && (
                <GarmentDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                />
            )}

            <style>{`
                .shadow-elite { box-shadow: 0 10px 40px rgba(0,0,0,0.02); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default WardrobePage;
