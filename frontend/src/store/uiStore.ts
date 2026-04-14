import { create } from 'zustand';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface UIState {
    isMenuOpen: boolean;
    toasts: Toast[];
    openMenu: () => void;
    closeMenu: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    isMenuOpen: false,
    toasts: [],
    openMenu: () => set({ isMenuOpen: true }),
    closeMenu: () => set({ isMenuOpen: false }),
    showToast: (message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ 
            toasts: [...state.toasts, { id, message, type }] 
        }));
        
        // Auto remove toast
        setTimeout(() => get().removeToast(id), 3000);
    },
    removeToast: (id) => set((state) => ({ 
        toasts: state.toasts.filter(t => t.id !== id) 
    })),
}));
