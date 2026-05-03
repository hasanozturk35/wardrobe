import React, { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

// Ready Player Me demo subdomain — kayıt gerektirmez
const RPM_URL = 'https://demo.readyplayer.me/avatar?frameApi&clearCache&quickStart';

interface AvatarSynthesisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAvatarReady: () => void;
}

type Status = 'loading' | 'ready' | 'saving' | 'done';

export const AvatarSynthesisModal: React.FC<AvatarSynthesisModalProps> = ({
    isOpen,
    onClose,
    onAvatarReady,
}) => {
    const [status, setStatus] = useState<Status>('loading');

    // RPM iframe'den gelen mesajları dinle
    useEffect(() => {
        if (!isOpen) return;
        setStatus('loading');

        const handleMessage = async (event: MessageEvent) => {
            // Sadece RPM origin'inden gelen mesajlar
            if (!event.origin.includes('readyplayer.me')) return;

            const { source, eventName, data } = event.data ?? {};
            if (source !== 'readyplayerme') return;

            if (eventName === 'v1.frame.ready') {
                setStatus('ready');
            }

            if (eventName === 'v1.avatar.exported' && data?.url) {
                setStatus('saving');
                try {
                    await api.post('/avatar/set-url', { url: data.url });
                    setStatus('done');
                    // Kısa bir "başarılı" animasyonu göster, sonra kapat
                    setTimeout(() => {
                        onAvatarReady();
                        onClose();
                    }, 1800);
                } catch (err) {
                    console.error('Avatar kaydetme hatası:', err);
                    setStatus('ready');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onAvatarReady, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-2xl h-[680px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 block mb-0.5">
                                Powered by Ready Player Me
                            </span>
                            <h2 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-400" />
                                Dijital İkizinizi Yaratın
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* iframe alanı */}
                    <div className="flex-1 relative">

                        {/* Yükleniyor overlay */}
                        {status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-10">
                                <Loader2 className="animate-spin text-gray-300" size={36} />
                                <p className="text-sm text-gray-400 font-serif italic">
                                    Avatar stüdyosu açılıyor...
                                </p>
                            </div>
                        )}

                        {/* Kaydediliyor overlay */}
                        {status === 'saving' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/95 backdrop-blur-sm z-10">
                                <Loader2 className="animate-spin text-black" size={36} />
                                <p className="text-lg font-serif italic text-gray-900">
                                    Avatarınız kaydediliyor...
                                </p>
                                <p className="text-xs text-gray-400">Lütfen bekleyin</p>
                            </div>
                        )}

                        {/* Başarı overlay */}
                        {status === 'done' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-white z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                >
                                    <CheckCircle2 className="text-green-500" size={56} />
                                </motion.div>
                                <div className="text-center">
                                    <p className="text-2xl font-serif italic text-gray-900">Avatarınız hazır!</p>
                                    <p className="text-sm text-gray-400 mt-1">Stüdyoya yükleniyor...</p>
                                </div>
                            </div>
                        )}

                        {/* Ready Player Me iframe */}
                        <iframe
                            src={RPM_URL}
                            className="w-full h-full border-0"
                            allow="camera *; microphone *"
                            title="Ready Player Me Avatar Creator"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
