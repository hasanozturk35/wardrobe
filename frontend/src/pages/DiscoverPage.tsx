import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles, Menu, Plus } from 'lucide-react';
import { API_URL } from '../config';
import { useWardrobeStore } from '../store/wardrobeStore';

interface ShopItem {
    id: string;
    brand: string;
    category: string;
    price: string;
    imageUrl: string;
}

const DiscoverPage: React.FC = () => {
    const { fetchItems } = useWardrobeStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDiscover = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/shop/discover`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch (error) {
                console.error("Failed to fetch shop items", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscover();
    }, []);

    const handleSwipe = async (direction: 'left' | 'right', item: ShopItem) => {
        setItems(prev => prev.filter(i => i.id !== item.id));

        if (direction === 'right') {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/wardrobe/discover-add`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        category: item.category,
                        brand: item.brand,
                        imageUrl: item.imageUrl
                    })
                });

                if (res.ok) {
                    await fetchItems();
                }
            } catch (error) {
                console.error("Error adding discovered item", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center overflow-hidden pt-12 pb-32 px-6">
            {/* Boutique Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-16">
                <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                    <Menu size={20} className="text-gray-900" />
                </button>
                <div className="text-center">
                    <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Discover</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Curated looks for your next chapter</p>
                </div>
                <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                    <Plus size={20} className="text-gray-900" />
                </button>
            </div>

            {/* Swipe Area */}
            <div className="flex-1 w-full max-w-md relative flex items-center justify-center">
                {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                ) : items.length === 0 ? (
                    <div className="text-center p-12 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/80 shadow-2xl max-w-sm">
                        <Sparkles className="w-16 h-16 mx-auto text-indigo-300 mb-6" />
                        <h2 className="text-3xl font-serif text-gray-900 mb-4 tracking-tight">Hepsini Gördün!</h2>
                        <p className="text-gray-500 font-serif italic mb-8">Yeni sezona kadar tüm parçaları keşfettin.</p>
                        <button 
                            onClick={() => window.location.href = '/wardrobe'}
                            className="text-sm border-b border-black font-bold uppercase tracking-widest"
                        >
                            Return to Closet
                        </button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {items.map((item, index) => {
                            if (index > 1) return null;
                            const isTop = index === 0;

                            return (
                                <SwipeCard 
                                    key={item.id} 
                                    item={item} 
                                    isTop={isTop} 
                                    onSwipe={(dir) => handleSwipe(dir, item)} 
                                />
                            );
                        }).reverse()}
                    </AnimatePresence>
                )}
            </div>

            {/* Action Buttons */}
            {items.length > 0 && !loading && (
                <div className="mt-12 flex gap-12 z-20">
                    <button 
                        onClick={() => handleSwipe('left', items[0])}
                        className="w-20 h-20 bg-white/90 backdrop-blur-3xl rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:scale-110 active:scale-95 transition-all border border-white/60 group"
                    >
                        <X className="w-10 h-10 text-rose-500" strokeWidth={1} />
                    </button>
                    <button 
                        onClick={() => handleSwipe('right', items[0])}
                        className="w-20 h-20 bg-white/90 backdrop-blur-3xl rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:scale-110 active:scale-95 transition-all border border-white/60 group"
                    >
                        <Heart className="w-10 h-10 text-emerald-500 fill-current" strokeWidth={1} />
                    </button>
                </div>
            )}
        </div>
    );
};

// Extracted Swipable Card Component
const SwipeCard = ({ item, isTop, onSwipe }: { item: ShopItem, isTop: boolean, onSwipe: (dir: 'left'|'right') => void }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    
    // Label Opacities
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [0, -100], [0, 1]);

    const handleDragEnd = (_event: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            className="absolute w-full h-[65vh] max-h-[700px] rounded-[3.5rem] shadow-[0_30px_80px_rgb(0,0,0,0.15)] overflow-hidden bg-white border-[6px] border-white cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, opacity: isTop ? opacity : 1, zIndex: isTop ? 10 : 0, scale: isTop ? 1 : 0.95, translateY: isTop ? 0 : 25 }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, y: 25, opacity: 0 }}
            animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 25, opacity: 1 }}
            exit={{ x: x.get() > 0 ? 800 : -800, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
        >
            <img src={item.imageUrl} alt={item.brand} className="w-full h-full object-cover pointer-events-none" />
            
            {/* Gradients & Info */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-10 pointer-events-none text-white">
                <div className="flex justify-between items-end">
                    <div className="space-y-3">
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xl rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20 inline-block">
                            {item.category}
                        </span>
                        <h2 className="text-5xl font-light font-serif tracking-tight leading-none">{item.brand}</h2>
                        <p className="text-white/70 font-serif italic text-xl">{item.price}</p>
                    </div>
                </div>
            </div>

            {/* Swipe Overlays */}
            <motion.div 
                style={{ opacity: likeOpacity }} 
                className="absolute top-12 left-8 border-4 border-green-400 text-green-400 rounded-xl px-4 py-2 text-4xl font-black uppercase rotate-[-15deg] pointer-events-none"
            >
                LIKE
            </motion.div>
            <motion.div 
                style={{ opacity: nopeOpacity }} 
                className="absolute top-12 right-8 border-4 border-red-400 text-red-400 rounded-xl px-4 py-2 text-4xl font-black uppercase rotate-[15deg] pointer-events-none"
            >
                NOPE
            </motion.div>

        </motion.div>
    );
};

export default DiscoverPage;
