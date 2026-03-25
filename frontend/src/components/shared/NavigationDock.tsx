import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shirt, Compass, Users, Calendar, Sparkles, BarChart3 } from 'lucide-react';

const navItems = [
    { icon: Shirt, label: 'Wardrobe', path: '/wardrobe' },
    { icon: Compass, label: 'Discover', path: '/discover' },
    { icon: Users, label: 'Feed', path: '/feed' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: BarChart3, label: 'Insights', path: '/analytics' },
    { icon: Sparkles, label: 'Studio', path: '/studio' },
];

export const NavigationDock: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-[2rem] transition-all duration-300 group ${
                                isActive 
                                ? 'bg-black text-white shadow-lg scale-105' 
                                : 'text-gray-500 hover:text-black hover:bg-white/50'
                            }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] font-serif ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-70 transition-opacity'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
