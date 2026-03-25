import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, 
    PieChart, 
    Zap, 
    ShoppingBag, 
    ChevronRight, 
    TrendingUp, 
    Palette,
    AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

interface AnalyticsData {
    totalItems: number;
    categoryDistribution: Record<string, number>;
    colorPalette: { color: string; count: number }[];
    brandDistribution: { brand: string; count: number }[];
    styleInsight: string;
    missingCategories: string[];
}

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/wardrobe');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#F9F8F6]">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full"
            />
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-[#F9F8F6] pt-32 pb-40 px-8 lg:px-24">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-16 text-center"
            >
                <h1 className="text-5xl lg:text-7xl font-serif text-gray-900 mb-4 tracking-tight">
                    Style Blueprint
                </h1>
                <p className="text-gray-500 font-light tracking-widest uppercase text-xs">
                    Curated Insights • Your Digital Wardrobe AI
                </p>
            </motion.div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Hero Analytics Card - Style DNA */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-black/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={120} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Style Identity</span>
                        </div>
                        
                        <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-6 max-w-md">
                            Your DNA is {data.styleInsight}.
                        </h2>
                        
                        <p className="text-gray-500 text-lg font-light leading-relaxed max-w-xl mb-10">
                            Based on your recent acquisitions and collections, we see a strong leaning towards 
                            structural silhouettes and a cohesive color palette.
                        </p>
                        
                        <div className="flex gap-12">
                            <div>
                                <p className="text-4xl font-serif mb-1">{data.totalItems}</p>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Pieces</p>
                            </div>
                            <div>
                                <p className="text-4xl font-serif mb-1">{Object.keys(data.categoryDistribution).length}</p>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Categories</p>
                            </div>
                            <div>
                                <div className="flex -space-x-2 mb-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
                                    ))}
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Brand Mix</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Color Palette Card */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-4 bg-black text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <Palette size={20} className="text-gray-400" />
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Color Palette</span>
                    </div>

                    <div className="space-y-8">
                        {data.colorPalette.length > 0 ? data.colorPalette.map((item, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs tracking-widest uppercase opacity-60">{item.color}</span>
                                    <span className="text-lg font-serif">{Math.round((item.count / data.totalItems) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / data.totalItems) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                        className="h-full bg-white"
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm font-light italic">No color data available yet.</p>
                        )}
                    </div>
                </motion.div>

                {/* 3. Category Distribution */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-12 bg-white rounded-[2.5rem] p-12 shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-black/5"
                >
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex items-center gap-3">
                            <PieChart size={20} className="text-gray-400" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Inventory Distribution</span>
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                            Full Report <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                        {Object.entries(data.categoryDistribution).map(([cat, count], idx) => (
                            <div key={idx} className="text-center group">
                                <div className="relative mb-6 inline-block">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.6 + idx * 0.1 }}
                                        className="w-24 h-24 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-gray-50 transition-colors"
                                    >
                                        <p className="text-3xl font-serif">{count}</p>
                                    </motion.div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {Math.round((count / data.totalItems) * 100)}%
                                    </div>
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">{cat}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 4. Missing Categories & Recommendations */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <div className="bg-rose-50/50 rounded-[2.5rem] p-10 border border-rose-100 overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-8">
                            <AlertCircle size={20} className="text-rose-400" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-rose-400">Optimization Required</span>
                        </div>
                        <h3 className="text-3xl font-serif text-rose-900 mb-4">Gaps in your collection.</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.missingCategories.map((cat, idx) => (
                                <span key={idx} className="px-4 py-2 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest text-rose-800 border border-rose-200">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-[2.5rem] p-10 border border-indigo-100 group cursor-pointer hover:bg-indigo-50 transition-colors">
                        <div className="flex items-center gap-3 mb-8">
                            <ShoppingBag size={20} className="text-indigo-400" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-indigo-400">Curated For You</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-serif text-indigo-900 mb-2">Enhance your style.</h3>
                                <p className="text-indigo-600/60 text-sm font-light">Explore selected pieces that fit your DNA.</p>
                            </div>
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default AnalyticsPage;
