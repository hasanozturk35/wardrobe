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
    async addItem(userId: string, data: { category: string, brand?: string, colors: string[], seasons: string[], photoUrl?: string }) {
        let wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) {
            wardrobe = await this.prisma.wardrobe.create({ data: { userId } });
        }

        return this.prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: data.category,
                brand: data.brand,
                colors: data.colors,
                seasons: data.seasons,
                photos: data.photoUrl ? {
                    create: { url: data.photoUrl, isCover: true }
                } : undefined
            },
            include: { photos: true }
        });
    }

    // 3. Delete an Item
    async deleteItem(userId: string, itemId: string) {
        const wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) throw new NotFoundException('Wardrobe not found');

        const item = await this.prisma.garmentItem.findFirst({
            where: { id: itemId, wardrobeId: wardrobe.id }
        });

        if (!item) throw new NotFoundException('Item not found or unauthorized');

        return this.prisma.garmentItem.delete({
            where: { id: itemId }
        });
    }
}
