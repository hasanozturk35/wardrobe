import React, { useState } from 'react';
import { X, Plus, Save, Sparkles, ChevronRight, Layout } from 'lucide-react';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { getImageUrl } from '../../config';
import { api } from '../../lib/api';

interface OutfitDesignerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const OutfitDesigner: React.FC<OutfitDesignerProps> = ({ isOpen, onClose, onSuccess }) => {
    const { items, fetchItems } = useWardrobeStore();
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen, fetchItems]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Tümü');

    const CATEGORIES = ['Tümü', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

    if (!isOpen) return null;

    const filteredItems = activeCategory === 'Tümü' 
        ? items 
        : items.filter(i => i.category === activeCategory);

    const toggleItem = (item: any) => {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleSave = async () => {
        if (selectedItems.length === 0) return;
        setLoading(true);
        try {
            await api.post('/outfits', {
                name: name || 'Yeni Kombin',
                items: selectedItems.map(i => ({ garmentItemId: i.id })),
                // Use the first item's cover photo as the outfit cover
                coverUrl: selectedItems[0]?.photos?.[0]?.url || null
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Kombin kaydedilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl flex border border-white/20">
                
                {/* Left: Wardrobe Selection */}
                <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-2xl font-serif font-bold tracking-tight">Select Pieces</h2>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-0 grid grid-cols-2 gap-4 no-scrollbar">
                        {filteredItems.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => toggleItem(item)}
                                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${selectedItems.find(i => i.id === item.id) ? 'border-indigo-500 scale-95 shadow-lg' : 'border-transparent bg-white shadow-sm hover:border-black/10'}`}
                            >
                                <img src={getImageUrl(item.photos?.[0]?.url)} className="w-full h-full object-cover mix-blend-multiply" alt="Garment" />
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                {selectedItems.find(i => i.id === item.id) && (
                                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                            <Sparkles size={14} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Composition Canvas */}
                <div className="flex-1 flex flex-col relative bg-[#F9F9F9]">
                    <div className="absolute top-8 right-8 z-10">
                        <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                        {selectedItems.length === 0 ? (
                            <div className="text-center space-y-6 opacity-30">
                                <Layout size={80} strokeWidth={0.5} className="mx-auto" />
                                <p className="font-serif italic text-2xl">Start your editorial design by selecting items.</p>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center relative">
                                <div className="grid grid-cols-2 gap-8 w-full max-w-2xl animate-in zoom-in duration-500">
                                    {selectedItems.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            className={`aspect-[3/4] bg-white rounded-3xl p-4 shadow-2xl border border-white relative ${idx % 2 === 0 ? 'rotate-[-2deg] translate-y-4' : 'rotate-[2deg] -translate-y-4'}`}
                                            style={{ zIndex: selectedItems.length - idx }}
                                        >
                                            <img src={getImageUrl(item.photos?.[0]?.url)} className="w-full h-full object-contain" alt="Composition" />
                                            <span className="absolute bottom-4 left-6 text-[8px] font-bold uppercase tracking-widest text-gray-300">Item {idx + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom: Action Bar */}
                    <div className="p-10 bg-white/50 backdrop-blur-xl border-t border-gray-100">
                        <div className="max-w-xl mx-auto flex items-center gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Outfit Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Midnight in Milano"
                                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl font-serif italic text-lg outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={selectedItems.length === 0 || loading}
                                className={`px-10 h-[60px] rounded-2xl font-serif italic text-lg flex items-center gap-3 transition-all ${selectedItems.length > 0 ? 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl' : 'bg-gray-100 text-gray-300'}`}
                            >
                                <Save size={20} />
                                {loading ? 'Saving...' : 'Store Look'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
