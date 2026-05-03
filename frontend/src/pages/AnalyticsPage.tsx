import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, PieChart, Zap, ShoppingBag, ChevronRight,
    TrendingUp, Palette, AlertCircle, Layers, Sun, Droplets, Scale
} from 'lucide-react';
import { api } from '../lib/api';

interface UtilizationRate {
    dormantCount: number;
    dormantPercentage: number;
    overallUtilizationRate: number;
    dormantByCategory: { category: string; dormantCount: number; total: number; dormantRate: number }[];
    insight: string;
}

interface ColorHarmony {
    harmonyType: string;
    dominantColors: string[];
    missingColor: string;
    insight: string;
}

interface InventoryBalance {
    gaps: { category: string; current: number; idealMin: number; deficit: number }[];
    excesses: { category: string; current: number; idealMax: number; excess: number }[];
    totalImbalances: number;
    insight: string;
}

interface SeasonalReadiness {
    currentSeason: string;
    readyCount: number;
    totalCount: number;
    readinessRate: number;
    insight: string;
}

interface AnalyticsData {
    totalItems: number;
    categoryDistribution: Record<string, number>;
    colorPalette: { color: string; count: number }[];
    brandDistribution: { brand: string; count: number }[];
    styleInsight: string;
    missingCategories: string[];
    utilizationRate: UtilizationRate;
    colorHarmony: ColorHarmony;
    inventoryBalance: InventoryBalance;
    seasonalReadiness: SeasonalReadiness;
}

