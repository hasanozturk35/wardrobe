import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Lock, Mail, User, ArrowRight, Loader2, Instagram, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BG_IMAGE = '/src/assets/quiet_luxury_wardrobe_bg_1772833697604.png';
const AVATAR_IMAGE = '/src/assets/pinterest_fashion_couple_editorial_1772833854361.png';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setSuccessMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    
    // Parallax State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSocialLogin = (provider: string) => {
        // Redirection to Backend OAuth Endpoint
        const backendBaseUrl = 'http://localhost:3000'; // Assuming backend runs on 3000
        window.location.href = `${backendBaseUrl}/auth/${provider}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isForgotMode) {
                const response = await api.post('/auth/forgot-password', { email: formData.email });
                setSuccessMessage(response.data.message);
            } else {
                const endpoint = isLogin ? '/auth/login' : '/auth/register';
                const response = await api.post(endpoint, formData);
                const { accessToken, user } = response.data;
                setAuth(accessToken, user);
                window.location.replace('/wardrobe');
            }
        } catch (err: any) {
            let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            if (err.response) msg = err.response.data?.message || msg;
            else if (err.request) msg = 'Bağlantı Hatası: Sunucuya ulaşılamıyor.';
            else msg = err.message || msg;
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.1, delayChildren: 0.3 } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.8 } 
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] overflow-hidden">
            {/* Left Panel: Elite Visual Storytelling */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${BG_IMAGE})`,
                        x: mousePos.x * 0.5,
                        y: mousePos.y * 0.5,
                        scale: 1.1
                    }}
                    transition={{ type: 'spring', stiffness: 50, damping: 30 }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent backdrop-blur-[0.5px]" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="relative z-10 w-full h-full flex items-center justify-center p-12"
                >
                    <motion.img
                        src={AVATAR_IMAGE}
                        alt="3D Fashion Avatar"
                        className="max-h-[85%] object-contain drop-shadow-[0_50px_50px_rgba(0,0,0,0.6)]"
                        style={{ x: -mousePos.x, y: -mousePos.y }}
                    />
                </motion.div>

                {/* Magazine Typography Overlay */}
                <div className="absolute bottom-24 left-20 right-20 z-20">
                    <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.6, x: 0 }}
                        transition={{ delay: 1 }}
                        className="text-white font-sans tracking-[0.6em] text-[10px] uppercase mb-6"
                    >
                        Zeka ve Zarafetin Buluşması
                    </motion.p>
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="text-7xl font-serif text-white leading-[1] mb-10 font-light italic"
                    >
                        Stilini <br />
                        <span className="not-italic font-normal text-white/95">Gelecekle Tanıştır.</span>
                    </motion.h2>
                    <div className="flex items-center space-x-8 opacity-40">
                        <div className="w-20 h-[0.5px] bg-white" />
                        <span className="text-white text-[9px] font-sans tracking-[0.4em] uppercase italic">P R E M I U M</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Minimalist Perfection */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-12 lg:p-24 bg-[#FDFBF7] relative">
                <div className="max-w-md w-full">
                    
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-12"
                    >
                        {/* Header Section */}
                        <motion.div variants={itemVariants} className="px-2">
                            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-5 tracking-tightest leading-[1.1]">
                                {isForgotMode ? 'Şifremi Unuttum' : (isLogin ? 'Stil Yolculuğuna Dön' : 'Aramıza Katıl')}
                            </h1>
                            <p className="text-gray-400 font-sans tracking-wide text-sm leading-relaxed max-w-sm">
                                {isForgotMode 
                                    ? 'Sana özel bir sıfırlama anahtarı hazırladık.' 
                                    : (isLogin ? 'Kişisel stil asistanınla kürate edilmiş bir moda deneyimine hazır mısın?' : 'Dijital gardırobunu profesyonel bir zeka ile yönetmeye bugün başla.')}
                            </p>
                        </motion.div>

                        {/* Toggle Switch */}
                        {!isForgotMode && (
                            <motion.div variants={itemVariants} className="bg-gray-100/50 p-1.5 rounded-[22px] flex border border-gray-200/40 backdrop-blur-sm mx-2">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`flex-1 py-3 text-[10px] font-black rounded-[18px] tracking-[0.15em] transition-all duration-500 ${isLogin ? 'bg-white text-black shadow-elite scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}
                                >
                                    GİRİŞ
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`flex-1 py-3 text-[10px] font-black rounded-[18px] tracking-[0.15em] transition-all duration-500 ${!isLogin ? 'bg-white text-black shadow-elite scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}
                                >
                                    KAYIT
                                </button>
                            </motion.div>
                        )}

                        {/* Error Handling */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50/30 text-red-600 text-[11px] p-5 rounded-3xl border border-red-100/50 flex items-center space-x-4 mx-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="font-semibold tracking-wide uppercase">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Section */}
                        <form onSubmit={handleSubmit} className="space-y-12 px-2">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={isLogin ? 'login' : 'register'}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-12"
                                >
                                    {!isLogin && !isForgotMode && (
                                        <div className="group space-y-4">
                                            <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1 group-focus-within:text-black transition-colors">AD SOYAD</label>
                                            <div className="relative">
                                                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 opacity-60 group-focus-within:opacity-100 group-focus-within:text-black transition-all" />
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    placeholder="Örn: Hasan Öztürk"
                                                    onChange={handleChange}
                                                    className="w-full pl-8 pr-4 py-4 bg-transparent border-b border-gray-100 focus:border-black outline-none transition-all duration-700 placeholder:text-gray-200 font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="group space-y-4">
                                        <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1 group-focus-within:text-black transition-colors">E-POSTA</label>
                                        <div className="relative">
                                            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 opacity-60 group-focus-within:opacity-100 group-focus-within:text-black transition-all" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="stilin@kesfet.com"
                                                onChange={handleChange}
                                                className="w-full pl-8 pr-4 py-4 bg-transparent border-b border-gray-100 focus:border-black outline-none transition-all duration-700 placeholder:text-gray-200 font-sans text-sm"
                                            />
                                        </div>
                                    </div>

                                    {!isForgotMode && (
                                        <div className="group space-y-4">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] group-focus-within:text-black transition-colors">ŞİFRE</label>
                                                {isLogin && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsForgotMode(true)}
                                                        className="text-[8px] font-black text-gray-300 hover:text-black border-b border-transparent hover:border-black transition-all duration-500 tracking-widest"
                                                    >
                                                        UNUTTUM?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 opacity-60 group-focus-within:opacity-100 group-focus-within:text-black transition-all" />
                                                <input
                                                    type="password"
                                                    name="password"
                                                    required
                                                    placeholder="••••••••"
                                                    onChange={handleChange}
                                                    className="w-full pl-8 pr-4 py-4 bg-transparent border-b border-gray-100 focus:border-black outline-none transition-all duration-700 placeholder:text-gray-200 font-sans text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <motion.button
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-br from-gray-900 to-black text-white py-6 rounded-[24px] font-bold shadow-elite-hover hover:shadow-black/20 active:shadow-inner transition-all duration-500 overflow-hidden relative group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/50" />
                                ) : (
                                    <div className="flex items-center justify-center space-x-3">
                                        <span className="tracking-[0.3em] text-[10px] uppercase font-black">
                                            {isForgotMode ? 'GÖNDER' : (isLogin ? 'GİRİŞ YAP' : 'ÜYELİĞİ TAMAMLA')}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-2 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            </motion.button>
                        </form>

                        {/* Social Perfection */}
                        <motion.div variants={itemVariants} className="mt-20">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100/50"></div>
                                </div>
                                <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em]">
                                    <span className="bg-[#FDFBF7] px-8 text-gray-300 font-bold">ya da şununla devam et</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 px-2">
                                <button 
                                    type="button"
                                    onClick={() => handleSocialLogin('google')}
                                    className="flex items-center justify-center space-x-4 py-4 border-[0.5px] border-gray-100 rounded-2xl bg-white hover:bg-gray-50 hover:shadow-elite transition-all duration-500 group"
                                >
                                    <Chrome className="w-3.5 h-3.5 text-gray-400 group-hover:text-black" />
                                    <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 group-hover:text-black">GOOGLE</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleSocialLogin('instagram')}
                                    className="flex items-center justify-center space-x-4 py-4 border-[0.5px] border-gray-100 rounded-2xl bg-white hover:bg-gray-50 hover:shadow-elite transition-all duration-500 group"
                                >
                                    <Instagram className="w-3.5 h-3.5 text-gray-400 group-hover:text-pink-600" />
                                    <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 group-hover:text-pink-600">INSTAGRAM</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 2.5 }}
                        className="text-center text-gray-400 text-[8px] mt-20 uppercase tracking-[0.3em] font-medium"
                    >
                        P R E M İ U M &nbsp; D İ J İ T A L &nbsp; G A R D I R O P
                    </motion.p>
                </div>
            </div>

            <style>{`
                .shadow-elite { box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .shadow-elite-hover { box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                .tracking-tightest { letter-spacing: -0.04em; }
                
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
