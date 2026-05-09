import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shirt, Sparkles, Box, Users, ChevronRight } from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        { icon: Shirt, title: 'Dijital Gardırop', desc: 'Tüm kıyafetlerinizi yüksek çözünürlüklü dijital bir koleksiyona dönüştürün.' },
        { icon: Box, title: '3D Virtual Try-On', desc: 'AI destekli motorumuzla kıyafetleri kendi 3D avatarınız üzerinde deneyin.' },
        { icon: Sparkles, title: 'AI Stil Danışmanı', desc: 'Hava durumuna ve etkinliklerinize özel, GPT-4 vizyonuyla güçlendirilmiş öneriler alın.' },
        { icon: Users, title: 'Moda Topluluğu', desc: 'Lookbook\'larınızı paylaşın ve küresel stil akımlarından ilham alın.' }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] selection:bg-black selection:text-white relative overflow-x-hidden">
            {/* Ambient Lighting Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-50/30 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Premium Minimal Navbar */}
            <nav className="fixed top-0 w-full z-50 px-12 lg:px-24 py-10 flex justify-between items-center bg-transparent">
                <div className="flex items-center gap-6 overflow-hidden">
                    <motion.div 
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                            <Shirt size={14} strokeWidth={1.5} />
                        </div>
                        <span className="text-xl font-serif font-black tracking-widest uppercase">Maison <span className="italic font-light text-gray-400">Wardrobe</span></span>
                    </motion.div>
                </div>
                <div className="flex items-center gap-12 overflow-hidden">
                    {[
                        { label: 'Koleksiyon', path: '/wardrobe' },
                        { label: 'Studio', path: '/studio' },
                        { label: 'Keşfet', path: '/discover' },
                    ].map(({ label, path }, i) => (
                        <motion.button
                            key={label}
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            onClick={() => navigate(path)}
                            className="text-[9px] font-black uppercase tracking-[0.4em] hidden md:block hover:opacity-40 transition-opacity"
                        >
                            {label}
                        </motion.button>
                    ))}
                    <motion.button 
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => navigate('/auth')}
                        className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        Giriş
                    </motion.button>
                </div>
            </nav>

            {/* Full-Screen Video Hero */}
            <section className="relative w-full h-screen overflow-hidden">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/hero-video.mp4"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="flex items-center gap-4 mb-8"
                    >
                        <span className="w-12 h-[1px] bg-white/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/60">Paris • Milan • Tokyo</span>
                        <span className="w-12 h-[1px] bg-white/40" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                        className="text-7xl md:text-[11rem] font-serif font-light leading-[0.88] tracking-tightest mb-12"
                    >
                        Moda <br />
                        <span className="italic font-normal text-white/70">Yapay Zeka <br />Devrimi.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="text-lg md:text-2xl font-serif italic text-white/60 max-w-xl leading-relaxed mb-16"
                    >
                        Gardırobunuzu yapay zeka ile profesyonel bir dijital arşive dönüştürün.
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.1 }}
                        onClick={() => navigate('/auth')}
                        className="px-14 py-5 border border-white/40 text-white text-[10px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all duration-500 rounded-full"
                    >
                        Keşfetmeye Başla
                    </motion.button>
                </div>
                {/* Scroll down indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
                >
                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">Aşağı Kaydır</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-[1px] h-10 bg-white/30"
                    />
                </motion.div>
            </section>

            {/* Exhibit Section */}
            <main className="relative z-10 pt-32 px-8 lg:px-24">

                {/* Hero Exhibit Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="mt-64 relative w-full h-[80vh] rounded-[5rem] overflow-hidden shadow-exhibit border-[15px] border-white group"
                >
                    <img 
                        src="https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80" 
                        className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-[4s] group-hover:scale-110"
                        alt="High Fashion Exhibit"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-20">
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[4rem] max-w-2xl">
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.5em] mb-6 block">Mirasın Sesi</span>
                            <h3 className="text-5xl font-serif text-white mb-8 leading-tight italic font-light">"Zarafet, göze çarpmak değil, akılda kalmaktır."</h3>
                            <button onClick={() => navigate('/studio')} className="flex items-center gap-4 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:gap-8 transition-all">
                                3D STUDIO'YU İNCELE <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Feature Showcase - The Grid */}
            <section className="py-48 px-12 lg:px-24 bg-white relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-12">
                    <h2 className="text-6xl font-serif leading-none tracking-tight">Üstün <br /><span className="italic text-gray-400">Yetenekler.</span></h2>
                    <p className="max-w-md text-gray-400 font-serif italic text-xl">Teknoloji ve estetiğin kusursuz uyumuyla gardırobunuzu yönetin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {features.map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-12 bg-[#FDFBF7] rounded-[4rem] border border-gray-50 flex flex-col items-center text-center transition-all duration-700 hover:shadow-elite hover:scale-[1.02] group"
                        >
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-sm group-hover:bg-black group-hover:text-white transition-all duration-500">
                                <f.icon size={28} strokeWidth={1} />
                            </div>
                            <h4 className="text-2xl font-serif font-black mb-6 tracking-tighter">{f.title}</h4>
                            <p className="text-gray-400 text-sm font-medium leading-[1.8] italic">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="py-32 px-12 lg:px-24 bg-[#FDFBF7] border-t border-gray-100 relative z-10">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
                    <div className="flex flex-col items-center md:items-start gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                                <Shirt size={16} />
                            </div>
                            <span className="text-2xl font-serif font-black tracking-widest uppercase">WARDROBE</span>
                        </div>
                        <p className="text-gray-400 text-[10px] font-inter font-black uppercase tracking-[0.5em]">Lüks Dijital Moda Arşivi</p>
                    </div>
                    
                    <div className="flex gap-20">
                        {[
                            { label: 'Press', path: '/feed' },
                            { label: 'Legal', path: '/auth' },
                            { label: 'Privacy', path: '/auth' },
                            { label: 'Contact', path: '/auth' },
                        ].map(({ label, path }) => (
                            <button key={label} onClick={() => navigate(path)} className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-black transition-colors">{label}</button>
                        ))}
                    </div>
                </div>
                <div className="mt-32 pt-20 border-t border-gray-100 text-center">
                    <p className="text-gray-300 text-[9px] font-black uppercase tracking-[0.5em]">© 2026 GRADUATION PROJECT • PREVIEW ONLY</p>
                </div>
            </footer>

            <style>{`
                .tracking-tightest { letter-spacing: -0.06em; }
                .shadow-elite { box-shadow: 0 10px 50px rgba(0,0,0,0.02); }
                .shadow-exhibit { box-shadow: 0 50px 100px rgba(0,0,0,0.1); }
                .shadow-3xl { box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
            `}</style>
        </div>
    );
};


export default LandingPage;
