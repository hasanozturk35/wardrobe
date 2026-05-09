import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Menu, Plus, X } from 'lucide-react';
import { API_URL, getImageUrl } from '../config';
import { useUIStore } from '../store/uiStore';

interface Outfit {
    id: string;
    name: string | null;
    coverUrl: string | null;
}

interface CalendarEvent {
    id: string;
    date: string;
    outfit: Outfit;
}

const CalendarPage: React.FC = () => {
    const { showToast } = useUIStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    
    // Modal State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [lookbookOutfits, setLookbookOutfits] = useState<Outfit[]>([]);
    const [loadingOutfits, setLoadingOutfits] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            // Format YYYY-MM
            const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const res = await fetch(`${API_URL}/calendar/events?month=${month}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    const fetchLookbook = async () => {
        try {
            setLoadingOutfits(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/outfits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLookbookOutfits(data);
            }
        } catch (error) {
            console.error("Failed to fetch lookbook", error);
        } finally {
            setLoadingOutfits(false);
        }
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        setShowModal(true);
        if (lookbookOutfits.length === 0) {
            fetchLookbook();
        }
    };

    const handleAssignOutfit = async (outfitId: string) => {
        if (!selectedDate) return;
        
        // ensure correct local date format without timezone shift issues (just send YYYY-MM-DD)
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}T12:00:00.000Z`;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/calendar/events`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ outfitId, date: dateStr })
            });

            if (res.ok) {
                setShowModal(false);
                fetchEvents();
                showToast('Kombin güne atandı.', 'success');
            } else {
                showToast('Kombin atanamadı, tekrar deneyin.', 'error');
            }
        } catch (error) {
            showToast('Bir hata oluştu.', 'error');
        }
    };

    const removeEvent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (pendingDeleteId === id) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/calendar/events/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setEvents(prev => prev.filter(ev => ev.id !== id));
                    showToast('Kombin kaldırıldı.', 'success');
                }
            } catch (error) {
                showToast('Silme işlemi başarısız.', 'error');
            } finally {
                setPendingDeleteId(null);
            }
        } else {
            setPendingDeleteId(id);
            setTimeout(() => setPendingDeleteId(null), 3000);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    // Adjust start day to Monday (1) instead of Sunday (0) if needed, but let's stick to default Sunday=0 for simplicity
    
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    return (
        <div className="min-h-screen bg-transparent pt-12 pb-32 px-6">
            <div className="max-w-[1200px] mx-auto">
                {/* Boutique Header */}
                <div className="flex justify-between items-center mb-16">
                    <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                        <Menu size={20} className="text-gray-900" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-6xl font-light font-serif text-gray-900 tracking-tighter mb-4">Calendar</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-70">Plan your style journey</p>
                    </div>
                    <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-all">
                        <Plus size={20} className="text-gray-900" />
                    </button>
                </div>

                {/* Calendar Controls */}
                <div className="bg-white/80 backdrop-blur-lg rounded-t-[2.5rem] border border-white/60 p-8 flex items-center justify-between shadow-sm">
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-white/60 hover:shadow-md"
                    >
                        <ArrowLeft />
                    </button>
                    <h2 className="text-3xl font-light font-serif tracking-tight">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-white/60 hover:shadow-md"
                    >
                        <ArrowRight />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white/40 backdrop-blur-md border-x border-b border-white/60 rounded-b-[2.5rem] p-8 shadow-[0_20px_60px_rgb(0,0,0,0.05)]">
                    <div className="grid grid-cols-7 gap-6 mb-8 text-center font-bold text-gray-400 text-xs uppercase tracking-[0.2em] font-serif">
                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-4 md:gap-6">
                        {emptyDays.map(i => (
                            <div key={`empty-${i}`} className="h-32 md:h-40 rounded-3xl bg-gray-50/30 border border-white/40" />
                        ))}

                        {daysArray.map(day => {
                            // Find events for this day
                            const dayEvents = events.filter(e => {
                                const ed = new Date(e.date);
                                return ed.getDate() === day && ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear();
                            });
                            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div 
                                    key={day} 
                                    onClick={() => handleDayClick(day)}
                                    className={`relative h-32 md:h-40 rounded-3xl border transition-all cursor-pointer overflow-hidden group shadow-sm
                                        ${isToday ? 'border-orange-300 bg-orange-50/20' : 'border-white bg-white/60 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1'}
                                    `}
                                >
                                    <span className={`absolute top-3 left-3 text-sm font-bold z-10 w-9 h-9 flex items-center justify-center rounded-2xl transition-colors
                                        ${isToday ? 'bg-orange-400 text-white shadow-lg' : 'text-gray-900 bg-white/80 group-hover:bg-orange-100'}
                                    `}>
                                        {day}
                                    </span>

                                    {dayEvents.length > 0 ? (
                                        <div className="w-full h-full relative p-1">
                                            {dayEvents[0].outfit.coverUrl && (
                                                <img 
                                                    src={getImageUrl(dayEvents[0].outfit.coverUrl)} 
                                                    alt="Outfit" 
                                                    className="w-full h-full object-cover rounded-[1.4rem]"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <button
                                                    onClick={(e) => removeEvent(dayEvents[0].id, e)}
                                                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all shadow-xl ${pendingDeleteId === dayEvents[0].id ? 'bg-red-500 text-white scale-100' : 'bg-white text-red-500 scale-75 hover:scale-100'}`}
                                                >
                                                    {pendingDeleteId === dayEvents[0].id ? 'Sil?' : <X size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-12 h-12 rounded-full bg-white text-orange-400 flex items-center justify-center shadow-lg border border-orange-100 transform translate-y-2 group-hover:translate-y-0">
                                                <Plus size={24} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Outfit Selector Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setShowModal(false)}>
                    <div 
                        className="bg-white/95 backdrop-blur-xl w-full max-w-3xl rounded-t-[3rem] md:rounded-[3.5rem] p-10 max-h-[85vh] flex flex-col shadow-2xl border border-white/60"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-3xl font-light font-serif tracking-tight">
                                    {selectedDate?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-gray-500 font-serif italic">Günün kombinini seç</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X size={28} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 pb-4 scroll-smooth">
                            {loadingOutfits ? (
                                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" /></div>
                            ) : lookbookOutfits.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">Lookbook'ta hiç kombininiz yok. Önce Lookbook'a kombin kaydedin!</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {lookbookOutfits.map(outfit => (
                                        <div 
                                            key={outfit.id} 
                                            onClick={() => handleAssignOutfit(outfit.id)}
                                            className="bg-gray-50 rounded-2xl aspect-[3/4] overflow-hidden cursor-pointer hover:ring-4 ring-indigo-500 transition-all relative group"
                                        >
                                            {outfit.coverUrl ? (
                                                <img src={getImageUrl(outfit.coverUrl)} alt="Kombin" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">Görsel Yok</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
