import React, { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { API_URL } from '../../config';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const COLORS = ['Siyah', 'Beyaz', 'Lacivert', 'Gri', 'Bej', 'Kırmızı', 'Mavi', 'Yeşil'];
const SEASONS = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        category: 'Üst Giyim',
        brand: '',
        colors: [] as string[],
        seasons: [] as string[]
    });
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const toggleArrayItem = (field: 'colors' | 'seasons', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(i => i !== value)
                : [...prev[field], value]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('category', formData.category);
            data.append('brand', formData.brand);
            formData.colors.forEach(c => data.append('colors', c));
            formData.seasons.forEach(s => data.append('seasons', s));
            if (image) data.append('photo', image);

            const response = await fetch(`${API_URL}/wardrobe/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Ekleme sırasında bir hata oluştu.');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Sunucuya bağlanılamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                {/* Image Preview Area */}
                <div
                    className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {preview ? (
                        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden group">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white w-8 h-8" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                                <Upload className="text-gray-400 w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Ürün Fotoğrafı</p>
                                <p className="text-xs text-gray-500 mt-1">PNG veya JPG seçin</p>
                            </div>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                {/* Form Area */}
                <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-8 flex flex-col no-scrollbar overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold font-serif">Kıyafet Ekle</h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Category */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Kategori</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, category: cat }))}
                                        className={`px-4 py-2 rounded-xl text-sm transition-all ${formData.category === cat
                                                ? 'bg-black text-white shadow-lg shadow-black/20'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Marka (Opsiyonel)</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                                placeholder="Örn: Zara"
                                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                            />
                        </div>

                        {/* Colors */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Renkler</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => toggleArrayItem('colors', color)}
                                        className={`px-3 py-2 rounded-xl text-xs border transition-all ${formData.colors.includes(color)
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seasons */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Mevsimler</label>
                            <div className="flex flex-wrap gap-2">
                                {SEASONS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => toggleArrayItem('seasons', s)}
                                        className={`px-3 py-2 rounded-xl text-xs border transition-all ${formData.seasons.includes(s)
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !image}
                        className={`w-full mt-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${loading || !image
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-black text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10'
                            }`}
                    >
                        {loading ? 'Yükleniyor...' : (
                            <>
                                <Check className="w-5 h-5" />
                                Gardırobu Güncelle
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
