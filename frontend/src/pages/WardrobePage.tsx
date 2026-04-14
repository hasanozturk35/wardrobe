import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Menu, Shirt } from 'lucide-react';
import { AddItemModal } from '../components/wardrobe/AddItemModal';
import GarmentDetailModal from '../components/wardrobe/GarmentDetailModal';
import { getImageUrl } from '../config';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';

interface ItemActionProps {
    onDelete: (id: string) => void;
    onEdit: (item: any) => void;
    item: any;
}

const ItemActions: React.FC<ItemActionProps> = ({ onDelete, onEdit, item }) => (
    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(item);
            }}
            className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-gray-600 transition-colors"
        >
            <Edit2 size={14} />
        </button>
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(item.id);
            }}
            className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors"
        >
            <Trash2 size={14} />
        </button>
    </div>
);

const WardrobePage: React.FC = () => {
    const { openMenu } = useUIStore();
    const [searchTerm, setSearchTerm] = useState('');
    const { items, isLoading: loading, fetchItems, deleteItem } = useWardrobeStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsAddModalOpen(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsAddModalOpen(true);
    };

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
        <div className="min-h-screen bg-transparent pt-12 pb-32 px-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Boutique Header */}
                <div className="flex justify-between items-center mb-16">
                    <button 
                        onClick={openMenu}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                    >
                        <Menu size={20} className="text-gray-900" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-7xl font-light font-serif text-gray-900 tracking-tighter mb-4">Digital Wardrobe</h1>
                        <p className="text-gray-400 font-serif italic text-xl tracking-wide opacity-80 uppercase text-[12px]">Elevate your style, effortlessly.</p>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
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
                                <button onClick={handleAdd} className="text-sm border-b border-black font-bold uppercase tracking-widest mt-4">Kıyafet Ekle</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="group relative" onClick={() => setSelectedItem(item)}>
                                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white shadow-lg p-2 relative cursor-pointer border border-gray-50">
                                            <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
                                                <img
                                                    src={getImageUrl(item.photos?.[0]?.url)}
                                                    alt={item.category}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                />
                                                <ItemActions onDelete={handleDelete} onEdit={handleEdit} item={item} />
                                            </div>
                                        </div>
                                        <div className="px-3 py-6 text-center">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-1">{item.category}</span>
                                            <h3 className="text-sm font-serif text-gray-900 tracking-wide">{item.brand || 'Luxury Piece'}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Immersive Preview */}
                    <div className="lg:w-[400px] xl:w-[500px] space-y-8">
                        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-10 shadow-xl">
                            <h3 className="text-xl font-serif mb-8 text-gray-900">Style Analytics</h3>
                            <div className="space-y-6">
                                {['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı'].map((cat, i) => (
                                    <div key={cat} className="group">
                                        <div className="flex justify-between text-xs font-serif mb-2">
                                            <span>{cat}</span>
                                            <span className="opacity-40 italic">{20 + i * 5}%</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black group-hover:bg-indigo-400 transition-all" style={{ width: `${20 + i * 5}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sticky top-12 aspect-[3/4] rounded-[4rem] overflow-hidden bg-white shadow-2xl border-[10px] border-white relative group">
                            {selectedItem ? (
                                <>
                                    <img src={getImageUrl(selectedItem.photos?.[0]?.url)} className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" alt="Selection" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
                                        <span className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Featured Piece</span>
                                        <h2 className="text-5xl font-serif leading-tight mb-4">{selectedItem.brand || 'Luxury Piece'}</h2>
                                        <p className="font-serif italic text-white/60">{selectedItem.category}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                                    <Shirt className="text-indigo-200 mb-8" size={60} />
                                    <h3 className="text-3xl font-serif text-gray-900 mb-4">Style Avatar</h3>
                                    <p className="text-gray-400 font-serif italic">Select a piece to explore details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                />
            )}
        </div>
    );
};

export default WardrobePage;
