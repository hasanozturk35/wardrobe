import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImagePlus, X, Sparkles, RefreshCw, Wand2, ChevronDown, Shirt } from 'lucide-react';
import { API_URL, getImageUrl } from '../../config';
import { useWardrobeStore } from '../../store/wardrobeStore';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imagePreview?: string;
    suggestedItems?: any[];
    loading?: boolean;
}

const QUICK_PROMPTS = [
    'Bugün ne giyeyim?',
    'Eksiklerimi söyle',
    'Casual bir kombin öner',
    'İş için ne giysem?',
];

const StyleAssistantPage: React.FC = () => {
    const { items, fetchItems } = useWardrobeStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            text: 'Merhaba! Ben senin kişisel stil asistanınım. Dolabını görüyorum — kombin önerisi, "buna ne gider?" sorusu veya fotoğraf yükleyerek danışabilirsin. 👗✨',
        }
    ]);
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showWardrobe, setShowWardrobe] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { fetchItems(); }, []);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = ev => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const sendMessage = async (overrideText?: string) => {
        const text = overrideText ?? input.trim();
        if (!text && !imageFile) return;
        if (sending) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            imagePreview: imagePreview || undefined,
        };
        const loadingMsg: Message = {
            id: 'loading',
            role: 'assistant',
            text: '',
            loading: true,
        };

        setMessages(p => [...p, userMsg, loadingMsg]);
        setInput('');
        removeImage();
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            let imageBase64: string | undefined;
            if (imageFile) {
                const buf = await imageFile.arrayBuffer();
                imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            }

            // Build conversation history (exclude welcome + loading messages)
            const history = messages
                .filter(m => !m.loading && m.id !== 'welcome' && m.text)
                .map(m => ({ role: m.role, content: m.text }));

            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: text, imageBase64, history }),
            });
            const data = await res.json();

            // Resolve suggested item objects from wardrobe store
            const suggestedItems = (data.suggestedOutfitIds || [])
                .map((id: string) => items.find(i => i.id === id))
                .filter(Boolean);

            setMessages(p => p.map(m =>
                m.id === 'loading'
                    ? { id: Date.now().toString(), role: 'assistant', text: data.message, suggestedItems }
                    : m
            ));
        } catch {
            setMessages(p => p.map(m =>
                m.id === 'loading'
                    ? { id: Date.now().toString(), role: 'assistant', text: 'Bir sorun oluştu, tekrar dener misin?' }
                    : m
            ));
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col pt-20 pb-6 px-0">

            {/* ── Header ── */}
            <div className="px-6 lg:px-12 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-end justify-between gap-4"
                >
                    <div className="flex items-end gap-4">
                        <div>
                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-gray-400 mb-2">AI Moda Asistanı</p>
                            <h1 className="text-5xl lg:text-7xl font-serif font-light tracking-tight leading-none">
                                Stil<span className="italic text-gray-300">.</span>
                            </h1>
                        </div>
                        <div className="mb-2 flex items-center gap-2 px-4 py-1.5 bg-black/5 rounded-full">
                            <Wand2 size={12} className="text-gray-500" />
                            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                                {items.length} parça görünüyor
                            </span>
                        </div>
                    </div>

                    {/* Dolabımı Göster butonu */}
                    {items.length > 0 && (
                        <button
                            onClick={() => setShowWardrobe(v => !v)}
                            className={`mb-2 flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${
                                showWardrobe
                                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                            }`}
                        >
                            <Shirt size={12} />
                            {showWardrobe ? 'Gizle' : 'Dolabımı Göster'}
                            <ChevronDown
                                size={12}
                                className={`transition-transform duration-300 ${showWardrobe ? 'rotate-180' : ''}`}
                            />
                        </button>
                    )}
                </motion.div>

                {/* ── Wardrobe Panel ── */}
                <AnimatePresence>
                    {showWardrobe && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[1.5rem] p-5 shadow-sm">
                                <p className="text-[8px] font-mono uppercase tracking-[0.45em] text-gray-400 mb-4">
                                    Gardırobundaki Parçalar ({items.length})
                                </p>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                    {items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setInput(prev => prev ? prev : `Bu parçaya ne gider? (${item.brand || item.category})`);
                                                setShowWardrobe(false);
                                                textareaRef.current?.focus();
                                            }}
                                            className="group flex flex-col items-center gap-1.5"
                                            title={`${item.brand || 'İsimsiz'} · ${item.category}`}
                                        >
                                            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F2EE] border border-black/[0.04] group-hover:shadow-md group-hover:border-black/20 transition-all">
                                                <img
                                                    src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                    alt={item.brand}
                                                    className="w-full h-full object-contain"
                                                    style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }}
                                                />
                                            </div>
                                            <p className="text-[8px] font-mono text-gray-400 truncate w-full text-center group-hover:text-black transition-colors">
                                                {item.brand || item.category}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[8px] font-mono text-gray-300 mt-4 text-center tracking-wider">
                                    Bir parçaya tıklayarak soru sor
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-12 space-y-6 pb-4 max-w-3xl w-full mx-auto">
                <AnimatePresence initial={false}>
                    {messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            {msg.role === 'assistant' && (
                                <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-1">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                            )}

                            <div className={`max-w-[78%] flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {/* User image preview */}
                                {msg.imagePreview && (
                                    <div className="rounded-2xl overflow-hidden border border-black/5 shadow-sm max-w-[200px]">
                                        <img src={msg.imagePreview} alt="yüklenen" className="w-full object-cover" />
                                    </div>
                                )}

                                {/* Bubble */}
                                {msg.loading ? (
                                    <div className="bg-white border border-gray-100 rounded-[1.25rem] rounded-tl-sm px-5 py-4 shadow-sm">
                                        <div className="flex gap-1.5 items-center h-5">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-gray-300"
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : msg.text ? (
                                    <div className={`px-5 py-4 rounded-[1.25rem] shadow-sm text-sm leading-relaxed font-serif ${
                                        msg.role === 'user'
                                            ? 'bg-[#1a1a1a] text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                ) : null}

                                {/* Suggested wardrobe items */}
                                {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="w-full"
                                    >
                                        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-400 mb-2.5 ml-1">Önerilen parçalar</p>
                                        <div className="flex gap-3 flex-wrap">
                                            {msg.suggestedItems.map((item: any) => (
                                                <div key={item.id} className="w-[90px] group">
                                                    <div className="aspect-[3/4] rounded-[1rem] overflow-hidden bg-[#F4F2EE] border border-black/[0.04] shadow-sm mb-1.5">
                                                        <img
                                                            src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                            alt={item.brand}
                                                            className="w-full h-full object-contain"
                                                            style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }}
                                                        />
                                                    </div>
                                                    <p className="text-[9px] font-medium text-gray-700 truncate">{item.brand || 'Parça'}</p>
                                                    <p className="text-[8px] text-gray-400 font-mono uppercase tracking-wider truncate">{item.category}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="px-4 lg:px-12 max-w-3xl w-full mx-auto">

                {/* Quick prompts */}
                {messages.length <= 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-wrap gap-2 mb-4"
                    >
                        {QUICK_PROMPTS.map(q => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-black hover:text-black transition-all shadow-sm"
                            >
                                {q}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Image preview strip */}
                <AnimatePresence>
                    {imagePreview && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm"
                        >
                            <img src={imagePreview} alt="önizleme" className="w-14 h-14 object-cover rounded-xl" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-700">{imageFile?.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Fotoğraf eklendi — "Buna ne gider?" diye sorabilirsin</p>
                            </div>
                            <button onClick={removeImage} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X size={13} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input box */}
                <div className="bg-white border border-gray-200 rounded-[1.5rem] shadow-sm flex items-end gap-2 p-3 focus-within:border-gray-400 transition-colors">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all shrink-0"
                        title="Fotoğraf ekle"
                    >
                        <ImagePlus size={18} />
                    </button>
                    <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageSelect} />

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Bir şey sor… veya fotoğraf yükle"
                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 outline-none resize-none font-serif max-h-32 py-2 leading-relaxed"
                    />

                    <button
                        onClick={() => sendMessage()}
                        disabled={sending || (!input.trim() && !imageFile)}
                        className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {sending
                            ? <RefreshCw size={14} className="animate-spin" />
                            : <Send size={14} />
                        }
                    </button>
                </div>

                <p className="text-center text-[8px] font-mono text-gray-300 uppercase tracking-[0.4em] mt-3">
                    Stil Asistanı · Dolabını görüyor
                </p>
            </div>


            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default StyleAssistantPage;
