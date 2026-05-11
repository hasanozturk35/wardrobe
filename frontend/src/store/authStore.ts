import { create } from 'zustand';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: any | null;
    setAuth: (token: string, user: any, refreshToken?: string) => void;
    updateUser: (partial: Partial<{ name: string; avatarUrl: string }>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    setAuth: (token, user, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        set({ token, user, refreshToken: refreshToken ?? get().refreshToken });
    },
    updateUser: (partial) => {
        const updated = { ...get().user, ...partial };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ token: null, refreshToken: null, user: null });
    },
}));
