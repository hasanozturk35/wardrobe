import { create } from 'zustand';
import { api } from '../lib/api';

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
    editorial: { headline: string; article: string; suggestedCategory?: string } | null;
    isLoading: boolean;
    currentProduct: any | null;
    filters: {
        category: string | null;
        color: string | null;
    };
    setItems: (items: GarmentItem[]) => void;
    setCurrentProduct: (product: any | null) => void;
    fetchItems: () => Promise<void>;
    fetchEditorial: () => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    updateItem: (id: string, data: Partial<GarmentItem>) => Promise<void>;
    setFilters: (filters: Partial<WardrobeState['filters']>) => void;
    clearFilters: () => void;
}

export const useWardrobeStore = create<WardrobeState>((set) => ({
    items: [],
    editorial: null,
    isLoading: false,
    currentProduct: null,
    setCurrentProduct: (product) => set({ currentProduct: product }),
    filters: {
        category: null,
        color: null,
    },
    setItems: (items) => set({ items }),
    fetchItems: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get(`/wardrobe/items`);
            if (res.status === 200) {
                set({ items: res.data, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            set({ isLoading: false });
        }
    },
    fetchEditorial: async () => {
        try {
            const res = await api.get('/ai/editorial');
            if (res.status === 200) {
                set({ editorial: res.data });
            }
        } catch (error) {
            console.error('Failed to fetch editorial:', error);
        }
    },
    deleteItem: async (id) => {
        try {
            const res = await api.delete(`/wardrobe/items/${id}`);
            if (res.status === 200) {
                set((state) => ({ items: state.items.filter(item => item.id !== id) }));
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    },
    updateItem: async (id, data) => {
        try {
            const res = await api.post(`/wardrobe/items/${id}`, data);
            if (res.status === 201 || res.status === 200) {
                set((state) => ({
                    items: state.items.map(item => item.id === id ? { ...item, ...res.data } : item)
                }));
            }
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    },
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: { category: null, color: null } }),
}));
