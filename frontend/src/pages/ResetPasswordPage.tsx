import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const BG_IMAGE = '/src/assets/quiet_luxury_wardrobe_bg_1772833697604.png';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Geçersiz sıfırlama linki.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: password
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/auth'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3] p-8">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-serif mb-4">Üzgünüz</h1>
                    <p className="text-gray-500 mb-8">Sıfırlama anahtarı bulunamadı veya süresi dolmuş.</p>
                    <button onClick={() => navigate('/auth')} className="text-black font-bold border-b border-black">Giriş Sayfasına Dön</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F5F5F3]">
            {/* Split Layout compatible with AuthPage aesthetic */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_IMAGE})` }} />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative z-10 w-full flex flex-col justify-center p-20">
                    <h2 className="text-5xl font-serif text-white leading-tight">Güvenliğiniz <br/> Bizim İçin Önemli.</h2>
                    <p className="text-white/60 mt-6 max-w-sm">Yeni şifrenizi belirleyerek moda yolculuğunuza devam edebilirsiniz.</p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    {isSuccess ? (
                        <div className="text-center animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-serif mb-4">Başarılı!</h1>
                            <p className="text-gray-500">Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="mb-12">
                                <h1 className="text-4xl font-serif font-bold mb-2">Şifre Yenileme</h1>
                                <p className="text-gray-500">Lütfen yeni ve güvenli bir şifre belirleyin.</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[32px] shadow-2xl">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">YENİ ŞİFRE</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-[12px] outline-none focus:ring-2 focus:ring-black transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">ŞİFRE TEKRAR</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-[12px] outline-none focus:ring-2 focus:ring-black transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-black text-white py-4 rounded-[12px] font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <span>ŞİFREYİ GÜNCELLE</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
