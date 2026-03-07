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
}

interface WardrobeState {
    items: GarmentItem[];
    isLoading: boolean;
    filters: {
        category: string | null;
        color: string | null;
    };
    setItems: (items: GarmentItem[]) => void;
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
