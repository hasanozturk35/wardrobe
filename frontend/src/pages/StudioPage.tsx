import React, { useState, useRef } from 'react';
import AvatarViewer from '../components/studio/AvatarViewer';
import type { AvatarViewerRef } from '../components/studio/AvatarViewer';
import WardrobeMiniPanel from '../components/studio/WardrobeMiniPanel';
import { Save, Sparkles, UploadCloud, Menu, Plus } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { AIChat } from '../components/shared/AIChat';
import { api } from '../lib/api';

const StudioPage: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewerRef = useRef<AvatarViewerRef>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.glb')) {
            alert('Lütfen sadece .glb uzantılı 3D avatar dosyası yükleyin.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('glb', file);

        try {
            const res = await api.post('/avatar/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 200 || res.status === 201) {
                alert('Avatar başarıyla yüklendi!');
                window.location.reload();
            } else {
                alert(`Yükleme hatası: Bilinmeyen hata`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Avatar yüklenirken bir hata oluştu: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="h-screen w-full bg-transparent flex flex-col overflow-hidden relative">
            <AIChat />

            {/* Boutique Studio Header */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-30 pointer-events-none">
                <button className="pointer-events-auto w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                    <Menu size={20} className="text-gray-900" />
                </button>
                
                <div className="text-center">
                    <h1 className="text-5xl font-light font-serif text-gray-900 tracking-tighter mb-2">3D Studio</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Design your perfect silhouette</p>
                </div>

                <div className="flex gap-4 pointer-events-auto">
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept=".glb" className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all group"
                        title="Upload Avatar"
                    >
                        <UploadCloud size={20} className={`text-gray-900 ${isUploading ? 'animate-bounce' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                        title="Toggle Wardrobe"
                    >
                        <Plus size={20} className={`text-gray-900 transition-transform ${isPanelOpen ? 'rotate-45' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main Studio Area */}
            <div className="flex-1 relative flex">
                <div className="flex-1 relative bg-white">
                    <AvatarViewer ref={viewerRef} />

                    {/* Floating Save Button */}
                    <div className="absolute bottom-12 right-12 z-20">
                        <button
                            onClick={async () => {
                                const name = window.prompt("Kombin (Lookbook) adını giriniz:", "Benim Kombinim");
                                if (!name) return;
                                const snapshot = viewerRef.current?.captureSnapshot() || null;
                                const success = await useStudioStore.getState().saveOutfit(name, undefined, snapshot);
                                if (success) {
                                    alert('Kombin tarzınız başarıyla Lookbook\'a kaydedildi! 🔖');
                                } else {
                                    alert('Üzerinizde kıyafet yok veya kaydetme hatası!');
                                }
                            }}
                            className="btn-glass bg-black text-white px-8 py-5 hover:scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.3)] group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center gap-3 font-serif italic text-lg tracking-wide">
                                <Save size={20} />
                                Store Look
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </button>
                    </div>

                    {/* Immersive Badge */}
                    <div className="absolute bottom-12 left-12 p-6 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 text-gray-800 max-w-xs shadow-2xl">
                        <div className="flex items-center space-x-3 mb-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-900/60">Reality Engine 2.0</span>
                        </div>
                        <p className="text-sm font-serif italic text-gray-900/80 leading-relaxed">Interactive fabric simulation and real-time lighting for the ultimate boutique experience.</p>
                    </div>
                </div>

                {/* Side Panel: Wardrobe Mini Panel */}
                <div
                    className={`h-full bg-white/80 backdrop-blur-3xl border-l border-white/40 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 ${isPanelOpen ? 'w-[450px]' : 'w-0 overflow-hidden'
                        }`}
                >
                    <div className="p-8 pt-32 h-full overflow-y-auto">
                        <div className="flex justify-between items-end mb-10 pb-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-4xl font-serif text-gray-900 tracking-tight">Wardrobe</h2>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2">Personal Collection</p>
                            </div>
                            <span className="text-4xl font-serif text-gray-200">01</span>
                        </div>
                        <WardrobeMiniPanel />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudioPage;
