import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shirt, Layout, Sparkles, Compass, Users, BarChart3, UserCircle, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { icon: Shirt, label: 'Wardrobe', path: '/wardrobe' },
    { icon: Layout, label: 'Lookbook', path: '/lookbook' },
    { icon: Sparkles, label: 'Studio', path: '/studio' },
    { icon: Compass, label: 'Discover', path: '/discover' },
    { icon: Users, label: 'Vitrin', path: '/feed' },
    { icon: BarChart3, label: 'Insights', path: '/analytics' },
    { icon: UserCircle, label: 'Asistan', path: '/avatar/profile' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: ShieldCheck, label: 'Admin', path: '/admin', adminOnly: true },
];

export const NavigationDock: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuthStore();

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-fit px-6">
            <div className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[3rem] px-3 py-2 shadow-[0_30px_60px_rgba(0,0,0,0.15)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                    const hasAdminAccess = user?.role === 'ADMIN';

                    if (item.adminOnly && !hasAdminAccess) return null;
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-[2.5rem] transition-all duration-500 group whitespace-nowrap ${
                                isActive 
                                ? 'bg-black text-white shadow-2xl scale-110 -translate-y-1' 
                                : 'text-gray-400 hover:text-black hover:bg-gray-50/50'
                            }`}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                            {isActive && (
                                <motion.span 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[8px] font-black uppercase tracking-[0.2em] font-serif"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    );
                })}
            </div>
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
