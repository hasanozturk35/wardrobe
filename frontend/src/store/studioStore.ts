import { create } from 'zustand';
import type { GarmentItem } from './wardrobeStore';

interface StudioState {
    wornItems: {
        top: GarmentItem | null;
        bottom: GarmentItem | null;
        shoes: GarmentItem | null;
    };
    wearItem: (item: GarmentItem) => void;
    removeItem: (category: 'top' | 'bottom' | 'shoes') => void;
    clearAll: () => void;
    saveOutfit: (name: string, description?: string) => Promise<boolean>;
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
            'T-Shirt': 'top',
            'Sweater': 'top',
            'Shirt': 'top',
            'Blouse': 'top',
            'Jacket': 'top',
            'Coat': 'top',
            'Hoodie': 'top',
            'Pants': 'bottom',
            'Jeans': 'bottom',
            'Shorts': 'bottom',
            'Skirt': 'bottom',
            'Sneakers': 'shoes',
            'Boots': 'shoes',
            'Shoes': 'shoes',
            'Heels': 'shoes',
            'Sandals': 'shoes',
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
    saveOutfit: async (name, description) => {
        try {
            const state = get();
            const items = [];

            if (state.wornItems.top) items.push({ garmentItemId: state.wornItems.top.id, slot: 'top' });
            if (state.wornItems.bottom) items.push({ garmentItemId: state.wornItems.bottom.id, slot: 'bottom' });
            if (state.wornItems.shoes) items.push({ garmentItemId: state.wornItems.shoes.id, slot: 'shoes' });

            if (items.length === 0) return false;

            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/outfits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, items })
            });

            if (res.ok) {
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
