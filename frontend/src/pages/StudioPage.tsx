import React, { useState, useRef } from 'react';
import { Save, Sparkles, UploadCloud, Menu, Plus, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIChat } from '../components/shared/AIChat';
import { AvatarSynthesisModal } from '../components/studio/AvatarSynthesisModal';
import AvatarViewer from '../components/studio/AvatarViewer';
import type { AvatarViewerRef } from '../components/studio/AvatarViewer';
import WardrobeMiniPanel from '../components/studio/WardrobeMiniPanel';
import { useStudioStore } from '../store/studioStore';
import { useUIStore } from '../store/uiStore';
import { api } from '../lib/api';

const StudioPage: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
    const { showToast } = useUIStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewerRef = useRef<AvatarViewerRef>(null);

    const handleAvatarReady = () => {
        window.location.reload();
    };

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
        <div className="h-screen w-full bg-[#FDFBF7] flex flex-col overflow-hidden relative">
            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-amber-50/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <AIChat />

            {/* Boutique Studio Header */}
            <header className="absolute top-0 left-0 w-full p-12 lg:p-16 flex justify-between items-start z-30 pointer-events-none">
                <div className="flex flex-col gap-8 pointer-events-auto">
                    <button className="w-16 h-16 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center shadow-elite hover:scale-110 transition-all group">
                        <Menu size={24} className="text-gray-900 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                    
                    <div className="flex flex-col">
                        <motion.h1 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-8xl font-serif font-light leading-none tracking-tightest text-gray-900 mb-2"
                        >
                            3D <br />
                            <span className="italic text-gray-400">Atelier.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500"
                        >
                            The Future of Fitting
                        </motion.p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-6 pointer-events-auto">
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsSynthesisModalOpen(true)}
                            className="h-16 px-10 bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl hover:bg-gray-800 transition-all font-serif italic text-lg gap-4 group"
                        >
                            <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                            AI Synthesis
                        </motion.button>

                        <div className="flex bg-white/80 backdrop-blur-3xl border border-gray-100 p-2 rounded-[2.2rem] shadow-elite">
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept=".glb" className="hidden" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all group"
                                title="Upload 3D Asset"
                            >
                                <UploadCloud size={20} className={`text-gray-900 ${isUploading ? 'animate-bounce' : ''}`} />
                            </button>
                            <div className="w-[1px] h-8 bg-gray-100 self-center mx-2" />
                            <button 
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all"
                                title="Toggle Collection"
                            >
                                <Plus size={20} className={`text-gray-900 transition-transform duration-500 ${isPanelOpen ? 'rotate-45' : ''}`} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 px-6 py-2 bg-white/50 backdrop-blur-xl border border-white/60 rounded-full shadow-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">System Online</span>
                    </div>
                </div>
            </header>

            {/* Main Studio Area */}
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[#f8f8f8] overflow-hidden">
                        {/* Dramatic Background Text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02]">
                            <h2 className="text-[40rem] font-serif font-light leading-none tracking-tightest">ARCHIVE</h2>
                        </div>
                        <AvatarViewer ref={viewerRef} />
                    </div>

                    {/* Floating Save Button */}
                    <div className="absolute bottom-16 right-16 z-20">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                                const name = window.prompt("Lookbook başlığını giriniz:", "Yeni Kompozisyon");
                                if (!name) return;
                                const snapshot = viewerRef.current?.captureSnapshot() || null;
                                const success = await useStudioStore.getState().saveOutfit(name, undefined, snapshot);
                                if (success) {
                                    showToast('Lookbook composite archived successfully');
                                } else {
                                    showToast('Synthesis error: No garments detected');
                                }
                            }}
                            className="h-24 px-12 bg-black text-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.3)] group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center gap-6 font-serif italic text-2xl tracking-wide">
                                <Save size={28} />
                                Archive Selection
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                        </motion.button>
                    </div>

                    {/* Immersive Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-16 left-16 p-10 bg-white/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/60 text-gray-800 max-w-sm shadow-elite"
                    >
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-gray-900/60">Synthesis Engine 4.0</span>
                        </div>
                        <p className="text-lg font-serif italic text-gray-900/80 leading-relaxed">
                            Gerçek zamanlı kumaş simülasyonu ve yüksek çözünürlüklü doku eşleme teknolojisi ile kişisel silüetinizi oluşturun.
                        </p>
                    </motion.div>
                </div>

                {/* Side Panel: Wardrobe Mini Panel */}
                <AnimatePresence>
                    {isPanelOpen && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                            className="w-[500px] h-full bg-white/80 backdrop-blur-[100px] border-l border-white/40 shadow-exhibit z-40 relative flex flex-col"
                        >
                            <div className="p-16 pt-48 flex-1 overflow-y-auto hide-scrollbar">
                                <div className="flex justify-between items-end mb-16 pb-8 border-b border-gray-100">
                                    <div>
                                        <motion.h2 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-6xl font-serif text-gray-900 tracking-tight"
                                        >
                                            Wardrobe
                                        </motion.h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-4">Personal Selection</p>
                                    </div>
                                    <span className="text-6xl font-serif text-gray-100">01</span>
                                </div>
                                <WardrobeMiniPanel />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AvatarSynthesisModal
                isOpen={isSynthesisModalOpen}
                onClose={() => setIsSynthesisModalOpen(false)}
                onAvatarReady={handleAvatarReady}
            />

            <style>{`
                .shadow-elite { box-shadow: 0 10px 40px rgba(0,0,0,0.03); }
                .shadow-exhibit { box-shadow: -40px 0 80px rgba(0,0,0,0.05); }
                .tracking-tightest { letter-spacing: -0.06em; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};


export default StudioPage;
