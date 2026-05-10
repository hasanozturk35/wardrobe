import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Zap, ShoppingBag, ChevronRight, TrendingUp,
    Palette, AlertCircle, Layers, Sun, Scale, Tag, Sparkles,
    Award, BarChart2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UtilizationRate {
    dormantCount: number; dormantPercentage: number; overallUtilizationRate: number;
    dormantByCategory: { category: string; dormantCount: number; total: number; dormantRate: number }[];
    insight: string;
}
interface ColorHarmony { harmonyType: string; dominantColors: string[]; missingColor: string; insight: string; }
interface InventoryBalance {
    gaps: { category: string; current: number; idealMin: number; deficit: number }[];
    excesses: { category: string; current: number; idealMax: number; excess: number }[];
    totalImbalances: number; insight: string;
}
interface SeasonalReadiness { currentSeason: string; readyCount: number; totalCount: number; readinessRate: number; insight: string; }
interface AnalyticsData {
    totalItems: number; categoryDistribution: Record<string, number>;
    colorPalette: { color: string; count: number }[];
    brandDistribution: { brand: string; count: number }[];
    styleInsight: string; missingCategories: string[];
    utilizationRate: UtilizationRate; colorHarmony: ColorHarmony;
    inventoryBalance: InventoryBalance; seasonalReadiness: SeasonalReadiness;
}

// ─── Color name → hex ────────────────────────────────────────────────────────
const COLOR_HEX: Record<string, string> = {
    siyah:'#1c1c1c', beyaz:'#f5f5f0', gri:'#8a8a8a', grey:'#8a8a8a', gray:'#8a8a8a',
    bej:'#d4b896', beige:'#d4b896', krem:'#f0e6d3', cream:'#f0e6d3', ekru:'#ede0d0',
    lacivert:'#1a2e4a', navy:'#1a2e4a', mavi:'#2e6db4', blue:'#2e6db4',
    'açık mavi':'#6baed6', 'sky blue':'#6baed6', 'cobalt':'#0047ab',
    yeşil:'#2d7a3a', green:'#2d7a3a', haki:'#7b7042', khaki:'#7b7042',
    zeytin:'#5a5e24', olive:'#5a5e24', mint:'#5fb3a0', teal:'#2a7d7b',
    kırmızı:'#c0392b', red:'#c0392b', bordo:'#6e1f2e', burgundy:'#6e1f2e',
    turuncu:'#e07b39', orange:'#e07b39', sarı:'#d4a017', yellow:'#d4a017',
    pembe:'#d4688a', pink:'#d4688a', gül:'#c0748a', rose:'#c0748a',
    mor:'#7b4fa6', purple:'#7b4fa6', lila:'#9b72c0', lavender:'#9b72c0',
    kahverengi:'#7a4a2c', brown:'#7a4a2c', camel:'#b07850', ten:'#e8c4a0', nude:'#e8c4a0',
    şampanya:'#d4b896', champagne:'#d4b896', altın:'#c5a028', gold:'#c5a028',
};
const toHex = (name: string) => COLOR_HEX[name.toLowerCase()] ?? '#b0a898';

// ─── Harmony label map ───────────────────────────────────────────────────────
const HARMONY_TR: Record<string, string> = {
    Analogous: 'Analog', Complementary: 'Tamamlayıcı', Triadic: 'Üçlü', Eclectic: 'Eklektik', Monochromatic: 'Monokromatik',
};
const HARMONY_SCORE: Record<string, number> = {
    Triadic: 100, Complementary: 88, Analogous: 72, Eclectic: 60, Monochromatic: 48,
};
const HARMONY_BADGE: Record<string, string> = {
    Analogous: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Complementary: 'bg-violet-50 text-violet-700 border-violet-100',
    Triadic: 'bg-amber-50 text-amber-700 border-amber-100',
    Eclectic: 'bg-rose-50 text-rose-700 border-rose-100',
    Monochromatic: 'bg-stone-50 text-stone-600 border-stone-200',
};

