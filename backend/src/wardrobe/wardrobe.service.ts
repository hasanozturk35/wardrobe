import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WardrobeService {
    constructor(private readonly prisma: PrismaService) { }

    // 1. Get User's Wardrobe Items
    async getItems(userId: string) {
        const wardrobe = await this.prisma.wardrobe.findUnique({
            where: { userId },
        });

        if (!wardrobe) throw new NotFoundException('Wardrobe not found');

        return this.prisma.garmentItem.findMany({
            where: { wardrobeId: wardrobe.id },
            include: {
                photos: true,
                tags: { include: { tag: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 2. Add an Item
    async addItem(userId: string, data: { category: string, brand?: string, colors: string[], seasons: string[], photoUrls?: string[] }) {
        let wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) {
            wardrobe = await this.prisma.wardrobe.create({ data: { userId } });
        }

        const createPhotos = data.photoUrls?.map((url, index) => ({ url, isCover: index === 0 })) || [];

        return this.prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: data.category,
                brand: data.brand,
                colors: data.colors,
                seasons: data.seasons,
                photos: createPhotos.length > 0 ? {
                    create: createPhotos
                } : undefined
            },
            include: { photos: true }
        });
    }

    // 2.5 Add a Discovered Item (already has URL)
    async addDiscoveredItem(userId: string, data: { category: string, brand: string, imageUrl: string }) {
        let wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) {
            wardrobe = await this.prisma.wardrobe.create({ data: { userId } });
        }

        return this.prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: data.category,
                brand: data.brand,
                colors: [],
                seasons: [],
                photos: {
                    create: [{ url: data.imageUrl, isCover: true }]
                }
            },
            include: { photos: true }
        });
    }

    // 3. Update an Item
    async updateItem(userId: string, id: string, data: { category?: string, brand?: string, colors?: string[], seasons?: string[], meshUrl?: string }) {
        const item = await this.prisma.garmentItem.findFirst({
            where: { id, wardrobe: { userId } }
        });

        if (!item) throw new NotFoundException('Item not found or unauthorized');

        return this.prisma.garmentItem.update({
            where: { id },
            data: {
                category: data.category,
                brand: data.brand,
                colors: data.colors,
                seasons: data.seasons,
                meshUrl: data.meshUrl
            },
            include: { photos: true }
        });
    }

    // 4. Delete an Item
    async deleteItem(userId: string, id: string) {
        const wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) throw new NotFoundException('Wardrobe not found');

        const item = await this.prisma.garmentItem.findFirst({
            where: { id: id, wardrobeId: wardrobe.id }
        });

        if (!item) throw new NotFoundException('Item not found or unauthorized');

        return this.prisma.garmentItem.delete({
            where: { id: id }
        });
    }
}
