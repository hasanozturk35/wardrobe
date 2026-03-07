import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, User, ArrowRight, Loader2, Instagram, Chrome } from 'lucide-react';

const BG_IMAGE = '/src/assets/quiet_luxury_wardrobe_bg_1772833697604.png';
const AVATAR_IMAGE = '/src/assets/pinterest_fashion_couple_editorial_1772833854361.png';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await axios.post(`http://localhost:3000${endpoint}`, formData);

            const { accessToken, user } = response.data;
            setAuth(accessToken, user);
            navigate('/wardrobe');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F3] selection:bg-black selection:text-white">
            {/* Left Panel: Visual Storytelling */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
                    style={{ backgroundImage: `url(${BG_IMAGE})` }}
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                {/* Avatar Shadow/Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/10 rounded-full blur-[120px]" />

                {/* 3D Avatar Render */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
                    <img
                        src={AVATAR_IMAGE}
                        alt="3D Fashion Avatar"
                        className="max-h-[85%] object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] animate-float"
                    />
                </div>

                {/* Welcome Text */}
                <div className="absolute bottom-20 left-12 right-12 z-20">
                    <p className="text-white/60 font-sans tracking-[0.4em] text-[9px] uppercase mb-4">
                        Curated Style Intelligence
                    </p>
                    <h2 className="text-6xl font-serif text-white leading-[1.1] mb-8 drop-shadow-2xl">
                        Stilinizi <br />
                        <span className="italic font-light text-white/95">Birlikte Keşfedin.</span>
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-[1px] bg-white/40" />
                        <span className="text-white/40 text-[10px] font-sans tracking-widest uppercase">E S T . 2 0 2 6</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="max-w-md w-full animate-fade-in">
                    {/* Brand Logo Mobile Only */}
                    <div className="lg:hidden text-center mb-12">
                        <h1 className="text-4xl font-serif font-bold tracking-tight">Wardrobe</h1>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                            {isLogin ? 'Tekrar Hoş Geldin' : 'Aramıza Katıl'}
                        </h1>
                        <p className="text-gray-500 font-sans tracking-wide">
                            {isLogin ? 'Moda yolculuğuna kaldığın yerden devam et.' : 'Dijital gardırobunu oluşturmaya bugün başla.'}
                        </p>
                    </div>

                    {/* Login/Register Toggle Panel */}
                    <div className="bg-gray-200/50 p-1 rounded-xl mb-10 flex border border-gray-200">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${isLogin ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Kayıt Ol
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-8 border border-red-100 flex items-center space-x-2 animate-shake">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Glassmorphism Form Container */}
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[32px] shadow-2xl shadow-gray-200/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">TAM İSİM</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="John Doe"
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-[12px] focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">E-POSTA ADRESİ</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="stilin@kesfet.com"
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-[12px] focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">ŞİFRE</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="••••••••"
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-[12px] focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white py-4 rounded-[12px] font-bold flex items-center justify-center space-x-2 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="tracking-wide">{isLogin ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Social Buttons */}
                        <div className="mt-8">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                    <span className="bg-transparent px-4 text-gray-400 font-medium">ya da şununla devam et</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center space-x-2 py-3 border border-gray-200 rounded-[12px] bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                    <Chrome className="w-4 h-4" />
                                    <span className="text-xs font-bold">Google</span>
                                </button>
                                <button className="flex items-center justify-center space-x-2 py-3 border border-gray-200 rounded-[12px] bg-white hover:bg-gray-50 transition-colors shadow-sm text-pink-600">
                                    <Instagram className="w-4 h-4" />
                                    <span className="text-xs font-bold">Instagram</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-[10px] mt-10 uppercase tracking-widest leading-loose">
                        Devam ederek <span className="text-gray-900 font-bold border-b border-gray-900">Kullanım Koşullarını</span> <br />
                        ve <span className="text-gray-900 font-bold border-b border-gray-900">Gizlilik Politikasını</span> kabul etmiş olursunuz.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
