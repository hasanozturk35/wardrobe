import React, { useState, useRef } from 'react';
import { X, Plus, Save, Sparkles, ChevronRight, Camera, ImagePlus } from 'lucide-react';
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
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            fetchItems();
            setSelectedItems([]);
            setName('');
            setCoverFile(null);
            setCoverPreview(null);
        }
    }, [isOpen, fetchItems]);

    const CATEGORIES = ['Tümü', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
    const filteredItems = activeCategory === 'Tümü' ? items : items.filter(i => i.category === activeCategory);

    if (!isOpen) return null;

    const toggleItem = (item: any) => {
        setSelectedItems(prev =>
            prev.find(i => i.id === item.id)
                ? prev.filter(i => i.id !== item.id)
                : [...prev, item]
        );
    };

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const toBase64 = (file: File): Promise<string> =>
        new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(file);
        });

    const handleSave = async () => {
        if (selectedItems.length === 0 && !coverFile) return;
        setLoading(true);
        try {
            let coverImage: string | null = null;
            if (coverFile) coverImage = await toBase64(coverFile);

            await api.post('/outfits', {
                name: name || 'Yeni Kombin',
                items: selectedItems.map(i => ({ garmentItemId: i.id })),
                coverImage,
                coverUrl: null,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Kombin kaydedilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const canSave = (selectedItems.length > 0 || coverFile !== null) && !loading;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-6xl h-[88vh] rounded-[3rem] overflow-hidden shadow-2xl flex border border-white/20">

                {/* ── Left: Wardrobe items ─────────────────────────────── */}
                <div className="w-[320px] shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-6 pb-3">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center text-white">
                                <Plus size={18} />
                            </div>
                            <h2 className="text-xl font-serif font-bold tracking-tight">Parçaları Seç</h2>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 grid grid-cols-2 gap-3 no-scrollbar content-start">
                        {filteredItems.map(item => (
                            <div key={item.id} onClick={() => toggleItem(item)}
                                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${selectedItems.find(i => i.id === item.id) ? 'border-indigo-500 scale-95 shadow-lg' : 'border-transparent bg-white shadow-sm hover:border-black/10'}`}>
                                <img src={getImageUrl(item.photos?.[0]?.url)} className="w-full h-full object-cover mix-blend-multiply" alt="Garment" />
                                {selectedItems.find(i => i.id === item.id) && (
                                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                                        <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                            <Sparkles size={12} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right: Cover photo upload ────────────────────────── */}
                <div className="flex-1 flex flex-col bg-[#F9F9F9] relative">
                    <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                        <button onClick={handleSave} disabled={!canSave}
                            className={`flex items-center gap-2 px-5 h-11 rounded-2xl text-sm font-serif italic transition-all ${canSave ? 'bg-black text-white shadow-lg hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            <Save size={15} />
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button onClick={onClose}
                            className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Upload area */}
                    <div className="flex-1 flex flex-col items-center justify-center p-10 gap-6">
                        {coverPreview ? (
                            <div className="relative w-full max-w-sm aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl group">
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        <Camera size={13} /> Değiştir
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-sm aspect-[3/4] rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-5 hover:border-black hover:bg-white transition-all group cursor-pointer">
                                <div className="w-16 h-16 bg-gray-100 group-hover:bg-black group-hover:text-white rounded-full flex items-center justify-center transition-all">
                                    <ImagePlus size={26} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-serif text-gray-400 group-hover:text-black transition-colors">Kombin fotoğrafı yükle</p>
                                    <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Selfie, ayna fotoğrafı, stil çekimi</p>
                                </div>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />

                        {/* Selected pieces chips */}
                        {selectedItems.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                                {selectedItems.map(item => (
                                    <span key={item.id}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-gray-100 shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                        {item.brand || item.category}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom bar */}
                    <div className="p-8 bg-white/60 backdrop-blur-xl border-t border-gray-100">
                        <div className="max-w-lg mx-auto flex items-center gap-5">
                            <div className="flex-1">
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Kombinini adlandır..."
                                    className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl font-serif italic text-lg outline-none focus:ring-2 focus:ring-black/5 transition-all" />
                            </div>
                            <button onClick={handleSave} disabled={!canSave}
                                className={`px-8 h-[56px] rounded-2xl font-serif italic text-lg flex items-center gap-3 transition-all ${canSave ? 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                                <Save size={18} />
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                {!loading && <ChevronRight size={15} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </div>
    );
};
