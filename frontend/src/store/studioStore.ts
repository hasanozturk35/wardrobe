import { create } from 'zustand';
import type { GarmentItem } from './wardrobeStore';
import { api } from '../lib/api';

interface StudioState {
    wornItems: {
        top: GarmentItem | null;
        bottom: GarmentItem | null;
        shoes: GarmentItem | null;
    };
    wearItem: (item: GarmentItem) => void;
    removeItem: (category: 'top' | 'bottom' | 'shoes') => void;
    clearAll: () => void;
    saveOutfit: (name: string, description?: string, coverImage?: string | null) => Promise<boolean>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
    wornItems: {
        top: null,
        bottom: null,
        shoes: null,
    },
    wearItem: (item) => set((state) => {
        // MVP: Simple logic to map category to top/bottom/shoes
        const categoryGroups: Record<string, 'top' | 'bottom' | 'shoes'> = {
            'Üst Giyim': 'top',
            'Dış Giyim': 'top',
            'Alt Giyim': 'bottom',
            'Ayakkabı': 'shoes',
            'Aksesuar': 'top', // default
            // Fallbacks for older dummy data
            'T-Shirt': 'top',
            'Sweater': 'top',
            'Shirt': 'top',
            'Pants': 'bottom',
            'Jeans': 'bottom',
            'Sneakers': 'shoes',
            'Shoes': 'shoes',
        };

        // Default to top if not found
        const slot = categoryGroups[item.category] || 'top';

        return {
            wornItems: {
                ...state.wornItems,
                [slot]: item,
            }
        };
    }),
    removeItem: (category) => set((state) => ({
        wornItems: {
            ...state.wornItems,
            [category]: null,
        }
    })),
    clearAll: () => set({
        wornItems: {
            top: null,
            bottom: null,
            shoes: null,
        }
    }),
    saveOutfit: async (name, description, coverImage) => {
        try {
            const state = get();
            const items = [];

            if (state.wornItems.top) items.push({ garmentItemId: state.wornItems.top.id, slot: 'top' });
            if (state.wornItems.bottom) items.push({ garmentItemId: state.wornItems.bottom.id, slot: 'bottom' });
            if (state.wornItems.shoes) items.push({ garmentItemId: state.wornItems.shoes.id, slot: 'shoes' });

            if (items.length === 0) return false;

            const res = await api.post(`/outfits`, { name, description, items, coverImage });

            if (res.status === 200 || res.status === 201) {
                // Clear all worn items after saving
                set({ wornItems: { top: null, bottom: null, shoes: null } });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save outfit:', error);
            return false;
        }
    }
}));
