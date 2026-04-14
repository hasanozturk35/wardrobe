import React from 'react';
import { NavigationDock } from './NavigationDock';
import { BoutiqueMenu } from '../common/BoutiqueMenu';
import { useUIStore } from '../../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { toasts } = useUIStore();

    return (
        <div className="min-h-screen bg-transparent relative overflow-x-hidden">
            {/* Global Notifications Panel */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-auto ${
                                toast.type === 'error' ? 'bg-rose-500/90 text-white' : 'bg-black/90 text-white'
                            }`}
                        >
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <BoutiqueMenu />
            
            <main className="pb-32">
                {children}
            </main>
            <NavigationDock />
        </div>
    );
};
