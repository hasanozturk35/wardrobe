import { create } from 'zustand';
import { API_URL } from '../config';

export interface GarmentItem {
    id: string;
    category: string;
    brand?: string;
    colors: string[];
    seasons: string[];
    pinned: boolean;
    tags?: any[];
    photos: { url: string }[];
    meshUrl?: string;
}

interface WardrobeState {
    items: GarmentItem[];
    isLoading: boolean;
    filters: {
        category: string | null;
        color: string | null;
    };
    setItems: (items: GarmentItem[]) => void;
    fetchItems: () => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    setFilters: (filters: Partial<WardrobeState['filters']>) => void;
    clearFilters: () => void;
}

export const useWardrobeStore = create<WardrobeState>((set) => ({
    items: [],
    isLoading: false,
    filters: {
        category: null,
        color: null,
    },
    setItems: (items) => set({ items }),
    fetchItems: async () => {
        set({ isLoading: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/wardrobe/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                set({ items: data, isLoading: false });
            } else if (res.status === 401) {
                // Token expired silently, redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            set({ isLoading: false });
        }
    },
    deleteItem: async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/wardrobe/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                set((state) => ({ items: state.items.filter(item => item.id !== id) }));
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    },
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: { category: null, color: null } }),
}));
