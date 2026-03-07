import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddItemModal } from '../components/wardrobe/AddItemModal';
import { getImageUrl } from '../config';

interface ItemActionProps {
    onDelete: (id: string) => void;
    itemId: string;
}

const ItemActions: React.FC<ItemActionProps> = ({ onDelete, itemId }) => (
    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-gray-600 transition-colors">
            <Edit2 size={14} />
        </button>
        <button
            onClick={(e) => {
                e.preventDefault();
                onDelete(itemId);
            }}
            className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-colors"
        >
            <Trash2 size={14} />
        </button>
    </div>
);

const WardrobePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/wardrobe/items', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        if (!confirm('Bu parçayı gardırobunuzdan silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/wardrobe/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold font-serif text-gray-901">Dijital Gardırobun</h1>
                        <p className="text-gray-500 mt-2">Koleksiyonunu yönet ve tarzını keşfet.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Parça ara..."
                                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-full w-full md:w-64 focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/studio')}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg shadow-purple-200 active:scale-95 whitespace-nowrap font-bold"
                        >
                            <Sparkles size={20} />
                            <span>Studio</span>
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={20} />
                            <span>Kıyafet Ekle</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-24 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Plus className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Gardırobun henüz boş</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            İlk parçanı ekleyerek dijital gardırobunu oluşturmaya başla.
                        </p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
                        >
                            <Plus size={20} />
                            İlk Parçanı Ekle
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {items
                            .filter(item => item.category.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((item) => (
                                <div key={item.id} className="group relative">
                                    <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-gray-50 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500 relative">
                                        <img
                                            src={getImageUrl(item.photos?.[0]?.url)}
                                            alt={item.category}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <ItemActions onDelete={handleDelete} itemId={item.id} />
                                    </div>
                                    <div className="px-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                {item.category}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-500">{item.colors?.join(', ')}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors">
                                            {item.brand || 'Bilinmeyen Marka'}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            <AddItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />
        </div>
    );
};

export default WardrobePage;
