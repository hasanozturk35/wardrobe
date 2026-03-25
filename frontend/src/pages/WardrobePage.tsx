import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Menu, Shirt } from 'lucide-react';
import { AddItemModal } from '../components/wardrobe/AddItemModal';
import GarmentDetailModal from '../components/wardrobe/GarmentDetailModal';
import { getImageUrl } from '../config';
import { useWardrobeStore } from '../store/wardrobeStore';

interface ItemActionProps {
    onDelete: (id: string) => void;
    itemId: string;
}

const ItemActions: React.FC<ItemActionProps> = ({ onDelete, itemId }) => (
    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-gray-600 transition-colors">
            <Edit2 size={14} />
        </button>
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(itemId);
            }}
            className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors"
        >
            <Trash2 size={14} />
        </button>
    </div>
);

const WardrobePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { items, isLoading: loading, fetchItems, deleteItem } = useWardrobeStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleDelete = async (id: string) => {
        if (!confirm('Bu parçayı gardırobunuzdan silmek istediğinize emin misiniz?')) return;
        await deleteItem(id);
        setSelectedItem(null);
    };

    const filteredItems = items.filter(item => 
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-transparent pt-12 pb-12 px-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Minimalist Top Bar */}
                <div className="flex justify-between items-center mb-16">
                    <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                        <Menu size={20} className="text-gray-900" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-7xl font-light font-serif text-gray-900 tracking-tighter mb-4">Digital Wardrobe</h1>
                        <p className="text-gray-400 font-serif italic text-xl tracking-wide opacity-80 uppercase text-[12px]">Elevate your style, effortlessly.</p>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                    >
                        <Plus size={20} className="text-gray-900" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left: Item Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif text-gray-900">Collections</h2>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-6 py-2.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full w-64 focus:ring-1 focus:ring-black/10 outline-none transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-32">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md border border-white/80 rounded-[3rem] p-24 text-center">
                                <Plus className="text-gray-300 mx-auto mb-6" size={32} />
                                <h3 className="text-xl font-serif text-gray-900 mb-2">Gardırobun henüz boş</h3>
                                <button onClick={() => setIsAddModalOpen(true)} className="text-sm border-b border-black font-bold uppercase tracking-widest mt-4">Kıyafet Ekle</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="group relative" onClick={() => setSelectedItem(item)}>
                                        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white shadow-[0_10px_30px_rgb(0,0,0,0.05)] group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.1)] transition-all duration-700 relative cursor-pointer border border-white/60 p-2">
                                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-gray-50">
                                                <img
                                                    src={getImageUrl(item.photos?.[0]?.url)}
                                                    alt={item.category}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                />
                                                <ItemActions onDelete={handleDelete} itemId={item.id} />
                                            </div>
                                        </div>
                                        <div className="px-3 py-4 text-center">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 font-serif block mb-1">
                                                {item.category}
                                            </span>
                                            <h3 className="text-sm font-serif text-gray-900 tracking-wide">
                                                {item.brand || 'Lüks Parça'}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Immersive Preview */}
                    <div className="lg:w-[400px] xl:w-[500px]">
                        <div className="sticky top-12">
                            <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-white shadow-[0_40px_100px_rgba(0,0,0,0.12)] border-[8px] border-white relative group">
                                {selectedItem ? (
                                    <>
                                        <img 
                                            src={getImageUrl(selectedItem.photos?.[0]?.url)} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover animate-in fade-in zoom-in duration-700"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white">
                                            <span className="text-xs font-bold uppercase tracking-[0.3em] mb-2 block opacity-70">Featured Item</span>
                                            <h2 className="text-4xl font-serif mb-4 leading-tight">{selectedItem.brand || 'Luxury Garment'}</h2>
                                            <p className="text-white/60 font-serif italic text-lg leading-relaxed">{selectedItem.category} - A timeless addition to your digital closet.</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-8">
                                            <Shirt className="text-indigo-200" size={40} />
                                        </div>
                                        <h3 className="text-3xl font-serif text-gray-900 mb-4 leading-tight">Your Style Avatar</h3>
                                        <p className="text-gray-400 font-serif italic text-lg">Select a piece to see details and style suggestions in this immersive space.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchItems()}
            />

            {selectedItem && (
                <GarmentDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default WardrobePage;
