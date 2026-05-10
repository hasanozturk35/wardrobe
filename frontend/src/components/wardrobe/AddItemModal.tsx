import React, { useState, useRef } from 'react';
import { X, Upload, Check, Sparkles } from 'lucide-react';
import { API_URL } from '../../config';
import { useUIStore } from '../../store/uiStore';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editItem?: any;
}

const CATEGORIES = ['Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];
const COLORS = ['Siyah', 'Beyaz', 'Lacivert', 'Gri', 'Vizon', 'Bej', 'Camel', 'Kahverengi', 'Kırmızı', 'Bordo', 'Mavi', 'Yeşil', 'Sarı', 'Turuncu', 'Pembe', 'Mor'];
const SEASONS = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];
const GENDERS = [
    { value: 'Erkek',  label: '♂ Erkek' },
    { value: 'Kadın',  label: '♀ Kadın' },
    { value: 'Unisex', label: '⚤ Unisex' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSuccess, editItem }) => {
    const { showToast } = useUIStore();
    const [formData, setFormData] = useState({
        category: 'Üst Giyim',
        brand: '',
        colors: [] as string[],
        seasons: [] as string[],
        gender: (localStorage.getItem('userGender') || 'Unisex') as string,
    });
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (editItem && isOpen) {
            setFormData({
                category: editItem.category || 'Üst Giyim',
                brand: editItem.brand || '',
                colors: editItem.colors || [],
                seasons: editItem.seasons || [],
                gender: editItem.gender || localStorage.getItem('userGender') || 'Unisex',
            });
        } else if (!editItem && isOpen) {
            setFormData({
                category: 'Üst Giyim',
                brand: '',
                colors: [],
                seasons: [],
                gender: localStorage.getItem('userGender') || 'Unisex',
            });
            setImages([]);
            setPreviews([]);
        }
    }, [editItem, isOpen]);

    if (!isOpen) return null;

    const analyzeImageWithAI = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/ai/analyze-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                if (result.category || result.colors) {
                    setFormData(prev => ({
                        ...prev,
                        category: result.category || prev.category,
                        colors: result.colors || prev.colors
                    }));
                }
            }
        } catch (error) {
            console.error('AI Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const newImages = [...images, ...files].slice(0, 5); // Max 5
            setImages(newImages);

            // Clean up old previews
            previews.forEach(p => URL.revokeObjectURL(p));
            setPreviews(newImages.map(file => URL.createObjectURL(file)));

            // Trigger AI analysis if this is the first image added
            if (images.length === 0) {
                analyzeImageWithAI(files[0]);
            }
        }
    };

    const removeImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
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

            if (editItem) {
                // Edit: JSON gönder (FilesInterceptor yok, multipart parse edilmez)
                const response = await fetch(`${API_URL}/wardrobe/items/${editItem.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        category: formData.category,
                        brand: formData.brand,
                        gender: formData.gender,
                        colors: formData.colors,
                        seasons: formData.seasons,
                    }),
                });
                if (response.ok) { onSuccess(); onClose(); }
                else { showToast('Güncelleme sırasında bir hata oluştu.', 'error'); }
            } else {
                // Yeni ekleme: FormData (foto yükleme gerekli)
                const data = new FormData();
                data.append('category', formData.category);
                data.append('brand', formData.brand);
                data.append('gender', formData.gender);
                formData.colors.forEach(c => data.append('colors', c));
                formData.seasons.forEach(s => data.append('seasons', s));
                images.forEach(img => data.append('photos', img));

                const response = await fetch(`${API_URL}/wardrobe/items`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: data,
                });
                if (response.ok) { onSuccess(); onClose(); }
                else { showToast('Ekleme sırasında bir hata oluştu.', 'error'); }
            }
        } catch (error) {
            console.error('Operation failed:', error);
            showToast('Sunucuya bağlanılamadı.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
                <div className="w-full md:w-1/2 bg-gray-50 flex flex-col p-8 border-b md:border-b-0 md:border-r border-gray-100 relative max-h-[50vh] md:max-h-none overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {previews.map((previewUrl, idx) => (
                            <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-white/40 shadow-sm">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={(e) => removeImage(idx, e)}
                                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-red-50 text-gray-700 hover:text-red-500 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={14} />
                                </button>
                                {idx === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                                        Kapak
                                    </div>
                                )}
                                {idx === 0 && isAnalyzing && (
                                    <div className="absolute inset-0 z-10 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan shadow-indigo-400" />
                                        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {previews.length < 5 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black hover:bg-black/5 transition-all cursor-pointer"
                        >
                            <Upload className="w-8 h-8 mb-2" />
                            <p className="font-semibold text-sm text-center px-4">Fotoğraf Ekle ({previews.length}/5)</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                        multiple
                    />
                </div>

                {/* Form Area */}
                <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-8 flex flex-col no-scrollbar overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold font-serif">Kıyafet Ekle</h2>
                            {isAnalyzing && (
                                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-[10px] font-bold animate-pulse shadow-lg shadow-indigo-200">
                                    <Sparkles size={12} className="animate-spin" />
                                    <span className="tracking-widest uppercase">AI Analiz Ediyor...</span>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Gender */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Cinsiyet</label>
                            <div className="flex gap-2">
                                {GENDERS.map(g => (
                                    <button
                                        key={g.value}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, gender: g.value }))}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${formData.gender === g.value
                                            ? 'bg-black text-white shadow-lg shadow-black/20'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                        disabled={loading || (!editItem && images.length === 0)}
                        className={`w-full mt-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${loading || (!editItem && images.length === 0)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Arka plan kaldırılıyor...
                            </span>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Gardıroba Ekle
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes scan {
        0% { top: 0; opacity: 1; }
        50% { opacity: 0.8; }
        100% { top: 100%; opacity: 0.2; }
    }
    .animate-scan {
        position: absolute;
        width: 100%;
        animation: scan 2s linear infinite;
    }
`;
document.head.appendChild(style);