// ─── Animated counter ────────────────────────────────────────────────────────
const Counter: React.FC<{ to: number; delay?: number; suffix?: string }> = ({ to, delay = 0, suffix = '' }) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => {
            const start = Date.now();
            const dur = 1200;
            const tick = () => {
                const p = Math.min((Date.now() - start) / dur, 1);
                const ease = 1 - Math.pow(1 - p, 3);
                setVal(Math.round(ease * to));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(t);
    }, [to, delay]);
    return <>{val}{suffix}</>;
};

// ─── AnalyticsPage ───────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData]       = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(false);

    useEffect(() => {
        api.get('/analytics/wardrobe')
            .then(r => setData(r.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    // ── Gardırop Sağlık Skoru ────────────────────────────────────────────────
    const healthScore = useMemo(() => {
        if (!data || data.totalItems === 0) return 0;
        const { utilizationRate: ur, inventoryBalance: ib, seasonalReadiness: sr, colorHarmony: ch } = data;
        const u = ur.overallUtilizationRate;
        const s = sr.readinessRate;
        const b = Math.max(0, 100 - ib.totalImbalances * 12);
        const c = HARMONY_SCORE[ch.harmonyType] ?? 60;
        return Math.round(u * 0.30 + s * 0.25 + b * 0.25 + c * 0.20);
    }, [data]);

    const scoreLabel = healthScore >= 85 ? 'Mükemmel' : healthScore >= 70 ? 'İyi' : healthScore >= 50 ? 'Geliştirilmeli' : 'Zayıf';
    const scoreColor = healthScore >= 85 ? '#16a34a' : healthScore >= 70 ? '#2563eb' : healthScore >= 50 ? '#d97706' : '#dc2626';

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F9F8F6] gap-5">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-[3px] border-black/8 border-t-black rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Analiz Hesaplanıyor</p>
        </div>
    );

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F9F8F6] gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                <AlertCircle size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-serif italic text-xl">Analiz yüklenemedi.</p>
            <button onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all">
                <RefreshCw size={12} /> Tekrar Dene
            </button>
        </div>
    );

    const { utilizationRate: ur, colorHarmony: ch, inventoryBalance: ib, seasonalReadiness: sr } = data;
    const isEmpty = data.totalItems === 0;
    const topBrand = data.brandDistribution[0]?.brand ?? null;
    const totalBrands = data.brandDistribution.length;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-48 px-6 lg:px-16 relative overflow-x-hidden">

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-20 right-0 w-[50vw] h-[50vh] bg-indigo-50/25 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 -left-20 w-[40vw] h-[40vh] bg-amber-50/15 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-[1360px] mx-auto relative z-10">

                {/* ══════════════════════════════════════════════════════════
                    HEADER
                ══════════════════════════════════════════════════════════ */}
                <header className="mb-20">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-300 mb-5 flex items-center gap-4">
                            <span className="w-10 h-px bg-gray-200 inline-block" />
                            Gardırop Zekâsı
                        </p>
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div>
                                <h1 className="text-[72px] lg:text-[96px] font-serif font-light leading-[0.88] tracking-tight text-gray-900">
                                    Stil<br />
                                    <span className="italic text-gray-300">Analizi.</span>
                                </h1>
                                {isEmpty && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                        className="flex items-center gap-3 mt-6 px-5 py-3 bg-amber-50 border border-amber-100 rounded-full w-fit">
                                        <Sparkles size={12} className="text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">
                                            Gardırobunuza parça ekleyin — analiz başlasın
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            {/* KPI strip */}
                            <div className="flex flex-wrap gap-4 lg:pb-2">
                                {[
                                    { label: 'Toplam Parça', value: data.totalItems, suffix: '' },
                                    { label: 'Kategori', value: Object.keys(data.categoryDistribution).length, suffix: '' },
                                    { label: 'Marka', value: totalBrands, suffix: '' },
                                    { label: 'Kullanım', value: ur.overallUtilizationRate, suffix: '%' },
                                ].map((kpi, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center w-[90px] h-[90px] rounded-2xl bg-white border border-gray-100 shadow-sm">
                                        <span className="text-[26px] font-serif leading-none text-gray-900">
                                            <Counter to={kpi.value} delay={300 + i * 120} suffix={kpi.suffix} />
                                        </span>
                                        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-300 mt-1 text-center px-1">{kpi.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ══════════════════════════════════════════════════════
                        ROW 1 — Sağlık Skoru + Stil DNA + Renk Paleti
                    ══════════════════════════════════════════════════════ */}

                    {/* Gardırop Sağlık Skoru */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-3 bg-black text-white rounded-[2.8rem] p-10 flex flex-col justify-between relative overflow-hidden min-h-[340px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Award size={17} className="text-amber-300" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/40">Sağlık Skoru</span>
                            </div>

                            {/* Ring */}
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                                    <motion.circle
                                        cx="50" cy="50" r="40" fill="none"
                                        stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - healthScore / 100) }}
                                        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-serif font-bold leading-none">
                                        <Counter to={healthScore} delay={600} suffix="%" />
                                    </span>
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-1" style={{ color: scoreColor }}>{scoreLabel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-white/8 pt-6">
                            {[
                                { label: 'Kullanım', val: ur.overallUtilizationRate },
                                { label: 'Mevsim', val: sr.readinessRate },
                                { label: 'Denge', val: Math.max(0, 100 - ib.totalImbalances * 12) },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 w-16 shrink-0">{m.label}</span>
                                    <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-white/60 rounded-full"
                                            initial={{ width: 0 }} animate={{ width: `${m.val}%` }}
                                            transition={{ duration: 1.2, delay: 0.8 + i * 0.1 }} />
                                    </div>
                                    <span className="text-[9px] font-black text-white/40 w-8 text-right">{m.val}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Stil DNA */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="lg:col-span-6 bg-white rounded-[2.8rem] p-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.025] group-hover:opacity-[0.06] transition-opacity duration-1000">
                            <Activity size={260} strokeWidth={0.5} />
                        </div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                                    <Zap size={18} fill="currentColor" className="text-white" />
                                </div>
                                <span className="text-[9px] font-black tracking-[0.4em] text-gray-300 uppercase">Stil Kimliği</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-gray-300 mb-2">Profiliniz</p>
                                <h2 className="text-[52px] lg:text-[60px] font-serif text-gray-900 leading-[0.88] tracking-tight mb-5">
                                    {data.styleInsight}<span className="text-gray-200">.</span>
                                </h2>
                                <p className="text-gray-400 font-serif italic text-base leading-relaxed max-w-md">
                                    {ch.insight}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-gray-50">
                                {[
                                    { num: data.totalItems, lbl: 'Parça' },
                                    { num: Object.keys(data.categoryDistribution).length, lbl: 'Kategori' },
                                    { num: ur.overallUtilizationRate, lbl: 'Kullanım %' },
                                ].map((s, i) => (
                                    <div key={i}>
                                        <p className="text-4xl font-serif text-gray-900 mb-1">{s.num}</p>
                                        <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-black">{s.lbl}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Renk Paleti */}
                    <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-3 bg-[#111] text-white rounded-[2.8rem] p-10 flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <Palette size={20} className="text-white/30" />
                            <span className="text-[9px] font-black tracking-[0.38em] uppercase text-white/30">Renk Paleti</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest mb-6 w-fit ${HARMONY_BADGE[ch.harmonyType] || 'bg-white/10 text-white border-white/10'}`}>
                            {HARMONY_TR[ch.harmonyType] || ch.harmonyType}
                        </span>

                        <div className="space-y-5 flex-1">
                            {data.colorPalette.length > 0 ? data.colorPalette.slice(0, 5).map((item, idx) => {
                                const pct = data.totalItems > 0 ? Math.round((item.count / data.totalItems) * 100) : 0;
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full shrink-0 shadow-inner ring-1 ring-white/10"
                                            style={{ background: toHex(item.color) }} />
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 capitalize">{item.color}</span>
                                                <span className="text-[10px] font-serif italic text-white/60">{pct}%</span>
                                            </div>
                                            <div className="h-[2px] bg-white/8 rounded-full overflow-hidden">
                                                <motion.div className="h-full rounded-full" style={{ background: toHex(item.color) }}
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.4, delay: 0.5 + idx * 0.1 }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-white/25 font-serif italic text-sm">Renk verisi bekleniyor</p>
                            )}
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/8">
                            <p className="text-[8px] font-black uppercase tracking-[0.38em] text-white/25 mb-2">Önerilen Tamamlayıcı</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={13} className="text-amber-400" />
                                <span className="text-base font-serif italic text-white/70">{ch.missingColor}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 2 — Kategori Anatomisi
                    ══════════════════════════════════════════════════════ */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="lg:col-span-12 bg-white rounded-[2.8rem] p-14 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 border border-gray-100 rounded-xl flex items-center justify-center">
                                        <BarChart2 size={17} className="text-gray-300" />
                                    </div>
                                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-gray-300">Kategori Dağılımı</span>
                                </div>
                                <h3 className="text-4xl font-serif text-gray-900 tracking-tight">Gardırop Anatomisi.</h3>
                            </div>
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${ib.totalImbalances > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                                <Scale size={14} className={ib.totalImbalances > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${ib.totalImbalances > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {ib.totalImbalances > 0 ? `${ib.totalImbalances} Dengesizlik` : 'Dengeli Dağılım'}
                                    </p>
                                    <p className="text-[8px] text-amber-500/70 font-mono">{ib.insight.slice(0, 55)}…</p>
                                </div>
                            </div>
                        </div>

                        {Object.keys(data.categoryDistribution).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
                                {Object.entries(data.categoryDistribution)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([cat, count], idx) => {
                                        const pct = Math.round((count / data.totalItems) * 100);
                                        return (
                                            <div key={idx} className="group text-center">
                                                <div className="relative mb-5 flex justify-center">
                                                    <motion.div
                                                        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.5 + idx * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
                                                        className="w-28 h-28 rounded-[1.8rem] bg-gray-50 flex items-center justify-center group-hover:bg-[#1a1410] group-hover:text-white transition-all duration-500 cursor-default"
                                                    >
                                                        <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{count}</p>
                                                    </motion.div>
                                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[9px] font-black text-gray-500 shadow-sm">
                                                        {pct}%
                                                    </div>
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.32em] text-gray-400 group-hover:text-black transition-colors">{cat}</p>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-36 text-gray-200 font-serif italic mb-12">
                                Henüz kategori verisi yok
                            </div>
                        )}

                        {(ib.gaps.length > 0 || ib.excesses.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ib.gaps.map((g, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-100/80">
                                        <div className="w-1.5 h-8 bg-amber-400 rounded-full mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Eksik — {g.category}</p>
                                            <p className="text-xs text-amber-800/70 font-serif italic leading-snug">
                                                {g.current} parça var · {g.deficit} adet eklenmesi önerilir
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {ib.excesses.map((e, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-rose-50/70 rounded-2xl border border-rose-100/80">
                                        <div className="w-1.5 h-8 bg-rose-400 rounded-full mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mb-0.5">Fazla — {e.category}</p>
                                            <p className="text-xs text-rose-800/70 font-serif italic leading-snug">
                                                {e.current} parça var · {e.excess} adet azaltılabilir
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 3 — Kullanım + Mevsimsel Hazırlık
                    ══════════════════════════════════════════════════════ */}

                    {/* Kullanım Oranı */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="lg:col-span-6 bg-white rounded-[2.8rem] p-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                                <Layers size={18} />
                            </div>
                            <div>
                                <span className="text-[9px] font-black tracking-[0.4em] text-gray-300 uppercase block">Kullanım Analizi</span>
                                <span className="text-[10px] font-serif italic text-gray-400">Kombin aktivitesi</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-10 mb-10">
                            <div className="relative w-32 h-32 shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="9" />
                                    <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="9"
                                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 40}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - ur.overallUtilizationRate / 100) }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-serif font-bold"><Counter to={ur.overallUtilizationRate} delay={700} suffix="%" /></span>
                                    <span className="text-[8px] uppercase tracking-widest text-gray-300 font-black">Aktif</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-4xl font-serif text-gray-900 mb-1">{ur.dormantCount}</p>
                                <p className="text-[9px] uppercase tracking-[0.38em] text-gray-300 font-black mb-3">Atıl Parça</p>
                                <p className="text-sm text-gray-400 font-serif italic leading-relaxed max-w-[240px]">{ur.insight}</p>
                            </div>
                        </div>

                        {ur.dormantByCategory.length > 0 && (
                            <div className="space-y-3.5 border-t border-gray-50 pt-8">
                                <p className="text-[9px] font-black uppercase tracking-[0.38em] text-gray-200 mb-5">Kategoriye Göre Atıl Oran</p>
                                {ur.dormantByCategory.map((cat, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 w-28 shrink-0 truncate">{cat.category}</p>
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${cat.dormantRate}%` }}
                                                transition={{ duration: 1.2, delay: 0.9 + i * 0.1 }}
                                                className={`h-full rounded-full ${cat.dormantRate > 70 ? 'bg-rose-400' : cat.dormantRate > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-300 w-9 text-right">{cat.dormantRate}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Mevsimsel Hazırlık */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="lg:col-span-6 bg-[#0f0f0f] text-white rounded-[2.8rem] p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/20 via-transparent to-purple-900/10 pointer-events-none" />
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 bg-white/8 rounded-2xl flex items-center justify-center">
                                    <Sun size={18} className="text-amber-300" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-white/25 block">Mevsimsel Hazırlık</span>
                                    <span className="text-[11px] font-serif italic text-white/50">{sr.currentSeason} sezonu</span>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center gap-8 mb-10">
                                <div>
                                    <motion.p initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.7, delay: 0.65 }}
                                        className="font-serif leading-none tracking-tight"
                                        style={{ fontSize: 'clamp(64px, 8vw, 96px)' }}>
                                        <Counter to={sr.readinessRate} delay={800} suffix="%" />
                                    </motion.p>
                                    <p className="text-[9px] font-black uppercase tracking-[0.45em] text-white/30 mt-2">Aktif & Giyilebilir</p>
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="flex justify-between text-[8px] font-black text-white/25 uppercase tracking-widest">
                                        <span>Hazır</span>
                                        <span>{sr.readyCount} / {sr.totalCount}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/8 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${sr.readinessRate}%` }}
                                            transition={{ duration: 1.5, delay: 0.75 }}
                                            className={`h-full rounded-full ${sr.readinessRate >= 80 ? 'bg-emerald-400' : sr.readinessRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                                        <span>Mevsim Dışı</span>
                                        <span>{sr.totalCount - sr.readyCount} parça</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/8">
                                <p className="text-white/45 font-serif italic leading-relaxed text-sm">{sr.insight}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 4 — Marka DNA
                    ══════════════════════════════════════════════════════ */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="lg:col-span-12 bg-white rounded-[2.8rem] p-14 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 border border-gray-100 rounded-xl flex items-center justify-center">
                                        <Tag size={17} className="text-gray-300" />
                                    </div>
                                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-gray-300">Marka DNA</span>
                                </div>
                                <h3 className="text-4xl font-serif text-gray-900 tracking-tight">Marka Dağılımı.</h3>
                            </div>
                            {topBrand && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Award size={14} className="text-amber-500" />
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">Dominant</p>
                                        <p className="text-sm font-serif text-gray-900">{topBrand} · {data.brandDistribution[0].count} parça</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {data.brandDistribution.length > 0 ? (
                            <div className="space-y-6">
                                {data.brandDistribution.map((item, idx) => {
                                    const pct = data.totalItems > 0 ? Math.round((item.count / data.totalItems) * 100) : 0;
                                    const medals = ['🥇', '🥈', '🥉'];
                                    return (
                                        <div key={idx} className="group flex items-center gap-6">
                                            <span className="text-base w-7 text-center shrink-0">{idx < 3 ? medals[idx] : <span className="text-[11px] font-black text-gray-200">{idx + 1}</span>}</span>
                                            <p className="w-32 shrink-0 text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 group-hover:text-black transition-colors truncate">{item.brand}</p>
                                            <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-gray-900 rounded-full group-hover:bg-black transition-colors"
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.3, delay: 0.5 + idx * 0.1, ease: 'easeOut' }} />
                                            </div>
                                            <div className="flex items-center gap-3 w-24 shrink-0 justify-end">
                                                <span className="text-2xl font-serif text-gray-900">{item.count}</span>
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-28 text-gray-200 font-serif italic">
                                Marka bilgisi olan parça bulunamadı
                            </div>
                        )}
                    </motion.div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 5 — Gardırop Boşlukları + CTA
                    ══════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Eksik Kategoriler */}
                        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                            className="rounded-[2.8rem] p-12 border border-rose-100/60 bg-rose-50/15 hover:bg-rose-50/30 transition-colors">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <AlertCircle size={20} className="text-rose-400" />
                                </div>
                                <span className="text-[9px] font-black tracking-[0.4em] uppercase text-rose-400">Gardırop Boşlukları</span>
                            </div>
                            <h3 className="text-4xl font-serif text-rose-900 mb-6 italic leading-tight">
                                {data.missingCategories.length > 0
                                    ? 'Bazı kategoriler\nexsik.'
                                    : 'Gardırobunuz\ntam.'}
                            </h3>
                            {data.missingCategories.length > 0 ? (
                                <>
                                    <p className="text-rose-400/70 font-serif italic text-sm mb-5">
                                        Temel kategorileri tamamlamak kombin çeşitliliğini artırır.
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {data.missingCategories.map((cat, idx) => (
                                            <span key={idx} className="px-4 py-1.5 bg-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-rose-600 border border-rose-100 shadow-sm">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-rose-400/70 font-serif italic text-sm mb-5">
                                        Tüm temel kategoriler mevcut. Gardırobunuz dengeli bir yapıya sahip.
                                    </p>
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <Sparkles size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Tüm kategoriler tamamlandı</span>
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Discover CTA */}
                        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="bg-[#0f0f0f] rounded-[2.8rem] p-12 relative overflow-hidden group cursor-pointer"
                            onClick={() => navigate('/discover')}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/15 to-purple-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between min-h-[280px]">
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 bg-white/8 rounded-2xl flex items-center justify-center">
                                            <ShoppingBag size={18} className="text-indigo-300" />
                                        </div>
                                        <span className="text-[9px] font-black tracking-[0.4em] uppercase text-indigo-400">Koleksiyon Keşfi</span>
                                    </div>
                                    <h3 className="text-5xl font-serif text-white mb-4 leading-tight italic font-light">
                                        Stilini<br />Yükselt.
                                    </h3>
                                    <p className="text-white/30 font-serif italic text-base max-w-xs leading-relaxed">
                                        DNA'nıza uygun, her gün değişen 20 yeni parçayı keşfedin.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 mt-8">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                        <ChevronRight size={22} className="text-black" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25">Keşfet sayfası</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
