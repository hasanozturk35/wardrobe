import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutfitsService {
    constructor(private prisma: PrismaService) { }

    async createOutfit(userId: string, data: { name?: string, description?: string, items: { garmentItemId: string, slot?: string }[] }) {
        // Build the outfit creation object
        return this.prisma.outfit.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
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
