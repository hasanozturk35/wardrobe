import React, { useState } from 'react';
import AvatarViewer from '../components/studio/AvatarViewer';
import WardrobeMiniPanel from '../components/studio/WardrobeMiniPanel';
import { ArrowLeft, Share2, Save, Sparkles } from 'lucide-react';
import { useStudioStore } from '../store/studioStore';
import { useNavigate } from 'react-router-dom';

const StudioPage: React.FC = () => {
    const navigate = useNavigate();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
        <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
            {/* Studio Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
                <button
                    onClick={() => navigate('/wardrobe')}
                    className="pointer-events-auto w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 hover:scale-105 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>

                <div className="flex space-x-3 pointer-events-auto">
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 hover:scale-105 active:scale-95 transition-all text-gray-600">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={async () => {
                            const success = await useStudioStore.getState().saveOutfit('Yeni Kombin');
                            if (success) {
                                alert('Kombin başarıyla kaydedildi!');
                            } else {
                                alert('Kombin kaydedilemedi veya boş.');
                            }
                        }}
                        className="px-6 h-12 bg-black text-white rounded-2xl flex items-center space-x-2 shadow-xl hover:bg-gray-800 active:scale-95 transition-all font-bold"
                    >
                        <Save className="w-5 h-5" />
                        <span>Kombini Kaydet</span>
                    </button>
                </div>
            </div>

            {/* Main Studio Area */}
            <div className="flex-1 relative flex">
                {/* 3D Viewer Container */}
                <div className="flex-1 relative bg-gradient-to-b from-gray-100 to-gray-200">
                    <AvatarViewer />

                    {/* Overlay Info/Tips */}
                    <div className="absolute bottom-10 left-10 p-4 bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 text-gray-800 max-w-xs">
                        <div className="flex items-center space-x-2 mb-1">
                            <Sparkles className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">AI Studio Alpha</span>
                        </div>
                        <p className="text-sm font-medium">Avatarı döndürmek için kaydırın, kıyafetleri denemek için yan paneli kullanın.</p>
                    </div>
                </div>

                {/* Side Panel: Wardrobe Hızlı Seçim */}
                <div
                    className={`h-full bg-white border-l border-gray-100 shadow-2xl transition-all duration-500 ease-in-out z-10 ${isPanelOpen ? 'w-96' : 'w-0 overflow-hidden'
                        }`}
                >
                    <WardrobeMiniPanel />
                </div>

                {/* Toggle Panel Button */}
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-24 bg-white border border-gray-100 rounded-2xl shadow-xl flex items-center justify-center transition-all z-20 hover:bg-gray-50 ${isPanelOpen ? 'translate-x-[calc(-96*0.25rem)] mr-96' : ''
                        }`}
                >
                    <div className="flex flex-col space-y-1 items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        <div className="w-1 h-3 bg-gray-300 rounded-full" />
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default StudioPage;
