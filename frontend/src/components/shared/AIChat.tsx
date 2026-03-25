import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, Loader2, ChevronDown } from 'lucide-react';

import { useWardrobeStore } from '../../store/wardrobeStore';
import { useStudioStore } from '../../store/studioStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    suggestedOutfitIds?: string[];
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
            text: 'Merhaba! Ben senin kişisel stil danışmanınım. Bugün nasıl görünmek istersin?',
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
            const response = await fetch('http://localhost:3000/ai/chat', {
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
                    text: data.message || (data.response ? data.response.message : data.response) || 'Yanıt alınamadı.',
                    suggestedOutfitIds: data.suggestedOutfitIds || (data.response ? data.response.suggestedOutfitIds : []) || [],
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMsg: Message = {
                id: 'error',
                text: 'Üzgünüm, şu an bağlantı kuramıyorum. Lütfen sonra tekrar dene.',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] h-[550px] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-fadeIn origin-bottom-right">
                    {/* Header */}
                    <div className="p-6 bg-black text-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Stilist</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Çevrimiçi</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-2`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-black text-white rounded-tr-none shadow-lg'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                        {msg.suggestedOutfitIds && msg.suggestedOutfitIds.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => {
                                                        const wardrobeItems = useWardrobeStore.getState().items;
                                                        const { wearItem } = useStudioStore.getState();
                                                        let foundAny = false;
                                                        msg.suggestedOutfitIds!.forEach(id => {
                                                            const item = wardrobeItems.find(w => w.id === id);
                                                            if (item) {
                                                                wearItem(item);
                                                                foundAny = true;
                                                            }
                                                        });
                                                        if (!foundAny) {
                                                            alert("Önerilen kıyafetler henüz verileriniz arasında yüklenmemiş. Lütfen gardırop sekmesinde eşitleme yapın.");
                                                        }
                                                    }}
                                                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-center flex justify-center items-center space-x-2"
                                                >
                                                    <Sparkles size={14} className="text-white" />
                                                    <span>Kombini Hemen Dene</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start items-center space-x-2 text-gray-400">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs font-medium">Stilist düşünüyor...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Quick Prompts */}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        {messages.length < 3 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {QUICK_PROMPTS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleSend(p)}
                                        className="text-[10px] font-bold bg-white px-3 py-2 rounded-lg border border-gray-100 hover:border-black transition-colors"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                                placeholder="Mesajını yaz..."
                                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-white text-black rotate-90 scale-0 opacity-0' : 'bg-black text-white scale-100 opacity-100'
                    }`}
            >
                <Sparkles size={24} className="animate-pulse" />
            </button>
        </div>
    );
};
