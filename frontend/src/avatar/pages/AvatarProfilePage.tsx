import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, ImagePlus, X, Sparkles, RefreshCw, Wand2,
    ChevronDown, Shirt, Check, Plus, Clock, Trash2,
    MessageSquare, ChevronLeft
} from 'lucide-react';
import { API_URL, getImageUrl } from '../../config';
import { useWardrobeStore } from '../../store/wardrobeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    imagePreview?: string;
    selectedItemPreviews?: { url: string; label: string }[];
    suggestedItems?: any[];
    loading?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    messages: Message[];
}

const QUICK_PROMPTS = [
    'Bugün ne giyeyim?',
    'Eksiklerimi söyle',
    'Casual bir kombin öner',
    'İş için ne giysem?',
];

const STORAGE_KEY = 'maison_chat_sessions';
const WELCOME_MSG: Message = {
    id: 'welcome',
    role: 'assistant',
    text: 'Merhaba! Ben senin kişisel stil asistanınım. Dolabını görüyorum — kombin önerisi, "buna ne gider?" sorusu veya fotoğraf yükleyerek danışabilirsin.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const loadSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

const generateId = () => Math.random().toString(36).substring(2, 10);

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });
    } catch { return undefined; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const StyleAssistantPage: React.FC = () => {
    const { items, fetchItems } = useWardrobeStore();

    // ── Session state ────────────────────────────────────────────────────────
    const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // ── Message state ────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showWardrobe, setShowWardrobe] = useState(false);
    const [selectedWardrobeItems, setSelectedWardrobeItems] = useState<any[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { fetchItems(); }, []);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Persist session on messages change ───────────────────────────────────
    const persistSession = useCallback((sessionId: string, msgs: Message[]) => {
        if (!sessionId) return;
        setSessions(prev => {
            const realMsgs = msgs.filter(m => !m.loading && m.id !== 'welcome');
            if (realMsgs.length === 0) return prev;
            const firstUserMsg = realMsgs.find(m => m.role === 'user');
            const title = firstUserMsg
                ? firstUserMsg.text.slice(0, 50) + (firstUserMsg.text.length > 50 ? '…' : '')
                : 'Yeni Sohbet';
            const existing = prev.find(s => s.id === sessionId);
            const updated: ChatSession = existing
                ? { ...existing, title, messages: msgs }
                : { id: sessionId, title, createdAt: new Date().toISOString(), messages: msgs };
            const rest = prev.filter(s => s.id !== sessionId);
            const next = [updated, ...rest];
            saveSessions(next);
            return next;
        });
    }, []);

    // ── New conversation ─────────────────────────────────────────────────────
    const newConversation = () => {
        const id = generateId();
        setCurrentSessionId(id);
        setMessages([WELCOME_MSG]);
        setInput('');
        setShowHistory(false);
        setSelectedWardrobeItems([]);
    };

    // ── Load session ─────────────────────────────────────────────────────────
    const loadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages.length ? session.messages : [WELCOME_MSG]);
        setShowHistory(false);
    };

    // ── Delete session ───────────────────────────────────────────────────────
    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => {
            const next = prev.filter(s => s.id !== id);
            saveSessions(next);
            return next;
        });
        if (currentSessionId === id) newConversation();
    };

    // ── Wardrobe helpers ─────────────────────────────────────────────────────
    const toggleWardrobeItem = (item: any) => {
        setSelectedWardrobeItems(prev =>
            prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]
        );
    };

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

    // ── Send message ─────────────────────────────────────────────────────────
    const sendMessage = async (overrideText?: string) => {
        const activeItems = selectedWardrobeItems;
        let text = overrideText ?? input.trim();

        if (activeItems.length > 0 && !text) {
            const labels = activeItems.map(i => `${i.brand || i.category} (${i.category.toLowerCase()})`).join(', ');
            text = `Bu parçalara ne gider? ${labels}`;
        } else if (activeItems.length > 0 && text) {
            const labels = activeItems.map(i => `${i.brand || i.category} (${i.category.toLowerCase()})`).join(', ');
            text = `${text} — Seçili parçalar: ${labels}`;
        }

        if (!text && !imageFile) return;
        if (sending) return;

        // Create session on first real message
        let sessionId = currentSessionId;
        if (!sessionId) {
            sessionId = generateId();
            setCurrentSessionId(sessionId);
        }

        const selectedItemPreviews = activeItems.map(i => ({
            url: getImageUrl(i.photos?.[0]?.url, i.category),
            label: i.brand || i.category,
        }));

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            imagePreview: imagePreview || undefined,
            selectedItemPreviews: selectedItemPreviews.length ? selectedItemPreviews : undefined,
        };
        const loadingMsg: Message = { id: 'loading', role: 'assistant', text: '', loading: true };

        const nextMessages = [...messages, userMsg, loadingMsg];
        setMessages(nextMessages);
        setInput('');
        setSelectedWardrobeItems([]);
        const capturedFile = imageFile;
        const capturedItems = activeItems;
        removeImage();
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            let imageBase64: string | undefined;

            if (capturedFile) {
                const buf = await capturedFile.arrayBuffer();
                imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            } else if (capturedItems.length > 0 && capturedItems[0].photos?.[0]?.url) {
                const photoUrl = getImageUrl(capturedItems[0].photos[0].url, capturedItems[0].category);
                imageBase64 = await fetchImageAsBase64(photoUrl);
            }

            const history = messages
                .filter(m => !m.loading && m.id !== 'welcome' && m.text)
                .map(m => ({ role: m.role, content: m.text }));

            const gender = localStorage.getItem('userGender') || 'Unisex';
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: text, imageBase64, history, gender }),
            });
            const data = await res.json();

            const suggestedItems = (data.suggestedOutfitIds || [])
                .map((id: string) => items.find(i => i.id === id))
                .filter(Boolean);

            const assistantMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                text: data.message,
                suggestedItems,
            };

            const finalMessages = [...messages, userMsg, assistantMsg];
            setMessages(finalMessages);
            persistSession(sessionId, finalMessages);
        } catch {
            const errMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                text: 'Bir sorun oluştu, tekrar dener misin?',
            };
            const finalMessages = [...messages, userMsg, errMsg];
            setMessages(finalMessages);
            persistSession(sessionId, finalMessages);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ── Group sessions by date ───────────────────────────────────────────────
    const groupedSessions = sessions.reduce<Record<string, ChatSession[]>>((acc, s) => {
        const label = formatDate(s.createdAt);
        if (!acc[label]) acc[label] = [];
        acc[label].push(s);
        return acc;
    }, {});

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex pt-20 pb-6 px-0">

            {/* ══ History Sidebar ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[90]"
                        />

                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-2xl z-[100] flex flex-col pt-20 pb-6"
                        >
                            {/* Sidebar header */}
                            <div className="px-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-gray-400 mb-1">Stil Asistanı</p>
                                        <h2 className="text-lg font-serif font-light">Sohbet Geçmişi</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={newConversation}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1a] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-colors"
                                >
                                    <Plus size={13} /> Yeni Sohbet
                                </button>
                            </div>

                            {/* Session list */}
                            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-5">
                                {Object.keys(groupedSessions).length === 0 ? (
                                    <div className="flex flex-col items-center py-12 text-center">
                                        <MessageSquare size={28} className="text-gray-200 mb-3" />
                                        <p className="text-sm font-serif italic text-gray-300">Henüz sohbet yok</p>
                                        <p className="text-[9px] font-mono text-gray-200 mt-1 uppercase tracking-wider">Asistanla konuş, geçmişin burada</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedSessions).map(([label, group]) => (
                                        <div key={label}>
                                            <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-300 mb-2 px-1">{label}</p>
                                            <div className="space-y-1">
                                                {group.map(session => (
                                                    <button
                                                        key={session.id}
                                                        onClick={() => loadSession(session)}
                                                        className={`w-full text-left px-3.5 py-3 rounded-xl transition-all group flex items-start gap-3 ${
                                                            currentSessionId === session.id
                                                                ? 'bg-[#1a1a1a] text-white'
                                                                : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                    >
                                                        <MessageSquare
                                                            size={13}
                                                            className={`mt-0.5 shrink-0 ${currentSessionId === session.id ? 'text-white/50' : 'text-gray-300'}`}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium leading-snug truncate ${currentSessionId === session.id ? 'text-white' : ''}`}>
                                                                {session.title}
                                                            </p>
                                                            <p className={`text-[9px] font-mono mt-0.5 ${currentSessionId === session.id ? 'text-white/35' : 'text-gray-300'}`}>
                                                                {session.messages.filter(m => m.role === 'user').length} mesaj
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={e => deleteSession(session.id, e)}
                                                            className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                                                                currentSessionId === session.id
                                                                    ? 'hover:bg-white/10 text-white/50 hover:text-white'
                                                                    : 'hover:bg-red-50 text-gray-300 hover:text-red-400'
                                                            }`}
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sidebar footer */}
                            <div className="px-6 pt-4 border-t border-gray-100">
                                <p className="text-[8px] font-mono text-gray-300 uppercase tracking-widest text-center">
                                    {sessions.length} sohbet kaydedildi
                                </p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ══ Main Content ═════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* ── Header ── */}
                <div className="px-6 lg:px-12 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="flex items-end justify-between gap-4"
                    >
                        <div className="flex items-end gap-4">
                            {/* History button */}
                            <button
                                onClick={() => setShowHistory(v => !v)}
                                className="mb-2 relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-all"
                            >
                                <Clock size={12} />
                                Geçmiş
                                {sessions.length > 0 && (
                                    <span className="w-4 h-4 bg-[#1a1a1a] text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                                        {sessions.length}
                                    </span>
                                )}
                            </button>

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

                        <div className="flex items-center gap-2 mb-2">
                            {/* New chat button */}
                            <button
                                onClick={newConversation}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-all bg-white"
                            >
                                <Plus size={12} /> Yeni Sohbet
                            </button>

                            {/* Wardrobe toggle */}
                            {items.length > 0 && (
                                <button
                                    onClick={() => setShowWardrobe(v => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${
                                        showWardrobe
                                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                                    }`}
                                >
                                    <Shirt size={12} />
                                    {showWardrobe ? 'Gizle' : 'Dolabım'}
                                    {selectedWardrobeItems.length > 0 && (
                                        <span className="w-4 h-4 bg-black text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                                            {selectedWardrobeItems.length}
                                        </span>
                                    )}
                                    <ChevronDown size={12} className={`transition-transform duration-300 ${showWardrobe ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
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
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[8px] font-mono uppercase tracking-[0.45em] text-gray-400">
                                            Gardırobun ({items.length} parça)
                                        </p>
                                        {selectedWardrobeItems.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                                                    {selectedWardrobeItems.length} seçili
                                                </span>
                                                <button
                                                    onClick={() => { setShowWardrobe(false); sendMessage(); }}
                                                    className="px-3 py-1.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-800 transition-colors"
                                                >
                                                    Bunları Sor →
                                                </button>
                                                <button
                                                    onClick={() => setSelectedWardrobeItems([])}
                                                    className="px-2 py-1.5 text-gray-400 text-[8px] font-mono uppercase tracking-wider hover:text-red-400 transition-colors"
                                                >
                                                    Temizle
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                        {items.map(item => {
                                            const isSelected = selectedWardrobeItems.some(i => i.id === item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleWardrobeItem(item)}
                                                    className="group flex flex-col items-center gap-1.5"
                                                >
                                                    <div className={`w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F2EE] border transition-all relative ${
                                                        isSelected
                                                            ? 'border-black shadow-md ring-2 ring-black ring-offset-1'
                                                            : 'border-black/[0.04] group-hover:shadow-md group-hover:border-black/20'
                                                    }`}>
                                                        <img
                                                            src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                            alt={item.brand}
                                                            className="w-full h-full object-contain"
                                                            style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }}
                                                        />
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shadow-lg">
                                                                    <Check size={12} className="text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!isSelected && (
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center">
                                                                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-white bg-black/60 px-2 py-1 rounded-full tracking-wider transition-all">Seç</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className={`text-[8px] font-mono truncate w-full text-center transition-colors ${isSelected ? 'text-black font-bold' : 'text-gray-400 group-hover:text-black'}`}>
                                                        {item.brand || item.category}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[8px] font-mono text-gray-300 mt-4 text-center tracking-wider">
                                        Parçalara tıkla seç · Birden fazla seçebilirsin · "Bunları Sor" ile gönder
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
                                {msg.role === 'assistant' && (
                                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-1">
                                        <Sparkles size={14} className="text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[78%] flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                    {msg.imagePreview && (
                                        <div className="rounded-2xl overflow-hidden border border-black/5 shadow-sm max-w-[200px]">
                                            <img src={msg.imagePreview} alt="yüklenen" className="w-full object-cover" />
                                        </div>
                                    )}

                                    {msg.selectedItemPreviews && msg.selectedItemPreviews.length > 0 && (
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {msg.selectedItemPreviews.map((preview, idx) => (
                                                <div key={idx} className="flex flex-col items-center gap-1">
                                                    <div className="w-14 h-[4.5rem] rounded-xl overflow-hidden border border-black/10 shadow-sm bg-[#F4F2EE]">
                                                        <img src={preview.url} alt={preview.label} className="w-full h-full object-contain" style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }} />
                                                    </div>
                                                    <p className="text-[7px] font-mono text-gray-400 truncate max-w-[56px] text-center">{preview.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

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

                                    {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-full"
                                        >
                                            <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-400 mb-2.5 ml-1">
                                                Önerilen parçalar — <span className="text-gray-300">tıkla & sor</span>
                                            </p>
                                            <div className="flex gap-3 flex-wrap">
                                                {msg.suggestedItems.map((item: any) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setInput(`Bu ${item.brand || item.category} ${item.category.toLowerCase()} parçasına ne gider?`);
                                                            textareaRef.current?.focus();
                                                        }}
                                                        className="w-[90px] group text-left hover:scale-[1.04] active:scale-95 transition-transform"
                                                    >
                                                        <div className="aspect-[3/4] rounded-[1rem] overflow-hidden bg-[#F4F2EE] border border-black/[0.04] shadow-sm mb-1.5 group-hover:border-black/20 group-hover:shadow-md transition-all relative">
                                                            <img
                                                                src={getImageUrl(item.photos?.[0]?.url, item.category)}
                                                                alt={item.brand}
                                                                className="w-full h-full object-contain"
                                                                style={{ filter: 'contrast(1.08) brightness(0.96) saturate(0.88)' }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all flex items-center justify-center">
                                                                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-white bg-black/60 px-2 py-1 rounded-full tracking-wider transition-all">Seç</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] font-medium text-gray-700 truncate group-hover:text-black transition-colors">{item.brand || 'Parça'}</p>
                                                        <p className="text-[8px] text-gray-400 font-mono uppercase tracking-wider truncate">{item.category}</p>
                                                    </button>
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
                    {messages.length <= 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 mb-4">
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

                    {/* Selected wardrobe items strip */}
                    <AnimatePresence>
                        {selectedWardrobeItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 bg-white border border-black/10 rounded-2xl p-3 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-400">
                                        {selectedWardrobeItems.length} parça seçildi · fotoğraflar AI'ya gönderilecek
                                    </p>
                                    <button onClick={() => setSelectedWardrobeItems([])} className="text-[8px] font-mono text-gray-300 hover:text-red-400 uppercase tracking-wider transition-colors">Temizle</button>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedWardrobeItems.map(item => (
                                        <div key={item.id} className="flex flex-col items-center gap-1 group relative">
                                            <div className="w-12 h-16 rounded-xl overflow-hidden border border-black/10 bg-[#F4F2EE] shadow-sm">
                                                <img src={getImageUrl(item.photos?.[0]?.url, item.category)} alt={item.brand} className="w-full h-full object-contain" />
                                            </div>
                                            <button
                                                onClick={() => toggleWardrobeItem(item)}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={8} />
                                            </button>
                                            <p className="text-[7px] font-mono text-gray-400 truncate max-w-[48px] text-center">{item.brand || item.category}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                    <p className="text-[10px] text-gray-400 mt-0.5">Fotoğraf eklendi</p>
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
                            placeholder={
                                selectedWardrobeItems.length > 0
                                    ? `${selectedWardrobeItems.length} parça seçili — bir şey yaz veya direkt gönder`
                                    : 'Bir şey sor… veya fotoğraf yükle'
                            }
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 outline-none resize-none font-serif max-h-32 py-2 leading-relaxed"
                        />

                        <button
                            onClick={() => sendMessage()}
                            disabled={sending || (!input.trim() && !imageFile && selectedWardrobeItems.length === 0)}
                            className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-lg"
                        >
                            {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>

                    <p className="text-center text-[8px] font-mono text-gray-300 uppercase tracking-[0.4em] mt-3">
                        Stil Asistanı · Dolabını görüyor · Sohbetlerin kaydediliyor
                    </p>
                </div>
            </div>

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default StyleAssistantPage;
