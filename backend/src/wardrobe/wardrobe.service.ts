import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { GarmentItem } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { CreateItemDto, UpdateItemDto } from './dto/wardrobe.dto';

@Injectable()
export class WardrobeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService
    ) { }

    // 1. Get User's Wardrobe Items
    async getItems(userId: string): Promise<GarmentItem[]> {
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
    async addItem(userId: string, data: CreateItemDto & { photoUrls?: string[] }) {
        let wardrobe = await this.prisma.wardrobe.findUnique({ where: { userId } });
        if (!wardrobe) {
            wardrobe = await this.prisma.wardrobe.create({ data: { userId } });
        }

        const createPhotos = data.photoUrls?.map((url, index) => ({ url, isCover: index === 0 })) || [];

        const item = await this.prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: data.category,
                brand: data.brand,
                colors: data.colors || [],
                seasons: data.seasons || [],
                photos: createPhotos.length > 0 ? {
                    create: createPhotos
                } : undefined
            },
            include: { photos: true }
        });

        // 🔥 Trigger 3D/AI Processing in background
        let jobId: string | undefined;
        if (data.photoUrls && data.photoUrls.length > 0) {
            const aiJob = await this.aiService.generate3DModel(item.id, data.photoUrls[0]).catch(err => {
                console.error('Failed to trigger background 3D generation:', err);
                return null;
            });
            jobId = aiJob?.jobId;
        }

        return { ...item, jobId };
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
    async updateItem(userId: string, id: string, data: UpdateItemDto) {
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
