import { create } from 'zustand';

interface AuthState {
    token: string | null;
    user: any | null;
    setAuth: (token: string, user: any) => void;
    updateUser: (partial: Partial<{ name: string; avatarUrl: string }>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: localStorage.getItem('token') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    setAuth: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
    },
    updateUser: (partial) => {
        const updated = { ...get().user, ...partial };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null });
    },
}));