const HARMONY_COLORS: Record<string, string> = {
    Analogous: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Complementary: 'bg-violet-50 text-violet-700 border-violet-100',
    Triadic: 'bg-amber-50 text-amber-700 border-amber-100',
    Eclectic: 'bg-rose-50 text-rose-700 border-rose-100',
    Monochromatic: 'bg-gray-50 text-gray-600 border-gray-100',
};

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/wardrobe')
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#F9F8F6]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full"
            />
        </div>
    );

    if (!data) return null;

    const { utilizationRate: ur, colorHarmony: ch, inventoryBalance: ib, seasonalReadiness: sr } = data;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-48 px-8 lg:px-20 relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-amber-50/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
                    <div className="flex-1">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-8">
                            <span className="w-12 h-[1px] bg-black opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Inventory Intel</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                            className="text-8xl font-serif font-light leading-none tracking-tightest text-gray-900 mb-6">
                            Style <br /><span className="italic font-normal text-gray-400">Blueprint.</span>
                        </motion.h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Wardrobe Worth</span>
                        <span className="text-4xl font-serif">{data.totalItems} <span className="text-lg italic text-gray-300">pieces</span></span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* ── 1. Style DNA Card ──────────────────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-8 bg-white rounded-[4rem] p-16 lg:p-24 shadow-elite border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                            <Activity size={320} strokeWidth={0.5} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-12 h-12 bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl">
                                    <Zap size={22} fill="currentColor" />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">Style Identity</span>
                            </div>
                            <h2 className="text-6xl lg:text-8xl font-serif text-gray-900 mb-10 leading-[0.9] tracking-tightest max-w-2xl">
                                Your DNA is <br /><span className="italic text-gray-400">{data.styleInsight}.</span>
                            </h2>
                            <p className="text-gray-400 text-xl font-serif italic leading-relaxed max-w-xl mb-16 opacity-80">
                                {ch.insight}
                            </p>
                            <div className="grid grid-cols-3 gap-12 border-t border-gray-100 pt-16">
                                <div>
                                    <p className="text-6xl font-serif mb-2">{data.totalItems}</p>
                                    <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black">Archive Pieces</p>
                                </div>
                                <div>
                                    <p className="text-6xl font-serif mb-2">{Object.keys(data.categoryDistribution).length}</p>
                                    <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black">Categories</p>
                                </div>
                                <div>
                                    <p className="text-6xl font-serif mb-2">{ur.overallUtilizationRate}%</p>
                                    <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black">Utilization</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── 2. Chromatic Palette + Harmony ────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-4 bg-black text-white rounded-[4rem] p-16 shadow-3xl relative overflow-hidden flex flex-col">
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <Palette size={24} className="text-gray-500" />
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Chromatic Palette</span>
                            </div>

                            {/* Harmony Badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest mb-8 w-fit ${HARMONY_COLORS[ch.harmonyType] || 'bg-white/10 text-white border-white/10'}`}>
                                <Droplets size={10} />
                                {ch.harmonyType}
                            </div>

                            <div className="space-y-8 flex-1">
                                {data.colorPalette.length > 0 ? data.colorPalette.map((item, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">{item.color}</span>
                                            <span className="text-2xl font-serif italic">{Math.round((item.count / data.totalItems) * 100)}%</span>
                                        </div>
                                        <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.count / data.totalItems) * 100}%` }}
                                                transition={{ duration: 1.5, delay: 0.5 + idx * 0.1 }}
                                                className="h-full bg-white shadow-[0_0_12px_white]"
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 font-serif italic">Analyzing chromatic values...</p>
                                )}
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-3">Eksik Tamamlayıcı</p>
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={16} className="text-amber-400" />
                                    <span className="text-xl font-serif italic text-white/80">{ch.missingColor}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── 3. Inventory Distribution ─────────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="lg:col-span-12 bg-white rounded-[4rem] p-20 shadow-elite border border-gray-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
                                        <PieChart size={20} />
                                    </div>
                                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-400">Inventory Distribution</span>
                                </div>
                                <h3 className="text-5xl font-serif text-gray-900 tracking-tight">Anatomy of Choice.</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-1">Imbalances Detected</p>
                                <p className={`text-4xl font-serif ${ib.totalImbalances > 0 ? 'text-amber-500' : 'text-green-500'}`}>{ib.totalImbalances}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-16 mb-16">
                            {Object.entries(data.categoryDistribution).map(([cat, count], idx) => (
                                <div key={idx} className="group">
                                    <div className="relative mb-8 flex justify-center">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.6 + idx * 0.1 }}
                                            className="w-32 h-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-sm"
                                        >
                                            <p className="text-5xl font-serif">{count}</p>
                                        </motion.div>
                                        <div className="absolute -top-3 -right-3 w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                                            {Math.round((count / data.totalItems) * 100)}%
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-black transition-colors">{cat}</p>
                                </div>
                            ))}
                        </div>

                        {/* Balance insight */}
                        <div className="bg-gray-50 rounded-[2rem] p-8 flex items-start gap-4">
                            <Scale size={18} className="text-gray-400 mt-1 shrink-0" />
                            <p className="text-gray-600 font-serif italic">{ib.insight}</p>
                        </div>

                        {/* Gaps & Excesses */}
                        {(ib.gaps.length > 0 || ib.excesses.length > 0) && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ib.gaps.map((g, i) => (
                                    <div key={i} className="flex items-center gap-4 p-5 bg-amber-50/60 rounded-2xl border border-amber-100">
                                        <div className="w-2 h-8 bg-amber-400 rounded-full" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Eksik: {g.category}</p>
                                            <p className="text-sm text-amber-800 font-serif italic">{g.current} var, {g.deficit} adet eklenmesi önerilir</p>
                                        </div>
                                    </div>
                                ))}
                                {ib.excesses.map((e, i) => (
                                    <div key={i} className="flex items-center gap-4 p-5 bg-rose-50/60 rounded-2xl border border-rose-100">
                                        <div className="w-2 h-8 bg-rose-400 rounded-full" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Fazla: {e.category}</p>
                                            <p className="text-sm text-rose-800 font-serif italic">{e.current} var, {e.excess} adet azaltılabilir</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ── 4. Utilization Rate ────────────────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="lg:col-span-6 bg-white rounded-[4rem] p-16 shadow-elite border border-gray-50">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-12 h-12 bg-gray-900 rounded-3xl flex items-center justify-center text-white">
                                <Layers size={20} />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">Utilization Rate</span>
                        </div>

                        <div className="flex items-center gap-12 mb-12">
                            {/* Ring */}
                            <div className="relative w-36 h-36 shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                                    <motion.circle
                                        cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - ur.overallUtilizationRate / 100) }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-serif font-bold">{ur.overallUtilizationRate}%</span>
                                    <span className="text-[8px] uppercase tracking-widest text-gray-400 font-black">Active</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-5xl font-serif mb-2">{ur.dormantCount}</p>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-black mb-4">Atıl Parça</p>
                                <p className="text-sm text-gray-500 font-serif italic leading-relaxed">{ur.insight}</p>
                            </div>
                        </div>

                        {ur.dormantByCategory.length > 0 && (
                            <div className="space-y-4 border-t border-gray-50 pt-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6">Kategori Bazında Atıl Oran</p>
                                {ur.dormantByCategory.map((cat, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 w-32 shrink-0 truncate">{cat.category}</p>
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.dormantRate}%` }}
                                                transition={{ duration: 1.2, delay: 0.8 + i * 0.1 }}
                                                className={`h-full rounded-full ${cat.dormantRate > 70 ? 'bg-rose-400' : cat.dormantRate > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-400 w-10 text-right">{cat.dormantRate}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ── 5. Seasonal Readiness ──────────────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                        className="lg:col-span-6 bg-black text-white rounded-[4rem] p-16 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-transparent pointer-events-none" />
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-12 h-12 bg-white/10 rounded-3xl flex items-center justify-center">
                                    <Sun size={20} className="text-amber-300" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40 block">Seasonal Readiness</span>
                                    <span className="text-sm font-serif italic text-white/60">{sr.currentSeason} sezonu</span>
                                </div>
                            </div>

                            {/* Big number */}
                            <div className="flex-1 flex items-center gap-8">
                                <div>
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        className="text-[7rem] font-serif leading-none tracking-tightest"
                                    >
                                        {sr.readinessRate}<span className="text-4xl text-white/40">%</span>
                                    </motion.p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mt-2">Aktif & Giyilebilir</p>
                                </div>
                                {/* Mini bar */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="text-right text-[10px] font-black text-white/30 uppercase tracking-widest">{sr.readyCount} / {sr.totalCount}</div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${sr.readinessRate}%` }}
                                            transition={{ duration: 1.5, delay: 0.7 }}
                                            className={`h-full rounded-full ${sr.readinessRate >= 80 ? 'bg-emerald-400' : sr.readinessRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                        />
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/20">{100 - sr.readinessRate}% mevsim dışı</div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10">
                                <p className="text-white/50 font-serif italic leading-relaxed">{sr.insight}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── 6. Archive Gaps + Style Proposal ──────────────────────────────── */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-rose-50/20 backdrop-blur-xl rounded-[4rem] p-16 border border-rose-100/50 hover:bg-rose-50/40 transition-colors">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-12 h-12 bg-white rounded-3xl flex items-center justify-center text-rose-300 shadow-sm">
                                    <AlertCircle size={24} />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-rose-400">Archive Gaps</span>
                            </div>
                            <h3 className="text-4xl font-serif text-rose-900 mb-8 italic">
                                {data.missingCategories.length > 0 ? 'Mirasınızda eksikler var.' : 'Mirasınız tam.'}
                            </h3>
                            {data.missingCategories.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {data.missingCategories.map((cat, idx) => (
                                        <span key={idx} className="px-6 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-rose-600 border border-rose-100 shadow-sm">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-rose-400 font-serif italic">Tüm temel kategoriler mevcut.</p>
                            )}
                        </div>

                        <div className="bg-black rounded-[4rem] p-16 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="w-12 h-12 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-200">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-300">Style Proposal</span>
                                    </div>
                                    <h3 className="text-6xl font-serif text-white mb-6 leading-none tracking-tightest italic font-light">Elevate your <br />Archive.</h3>
                                    <p className="text-indigo-200/40 font-serif italic text-xl">DNA'nıza hitap eden küratör seçkilerini keşfedin.</p>
                                </div>
                                <button className="mt-12 w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-2xl">
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .shadow-elite { box-shadow: 0 10px 50px rgba(0,0,0,0.02); }
                .shadow-3xl { box-shadow: 0 40px 80px rgba(0,0,0,0.3); }
                .tracking-tightest { letter-spacing: -0.06em; }
            `}</style>
        </div>
    );
};

export default AnalyticsPage;
