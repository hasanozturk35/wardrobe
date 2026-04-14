import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Sparkles, Heart, X, ShoppingBag } from 'lucide-react';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';
import { API_URL } from '../config';

interface ShopItem {
    id: string;
    name: string;
    brand: string;
    price: string;
    image: string;
    category: string;
}

const DiscoverPage: React.FC = () => {
    const { fetchItems } = useWardrobeStore();
    const { openMenu, showToast } = useUIStore();
    const [view, setView] = useState<'discover' | 'editorial'>('discover');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editorialContent, setEditorialContent] = useState<any>(null);

    const mockupItems: ShopItem[] = [
        { id: '1', name: 'Silk Evening Gown', brand: 'VALENTINO', price: '₺42,500', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80', category: 'Dress' },
        { id: '2', name: 'Tailored Wool Blazer', brand: 'SAINT LAURENT', price: '₺28,900', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80', category: 'Outerwear' },
        { id: '3', name: 'Leather Shoulder Bag', brand: 'GUCCI', price: '₺34,200', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80', category: 'Accessory' }
    ];

    useEffect(() => {
        fetchEditorial();
    }, []);

    const fetchEditorial = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/editorial`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEditorialContent(data);
            }
        } catch (error) {
            console.error('Editorial fetch failed', error);
        }
    };

    const handleAction = (type: 'like' | 'skip' | 'save') => {
        if (type === 'save') {
            showToast('Item saved to wish list');
        }
        setCurrentIndex(prev => (prev + 1) % mockupItems.length);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center overflow-x-hidden pt-12 pb-32 px-6">
            {/* Boutique Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                <button 
                    onClick={openMenu}
                    className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                >
                    <Menu size={20} className="text-gray-900" />
                </button>
                <div className="text-center">
                    <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Discover</h1>
                    <div className="flex bg-gray-100/50 p-1 rounded-full backdrop-blur-md">
                        <button 
                            onClick={() => setView('discover')}
                            className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'discover' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Swipe
                        </button>
                        <button 
                            onClick={() => setView('editorial')}
                            className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'editorial' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Editorial
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => showToast('Feature coming soon')}
                    className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                >
                    <Plus size={20} className="text-gray-900" />
                </button>
            </div>

            <div className="w-full max-w-4xl">
                {view === 'discover' ? (
                    <div className="relative h-[70vh] flex items-center justify-center">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentIndex}
                                initial={{ scale: 0.9, opacity: 0, x: 100 }}
                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                exit={{ scale: 1.1, opacity: 0, x: -100 }}
                                className="w-full max-w-sm aspect-[3/4.5] bg-white rounded-[4rem] shadow-2xl overflow-hidden relative border-[12px] border-white"
                            >
                                <img 
                                    src={mockupItems[currentIndex].image} 
                                    alt={mockupItems[currentIndex].name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
                                    <span className="text-xs font-bold uppercase tracking-[0.3em] mb-2 opacity-60">{mockupItems[currentIndex].brand}</span>
                                    <h2 className="text-4xl font-serif mb-2 leading-none tracking-tighter">{mockupItems[currentIndex].name}</h2>
                                    <p className="text-white/60 font-serif italic mb-6">{mockupItems[currentIndex].price}</p>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => handleAction('skip')}
                                            className="flex-1 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button 
                                            onClick={() => handleAction('save')}
                                            className="flex-1 py-4 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all"
                                        >
                                            <ShoppingBag size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in duration-1000">
                        {editorialContent ? (
                            <div className="bg-white/40 backdrop-blur-3xl rounded-[4rem] p-16 border border-white/60 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                                    <Sparkles size={200} />
                                </div>
                                
                                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-8 block">Daily Editorial</span>
                                <h2 className="text-7xl font-serif font-light text-gray-900 leading-none tracking-tighter mb-8 max-w-2xl">
                                    {editorialContent.title}
                                </h2>
                                
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                        {editorialContent.location || 'Paris'}
                                    </div>
                                    <div className="text-gray-400 font-serif italic">
                                        {editorialContent.weather || 'Chilly & Stylish'}
                                    </div>
                                </div>

                                <p className="text-2xl font-serif italic text-gray-600 leading-relaxed max-w-2xl mb-16 opacity-80 decoration-indigo-200 decoration-wavy underline-offset-8 underline">
                                    "{editorialContent.story}"
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {editorialContent.recommendations?.map((rec: any, i: number) => (
                                        <div key={i} className="group p-8 bg-white/60 rounded-[2.5rem] border border-white/80 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-xl">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-4 block">Style Tip {i+1}</span>
                                            <h4 className="text-2xl font-serif text-gray-900 mb-4">{rec.focus}</h4>
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">{rec.description}</p>
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Curated for you</span>
                                                <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-black/10">
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-[4rem] border border-white/60">
                                <Sparkles className="animate-spin text-indigo-200 mb-4" />
                                <p className="font-serif italic text-gray-400">Curating your daily moda editorial...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscoverPage;
