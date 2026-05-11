import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { API_URL } from '../config';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage: React.FC = () => {
    const [isLogin,      setIsLogin]      = useState(true);
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState<string | null>(null);
    const [,             setSuccessMsg]   = useState<string | null>(null);
    const [formData,     setFormData]     = useState({ email: '', password: '', name: '' });

    const { setAuth } = useAuthStore();

    const handleSocialLogin = (provider: string) => {
        window.location.href = `${API_URL}/auth/${provider}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            if (isForgotMode) {
                const res = await api.post('/auth/forgot-password', { email: formData.email });
                setSuccessMsg(res.data.message);
            } else {
                const endpoint = isLogin ? '/auth/login' : '/auth/register';
                const res = await api.post(endpoint, formData);
                const { accessToken, refreshToken, user } = res.data;
                setAuth(accessToken, user, refreshToken);
                window.location.replace('/wardrobe');
            }
        } catch (err: any) {
            let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            if (err.response)      msg = err.response.data?.message || msg;
            else if (err.request)  msg = 'Bağlantı Hatası: Sunucuya ulaşılamıyor.';
            else                   msg = err.message || msg;
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-screen overflow-hidden">

            {/* ═══════════════════════════════════════════════
                LEFT — Cinematic Fashion Panel
            ═══════════════════════════════════════════════ */}
            <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-[#0d0d0d]">

                {/* Cinematic background video */}
                <video
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover auth-video-zoom"
                    style={{ filter: 'grayscale(8%) contrast(1.08) brightness(0.88)' }}
                >
                    <source src="/hero-video.mp4" type="video/mp4" />
                </video>

                {/* Cinematic overlay — gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/30 to-black/55" />

                {/* Film grain */}
                <div className="absolute inset-0 auth-grain opacity-[0.07] mix-blend-overlay pointer-events-none" />

                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 px-14 py-12 flex items-center justify-between z-10">
                    <span className="text-white/45 text-[9px] font-mono uppercase tracking-[0.6em]">Maison Wardrobe</span>
                    <span className="text-white/25 text-[9px] font-mono uppercase tracking-[0.4em]">No. 01</span>
                </div>

                {/* Main content — bottom aligned */}
                <div className="absolute bottom-0 inset-x-0 px-14 pb-16 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    >
                        <p className="text-white/35 text-[9px] font-mono uppercase tracking-[0.6em] mb-12">
                            İstanbul · İzmir · Ankara
                        </p>
                        <h1 className="font-serif font-light text-white leading-[0.86] tracking-[-0.03em] mb-10"
                            style={{ fontSize: 'clamp(72px, 8vw, 108px)' }}>
                            Stiline<span className="italic text-white/55">.</span>
                        </h1>
                        <p className="text-white/35 text-[9px] font-mono uppercase tracking-[0.55em] leading-[2.4]">
                            Kişisel AI Moda Deneyimi
                        </p>
                    </motion.div>

                    <div className="mt-10 flex items-center gap-5 opacity-20">
                        <div className="w-12 h-[0.5px] bg-white" />
                        <span className="text-white text-[8px] font-mono uppercase tracking-[0.55em]">2026 Collection</span>
                    </div>
                </div>

                {/* Vertical magazine text — right edge */}
                <div className="absolute right-7 inset-y-0 flex items-center z-10 pointer-events-none">
                    <span
                        className="text-white/18 text-[8px] font-mono uppercase tracking-[0.5em]"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        AI · Stil · Arşiv · 2026
                    </span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                RIGHT — Luxury Form
            ═══════════════════════════════════════════════ */}
            <div className="w-full lg:w-[45%] flex items-center justify-center bg-[#f8f6f2] px-10 py-20 relative">

                {/* Mobile brand mark */}
                <div className="absolute top-9 left-1/2 -translate-x-1/2 lg:hidden">
                    <span className="text-[9px] font-mono uppercase tracking-[0.55em] text-gray-400">Maison Wardrobe</span>
                </div>

                <div className="w-full max-w-[340px]">

                    {/* ── Heading ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="mb-14"
                    >
                        <h2 className="font-serif font-light text-[#1a1a1a] leading-[1.08] tracking-[-0.02em] mb-5 whitespace-pre-line"
                            style={{ fontSize: 'clamp(30px, 3vw, 40px)' }}>
                            {isForgotMode
                                ? 'Şifremi\nUnuttum.'
                                : (isLogin ? 'Tekrar\nHoş Geldiniz.' : 'Hesap\nOluştur.')}
                        </h2>
                        <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-400">
                            {isForgotMode
                                ? 'ŞİFRENİ SIFIRLA'
                                : (isLogin ? 'DEVAM ETMEK İÇİN GİRİŞ YAP' : 'HESAP OLUŞTUR')}
                        </p>
                    </motion.div>

                    {/* ── Tab Toggle ── */}
                    {!isForgotMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.9, delay: 0.3 }}
                            className="flex mb-12 border-b border-gray-200"
                        >
                            {(['Giriş', 'Kayıt'] as const).map((label, i) => {
                                const active = i === 0 ? isLogin : !isLogin;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setIsLogin(i === 0)}
                                        className={`pb-4 pr-8 text-[9px] font-mono uppercase tracking-[0.35em] border-b-[1.5px] -mb-[1px] transition-all duration-300 ${active ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* ── Error ── */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-[9px] text-red-500 uppercase tracking-[0.3em] mb-8 font-mono"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* ── Form ── */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.4 }}
                        className="space-y-10"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? 'login' : 'register'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-10"
                            >
                                {!isLogin && !isForgotMode && (
                                    <div className="group">
                                        <label className="block text-[9px] font-mono uppercase tracking-[0.4em] text-gray-400 mb-3 group-focus-within:text-[#1a1a1a] transition-colors duration-300">
                                            Ad Soyad
                                        </label>
                                        <input
                                            type="text" name="name" required
                                            placeholder="Hasan Öztürk"
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-b border-gray-300 pb-3 text-[13px] text-[#1a1a1a] outline-none placeholder:text-gray-300 focus:border-[#1a1a1a] transition-colors duration-300 font-light"
                                        />
                                    </div>
                                )}

                                <div className="group">
                                    <label className="block text-[9px] font-mono uppercase tracking-[0.4em] text-gray-400 mb-3 group-focus-within:text-[#1a1a1a] transition-colors duration-300">
                                        E-Posta
                                    </label>
                                    <input
                                        type="email" name="email" required
                                        placeholder="stilin@kesfet.com"
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-b border-gray-300 pb-3 text-[13px] text-[#1a1a1a] outline-none placeholder:text-gray-300 focus:border-[#1a1a1a] transition-colors duration-300 font-light"
                                    />
                                </div>

                                {!isForgotMode && (
                                    <div className="group">
                                        <div className="flex justify-between mb-3">
                                            <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-400 group-focus-within:text-[#1a1a1a] transition-colors duration-300">
                                                Şifre
                                            </label>
                                            {isLogin && (
                                                <button type="button" onClick={() => setIsForgotMode(true)}
                                                    className="text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 hover:text-[#1a1a1a] transition-colors duration-300">
                                                    Unuttum
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="password" name="password" required
                                            placeholder="••••••••"
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-b border-gray-300 pb-3 text-[13px] text-[#1a1a1a] outline-none placeholder:text-gray-300 focus:border-[#1a1a1a] transition-colors duration-300 font-light"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Submit button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-[18px] bg-[#1a1a1a] text-white text-[9px] font-mono uppercase tracking-[0.55em] hover:bg-black transition-all duration-500 disabled:opacity-40 flex items-center justify-center gap-5 group"
                            >
                                {isLoading
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <>
                                        {isForgotMode ? 'Bağlantı Gönder' : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
                                        <ArrowRight size={11} className="opacity-50 group-hover:translate-x-1 transition-transform duration-300" />
                                      </>
                                }
                            </button>
                        </div>
                    </motion.form>

                    {/* ── Social ── */}
                    {!isForgotMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.9, delay: 0.7 }}
                            className="mt-14"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-gray-400">ya da</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <button type="button" onClick={() => handleSocialLogin('google')}
                                className="w-full py-4 border border-gray-200 text-[8px] font-mono uppercase tracking-[0.5em] text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all duration-300 flex items-center justify-center gap-4">
                                <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                G o o g l e
                            </button>
                        </motion.div>
                    )}

                    {isForgotMode && (
                        <button type="button" onClick={() => setIsForgotMode(false)}
                            className="mt-10 text-[9px] font-mono uppercase tracking-[0.35em] text-gray-400 hover:text-[#1a1a1a] transition-colors duration-300">
                            ← Geri Dön
                        </button>
                    )}

                    {/* Footer signature */}
                    <p className="mt-20 text-center text-[8px] font-mono uppercase tracking-[0.5em] text-gray-300">
                        Premium Dijital Gardırop
                    </p>
                </div>
            </div>

            <style>{`
                /* Slow cinematic zoom on video */
                .auth-video-zoom {
                    animation: authVideoZoom 20s ease-out forwards;
                }
                @keyframes authVideoZoom {
                    0%   { transform: scale(1.06); }
                    100% { transform: scale(1.0); }
                }

                /* Film grain texture */
                .auth-grain {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
                    background-size: 200px 200px;
                }

                /* Input autofill override */
                input:-webkit-autofill,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0 100px #f8f6f2 inset;
                    -webkit-text-fill-color: #1a1a1a;
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
