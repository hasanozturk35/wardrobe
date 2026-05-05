import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OutfitsService {
    constructor(private prisma: PrismaService) { }

    async createOutfit(userId: string, data: { name?: string, description?: string, coverImage?: string | null, coverUrl?: string | null, items: { garmentItemId: string, slot?: string }[] }) {
        let finalCoverUrl = data.coverUrl || null;

        // Only try to save base64 if we don't have a direct URL
        if (data.coverImage && !finalCoverUrl) {
            try {
                const outfitsDir = path.join(process.cwd(), 'uploads', 'outfits');
                if (!fs.existsSync(outfitsDir)) {
                    fs.mkdirSync(outfitsDir, { recursive: true });
                }

                const base64Data = data.coverImage.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `outfit_${uuidv4()}.jpg`;
                const filepath = path.join(outfitsDir, filename);

                fs.writeFileSync(filepath, buffer);
                finalCoverUrl = `/static/outfits/${filename}`;
            } catch (error) {
                console.error('Failed to save outfit snapshot:', error);
            }
        }

        return this.prisma.outfit.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                coverUrl: finalCoverUrl,
                items: {
                    create: data.items.map(item => ({
                        garmentItemId: item.garmentItemId,
                        slot: item.slot
                    }))
                }
            },
            include: {
                items: {
                    include: { garmentItem: { include: { photos: true } } }
                }
            }
        });
    }

    async getOutfits(userId: string) {
        return this.prisma.outfit.findMany({
            where: { userId },
            include: {
                items: {
                    include: { garmentItem: { include: { photos: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateProductLinks(userId: string, outfitId: string, links: { label: string; brand: string; url: string }[]) {
        const outfit = await this.prisma.outfit.findFirst({ where: { id: outfitId, userId } });
        if (!outfit) throw new NotFoundException('Outfit not found');
        return this.prisma.outfit.update({
            where: { id: outfitId },
            data: { productLinks: links as any },
        });
    }

    async deleteOutfit(userId: string, id: string) {
        const outfit = await this.prisma.outfit.findFirst({
            where: { id, userId }
        });

        if (!outfit) {
            throw new NotFoundException('Outfit not found');
        }

        return this.prisma.outfit.delete({
            where: { id }
        });
    }
}
