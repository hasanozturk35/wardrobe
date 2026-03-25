import React from 'react';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { useStudioStore } from '../../store/studioStore';
import { Shirt, Search, CheckCircle2 } from 'lucide-react';
import { getImageUrl } from '../../config';

const WardrobeMiniPanel: React.FC = () => {
    const { items, isLoading, fetchItems } = useWardrobeStore();
    const { wearItem, wornItems } = useStudioStore();

    React.useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const isWorn = (itemId: string) => {
        return Object.values(wornItems).some(wornItem => wornItem?.id === itemId);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search Header */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Wardrobe</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Hızlı ara..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                </div>
            </div>

            {/* Categories Toolbar */}
            <div className="px-6 py-3 flex space-x-2 overflow-x-auto no-scrollbar bg-gray-50/50">
                <button className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg whitespace-nowrap">Tümü</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg whitespace-nowrap hover:bg-gray-100">Üst</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg whitespace-nowrap hover:bg-gray-100">Alt</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg whitespace-nowrap hover:bg-gray-100">Ayakkabı</button>
            </div>

            {/* Grid List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Shirt className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Gardırobun henüz boş. Studio'da denemek için kıyafet ekle.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {items.map((item) => {
                            const currentlyWorn = isWorn(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => wearItem(item)}
                                    className={`group relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden border-2 transition-all ${currentlyWorn ? 'border-black' : 'border-transparent hover:border-black/30'}`}
                                >
                                    <img
                                        src={getImageUrl(item.photos?.[0]?.url)}
                                        alt={item.category}
                                        className={`w-full h-full object-cover transition-transform ${currentlyWorn ? 'scale-105 opacity-90' : 'group-hover:scale-110'}`}
                                    />
                                    {currentlyWorn ? (
                                        <div className="absolute top-2 right-2 bg-black text-white rounded-full p-1 shadow-md">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-[10px] font-bold tracking-widest uppercase">DENE</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WardrobeMiniPanel;
