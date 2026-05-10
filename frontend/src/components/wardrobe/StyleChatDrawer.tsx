import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, User, Bot } from 'lucide-react';
import { api } from '../../lib/api';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { getImageUrl } from '../../config';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    suggestedOutfitIds?: string[];
}

interface StyleChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialMessage?: string;
}

export const StyleChatDrawer: React.FC<StyleChatDrawerProps> = ({ isOpen, onClose, initialMessage }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { items } = useWardrobeStore();

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: initialMessage || 'Merhaba! Ben kişisel stil danışmanın. Gardırobunu analiz ettim, bugün sana nasıl yardımcı olabilirim?'
            }]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const gender = localStorage.getItem('userGender') || 'Unisex';
            // Konuşma geçmişini gönder (ilk sistem mesajı hariç, son 10 mesaj)
            const history = newMessages
                .filter(m => m.content !== (initialMessage || 'Merhaba! Ben kişisel stil danışmanın. Gardırobunu analiz ettim, bugün sana nasıl yardımcı olabilirim?'))
                .slice(-10)
                .map(m => ({ role: m.role, content: m.content }));

            const res = await api.post('/ai/chat', { message: userMsg, gender, history });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data.message,
                suggestedOutfitIds: res.data.suggestedOutfitIds
            }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen tekrar dener misin?' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getItemById = (id: string) => items.find((i: any) => i.id === id);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-white/90 backdrop-blur-2xl shadow-[-20px_0_80px_rgba(0,0,0,0.1)] z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Sparkles size={16} className="text-amber-500" />
                                    <h3 className="text-xl font-serif italic">Stil Danışmanı</h3>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    {localStorage.getItem('userGender') === 'Erkek' ? '♂ Erkek Modu' : localStorage.getItem('userGender') === 'Kadın' ? '♀ Kadın Modu' : '⚤ Unisex Modu'}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-amber-50 text-amber-600'}`}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed font-serif ${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none italic'}`}>
                                            {msg.content}

                                            {/* Önerilen parçalar — gerçek foto */}
                                            {msg.suggestedOutfitIds && msg.suggestedOutfitIds.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-black/10">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-3 opacity-50 not-italic">Önerilen Parçalar</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.suggestedOutfitIds.map(id => {
                                                            const item = getItemById(id);
                                                            if (!item) return null;
                                                            const photoUrl = item.photos?.[0]?.url
                                                                ? getImageUrl(item.photos[0].url, item.category)
                                                                : null;
                                                            return (
                                                                <div key={id} className="flex flex-col items-center gap-1 group">
                                                                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-black/10 bg-white/60 shadow-sm">
                                                                        {photoUrl
                                                                            ? <img src={photoUrl} alt={item.brand || item.category} className="w-full h-full object-cover" />
                                                                            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">{item.category[0]}</div>
                                                                        }
                                                                    </div>
                                                                    <p className="text-[8px] font-mono uppercase tracking-wider text-gray-400 not-italic leading-tight text-center max-w-[64px] truncate">
                                                                        {item.brand || item.category}
                                                                    </p>
                                                                    <p className="text-[7px] font-mono text-gray-300 not-italic uppercase tracking-wider">
                                                                        {item.category}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-gray-100 bg-white/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Bir şey sor..."
                                    className="w-full pl-5 pr-14 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-black/5 font-serif italic text-sm"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <p className="mt-3 text-[8px] text-center uppercase tracking-widest text-gray-300 font-bold">
                                Stil Asistanı · Dolabını Görüyor
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
