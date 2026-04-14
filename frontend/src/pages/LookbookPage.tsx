import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Calendar, Share2, Menu, Plus, Sparkles, Layout } from 'lucide-react';
import { API_URL, getImageUrl } from '../config';
import { OutfitDesigner } from '../components/wardrobe/OutfitDesigner';
import { useUIStore } from '../store/uiStore';

interface OutfitItem {
    id: string;
    garmentItem: {
        category: string;
        brand: string | null;
        photos: { url: string }[];
    };
    slot: string | null;
}

interface Outfit {
    id: string;
    name: string | null;
    description: string | null;
    coverUrl: string | null;
    createdAt: string;
    isPublic?: boolean;
    items: OutfitItem[];
}

const LookbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { openMenu, showToast } = useUIStore();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    useEffect(() => {
        fetchOutfits();
    }, []);

    const fetchOutfits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/outfits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOutfits(data);
            }
        } catch (error) {
            console.error('Failed to fetch outfits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bu kombini silmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/outfits/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setOutfits(prev => prev.filter(o => o.id !== id));
                showToast('Outfit deleted successfully');
            } else {
                alert('Kombin silinirken bir hata oluştu.');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleShare = async (id: string, currentPublicStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/social/share/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setOutfits(prev => prev.map(o => o.id === id ? { ...o, isPublic: !currentPublicStatus } : o));
                showToast(currentPublicStatus ? 'Removed from community feed' : 'Published to community feed');
            } else {
                alert('Paylaşım durumu değiştirilemedi.');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pt-12 pb-32 px-6">
            <div className="max-w-[1200px] mx-auto">
                {/* Boutique Header */}
                <div className="flex justify-between items-center mb-16">
                    <button 
                        onClick={openMenu}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                    >
                        <Menu size={20} className="text-gray-900" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Lookbook</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Your personal style gallery</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsDesignerOpen(true)}
                            className="h-12 px-6 bg-black text-white rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-all group"
                        >
                            <Sparkles size={18} className="group-hover:animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Design Look</span>
                        </button>
                        <button 
                            onClick={() => navigate('/studio')}
                            className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                        >
                            <Layout size={20} className="text-gray-900" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                ) : outfits.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-md border-2 border-dashed border-white/80 rounded-[3.5rem] p-24 text-center shadow-sm">
                        <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Sparkles className="text-indigo-300" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-serif">Henüz kombin kaydetmedin</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto font-serif italic">
                            Studio'ya giderek ilk kombinini oluştur ve Lookbook'una kaydet!
                        </p>
                        <button
                            onClick={() => navigate('/studio')}
                            className="bg-black text-white px-10 py-5 rounded-2xl hover:scale-105 transition-all"
                        >
                            Studio'ya Git
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {outfits.map(outfit => (
                            <div key={outfit.id} className="bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-50">
                                {/* Cover Image */}
                                <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white shadow-lg group-hover:shadow-2xl transition-all duration-500 relative cursor-pointer border border-white/60 p-3">
                                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-gray-50">
                                        {outfit.coverUrl ? (
                                            <img 
                                                src={getImageUrl(outfit.coverUrl)} 
                                                alt={outfit.name || 'Outfit'} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 uppercase tracking-widest text-gray-300 font-serif">Outfit</div>
                                        )}
                                        
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(`${window.location.origin}/lookbook/${outfit.id}`);
                                                    showToast('Link copied to clipboard');
                                                }}
                                                className="p-3 bg-white/90 backdrop-blur-md rounded-full transition-colors shadow-sm hover:bg-black hover:text-white"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(outfit.id, e)}
                                                className="p-3 bg-white/90 backdrop-blur-md rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="px-4 py-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 font-serif tracking-tight">{outfit.name || 'Editorial Look'}</h3>
                                    <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                        {new Date(outfit.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <OutfitDesigner 
                isOpen={isDesignerOpen} 
                onClose={() => setIsDesignerOpen(false)} 
                onSuccess={fetchOutfits} 
            />
        </div>
    );
};

export default LookbookPage;
