import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OutfitsService {
    constructor(private prisma: PrismaService) { }

    async createOutfit(userId: string, data: { name?: string, description?: string, coverImage?: string | null, items: { garmentItemId: string, slot?: string }[] }) {
        let coverUrl = null;

        if (data.coverImage) {
            try {
                // Ensure directory exists
                const outfitsDir = path.join(process.cwd(), 'uploads', 'outfits');
                if (!fs.existsSync(outfitsDir)) {
                    fs.mkdirSync(outfitsDir, { recursive: true });
                }

                // Decode base64
                const base64Data = data.coverImage.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `outfit_${uuidv4()}.jpg`;
                const filepath = path.join(outfitsDir, filename);

                fs.writeFileSync(filepath, buffer);
                coverUrl = `/static/outfits/${filename}`;
            } catch (error) {
                console.error('Failed to save outfit snapshot:', error);
            }
        }

        // Build the outfit creation object
        return this.prisma.outfit.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                coverUrl,
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
