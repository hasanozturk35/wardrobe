import { Injectable } from '@nestjs/common';

export interface ShopItem {
    id: string;
    brand: string;
    category: string;
    price: string;
    imageUrl: string;
}

@Injectable()
export class ShopService {
    private readonly mockItems: ShopItem[] = [
        {
            id: 'mock-1',
            brand: 'Zara',
            category: 'Dış Giyim',
            price: '2.499 TL',
            imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' // Leather Jacket
        },
        {
            id: 'mock-2',
            brand: 'Mango',
            category: 'Üst Giyim',
            price: '899 TL',
            imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80' // T-Shirt
        },
        {
            id: 'mock-3',
            brand: 'Levi\'s',
            category: 'Alt Giyim',
            price: '1.899 TL',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80' // Jeans
        },
        {
            id: 'mock-4',
            brand: 'Nike',
            category: 'Ayakkabı',
            price: '3.299 TL',
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' // Red Shoes
        },
        {
            id: 'mock-5',
            brand: 'Massimo Dutti',
            category: 'Dış Giyim',
            price: '5.999 TL',
            imageUrl: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=800&q=80' // Trench Coat
        }
    ];

    getDiscoverItems(): ShopItem[] {
        // Shuffle or just return logic could go here
        return this.mockItems;
    }
}

