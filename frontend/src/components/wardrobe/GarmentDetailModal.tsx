import { X, Trash2, Edit2, Info } from 'lucide-react';
import { getImageUrl } from '../../config';

interface GarmentDetailModalProps {
    item: any; // Using any for now to match the dynamic item structure from backend
    onClose: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (item: any) => void;
}

const GarmentDetailModal: React.FC<GarmentDetailModalProps> = ({ item, onClose, onDelete, onEdit }) => {
    const imageUrl = getImageUrl(item.photos?.[0]?.url);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col md:flex-row relative max-h-[90vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all text-gray-800"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Image Viewer */}
                <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6 min-h-[40vh] md:min-h-0">
                    <img
                        src={imageUrl}
                        alt={item.category}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                    />
                </div>

                {/* Right: Details & Actions */}
                <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <div className="mb-8">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2 font-medium tracking-wide">
                            <span className="uppercase">{item.category}</span>
                            <span>•</span>
                            <span className="uppercase">{item.seasons?.join(', ') || 'Tum Mevsimler'}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 capitalize">{item.brand || 'Markasız Ürün'}</h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Renkler</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.colors ? item.colors.map((color: string) => (
                                        <span key={color} className="inline-block px-2 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium">
                                            {color}
                                        </span>
                                    )) : <span className="text-sm font-medium text-gray-700">-</span>}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Etiketler</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.tags ? item.tags.map((tag: any) => (
                                        <span key={tag.id || tag} className="inline-block px-2 py-1 bg-gray-200 rounded-md text-sm font-medium text-gray-700">
                                            #{tag.name || tag}
                                        </span>
                                    )) : <span className="text-sm font-medium text-gray-700">-</span>}
                                </div>
                            </div>
                        </div>

                        {/* Extra info box */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 leading-relaxed">
                                Bu kıyafet şu andaki filtrelerin ile eşleşiyor. Kombin oluştururken <strong>Studio</strong> bölümünden hemen deneyebilirsin.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
                        <button
                            onClick={() => onDelete?.(item.id)}
                            className="flex items-center space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl transition-all font-semibold"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>Sil</span>
                        </button>

                        <button
                            onClick={() => onEdit?.(item)}
                            className="flex items-center space-x-2 bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all font-semibold shadow-md"
                        >
                            <Edit2 className="w-5 h-5" />
                            <span>Düzenle</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GarmentDetailModal;
