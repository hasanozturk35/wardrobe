import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, User, Bot, Shirt } from 'lucide-react';
import { api } from '../../lib/api';

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

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { 
                    role: 'assistant', 
                    content: initialMessage || 'Merhaba! Ben kişisel stil danışmanın. Gardırobunu analiz ettim, bugün sana nasıl yardımcı olabilirim?' 
                }
            ]);
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
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg });
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: res.data.message,
                suggestedOutfitIds: res.data.suggestedOutfitIds
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen tekrar dener misin?' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
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
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">AI Personal Assistant</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-amber-50 text-amber-600'}`}>
                                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed font-serif ${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none italic'}`}>
                                            {msg.content}
                                            
                                            {msg.suggestedOutfitIds && msg.suggestedOutfitIds.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-black/10 flex flex-wrap gap-2">
                                                    <span className="text-[9px] font-bold uppercase tracking-tighter block w-full mb-2 opacity-50">Önerilen Parçalar</span>
                                                    {msg.suggestedOutfitIds.map(id => (
                                                        <div key={id} className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center border border-white/10">
                                                            <Shirt size={12} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none animate-pulse">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-8 border-t border-gray-100 bg-white/50">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Stilinizle ilgili bir şey sorun..."
                                    className="w-full pl-6 pr-16 py-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-black/5 font-serif italic"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="mt-4 text-[8px] text-center uppercase tracking-widest text-gray-300 font-bold">
                                Personalized Elite Stylist Assistance
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
