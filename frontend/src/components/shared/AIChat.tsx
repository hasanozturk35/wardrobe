import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, MessageSquare, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWardrobeStore } from '../../store/wardrobeStore';
import { useStudioStore } from '../../store/studioStore';
import { API_URL } from '../../config';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    suggestedOutfitIds?: string[];
    shoppingSuggestion?: {
        item: string;
        price: string;
    };
}

const QUICK_PROMPTS = [
    "Ofis kombinim ne olmalı?",
    "Düğün/Etkinlik kombini öner.",
    "Spor/Rahat bir kombin hazırla.",
    "Bugün ne giymeliyim?"
];

export const AIChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Good afternoon. I am your personal style concierge. How may I assist your aesthetic journey today?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: text })
            });

            if (response.ok) {
                const data = await response.json();
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.message || 'Yanıt alınamadı.',
                    suggestedOutfitIds: data.suggestedOutfitIds || [],
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        className="mb-6 w-[400px] h-[600px] bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white/40 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/20">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-2xl text-gray-900 tracking-tight">Concierge</h3>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">Personal Stylist</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 hover:bg-black/5 rounded-full flex items-center justify-center transition-colors"
                            >
                                <ChevronDown size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                                            msg.sender === 'user' 
                                            ? 'bg-black text-white rounded-tr-none' 
                                            : 'bg-white/60 backdrop-blur-md text-gray-800 rounded-tl-none border border-white/60'
                                        }`}>
                                            {msg.text}
                                            
                                            {msg.suggestedOutfitIds && msg.suggestedOutfitIds.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const wardrobeItems = useWardrobeStore.getState().items;
                                                        const { wearItem } = useStudioStore.getState();
                                                        msg.suggestedOutfitIds!.forEach(id => {
                                                            const item = wardrobeItems.find(w => w.id === id);
                                                            if (item) wearItem(item);
                                                        });
                                                    }}
                                                    className="mt-4 w-full py-4 bg-white/20 hover:bg-white/40 border border-white/40 backdrop-blur-xl rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                                                >
                                                    <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                                                    Dress Avatar
                                                </button>
                                            )}

                                            {msg.shoppingSuggestion && (
                                                <div className="mt-4 p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white shadow-lg overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-transform">
                                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                                        <ShoppingBag size={40} />
                                                    </div>
                                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Personal Shopper Pick</p>
                                                    <p className="text-lg font-serif mb-3">{msg.shoppingSuggestion.item}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xl font-bold">{msg.shoppingSuggestion.price}</span>
                                                        <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                                                            View in Boutique
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[8px] text-gray-400 uppercase tracking-widest mt-2 px-2">
                                            {msg.sender === 'user' ? 'You' : 'Concierge'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center space-x-3 text-gray-400 p-4 bg-white/30 backdrop-blur-md rounded-2xl w-fit animate-pulse">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Styling...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        {messages.length < 3 && (
                            <div className="px-8 pb-4 flex flex-wrap gap-2">
                                {QUICK_PROMPTS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleSend(p)}
                                        className="text-[9px] font-bold bg-white/40 hover:bg-white/80 backdrop-blur-md border border-white/60 px-4 py-2 rounded-full transition-all"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-8 bg-white/20 border-t border-black/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                                    placeholder="Speak with your stylist..."
                                    className="w-full bg-white/40 border border-white/60 backdrop-blur-md rounded-2xl pl-6 pr-14 py-5 text-sm font-serif italic focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                />
                                <button
                                    onClick={() => handleSend(inputValue)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-3xl border border-white/40 transition-all duration-700 ${
                    isOpen ? 'bg-white text-black' : 'bg-black text-white'
                }`}
            >
                {isOpen ? <MessageSquare size={24} /> : <Sparkles size={24} className="animate-pulse" />}
            </motion.button>
        </div>
    );
};
