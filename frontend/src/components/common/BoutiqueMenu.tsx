import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Shirt, Layout, Sparkles, Compass, Users, Calendar, BarChart3, UserCircle, LogOut, KeyRound } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { ChangePasswordModal } from './ChangePasswordModal';

export const BoutiqueMenu: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMenuOpen, closeMenu } = useUIStore();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const menuItems = [
        { icon: Shirt, label: 'Wardrobe', path: '/wardrobe', desc: 'Your fashion collection' },
        { icon: Layout, label: 'Lookbook', path: '/lookbook', desc: 'Curated editorial looks' },
        { icon: Sparkles, label: 'Studio', path: '/studio', desc: 'Interactive style workshop' },
        { icon: Compass, label: 'Discover', path: '/discover', desc: 'AI-curated inspiration' },
        { icon: Users, label: 'Community', path: '/feed', desc: 'Social style feed' },
        { icon: Calendar, label: 'Calendar', path: '/calendar', desc: 'Schedule your outfits' },
        { icon: BarChart3, label: 'Insights', path: '/analytics', desc: 'Style analytics' },
        { icon: UserCircle, label: 'Avatar', path: '/avatar/profile', desc: 'Identity & Fit' },
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        closeMenu();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
        closeMenu();
    };

    return (
        <>
        <AnimatePresence>
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-3xl"
                >
                    {/* Close Button */}
                    <div className="absolute top-12 right-12">
                        <motion.button
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            onClick={closeMenu}
                            className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl"
                        >
                            <X size={32} />
                        </motion.button>
                    </div>

                    {/* Menu Content */}
                    <div className="h-full flex flex-col justify-center px-8 md:px-24">
                        <div className="max-w-[1400px] mx-auto w-full">
                            <motion.span 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 0.3, x: 0 }}
                                className="text-[12px] font-bold uppercase tracking-[0.5em] mb-12 block"
                            >
                                Navigation
                            </motion.span>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                                {menuItems.map((item, idx) => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <motion.button
                                            key={item.path}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleNavigate(item.path)}
                                            className="group flex items-start gap-8 text-left hover:translate-x-4 transition-transform duration-500"
                                        >
                                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-black text-white shadow-2xl scale-110' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-xl group-hover:text-black'}`}>
                                                <Icon size={32} strokeWidth={1} />
                                            </div>
                                            <div className="py-2">
                                                <h3 className={`text-4xl font-serif tracking-tight transition-colors ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>
                                                    {item.label}
                                                </h3>
                                                <p className="text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}

                                {/* Change Password Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: menuItems.length * 0.05 }}
                                    onClick={() => setIsChangePasswordOpen(true)}
                                    className="group flex items-start gap-8 text-left hover:translate-x-4 transition-transform duration-500 mt-8"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        <KeyRound size={24} strokeWidth={1} />
                                    </div>
                                    <div className="py-2">
                                        <h3 className="text-2xl font-serif text-gray-400 group-hover:text-black transition-colors">Şifre Değiştir</h3>
                                    </div>
                                </motion.button>

                                {/* Logout Special Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (menuItems.length + 1) * 0.05 }}
                                    onClick={handleLogout}
                                    className="group flex items-start gap-8 text-left hover:translate-x-4 transition-transform duration-500"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                                        <LogOut size={24} strokeWidth={1} />
                                    </div>
                                    <div className="py-2">
                                        <h3 className="text-2xl font-serif text-gray-400 group-hover:text-rose-500 transition-colors">Çıkış Yap</h3>
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div className="absolute bottom-12 left-24">
                        <p className="text-sm font-serif italic text-gray-300">Antigravity Wardrobe System v2.0</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
        />
        </>
    );
};
