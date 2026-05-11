import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const reset = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Yeni şifre en az 6 karakter olmalı.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            setSuccess(true);
            setTimeout(() => handleClose(), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-6"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 relative"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-4">
                                    <Lock size={20} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-serif tracking-tight">Şifre Değiştir</h2>
                                <p className="text-sm text-gray-400 mt-1 font-serif italic">Güvenliğin için mevcut şifreni doğrula</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                <p className="text-xl font-serif">Şifren başarıyla değiştirildi!</p>
                                <p className="text-sm text-gray-400 mt-2">Yeniden giriş yapman gerekebilir.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Current Password */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 block mb-2">
                                        Mevcut Şifre
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                                        >
                                            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 block mb-2">
                                        Yeni Şifre
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                            placeholder="En az 6 karakter"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                                        >
                                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 block mb-2">
                                        Yeni Şifre Tekrar
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-rose-500 bg-rose-50 rounded-2xl px-4 py-3"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                    className="w-full bg-black text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.25em] hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Şifreyi Değiştir'}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
