import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
    constructor(private prisma: PrismaService) {}

    async getPublicFeed() {
        return this.prisma.outfit.findMany({
            where: { isPublic: true },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                items: {
                    include: { garmentItem: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async togglePublicOutfit(userId: string, outfitId: string) {
        const outfit = await this.prisma.outfit.findFirst({
            where: { id: outfitId, userId }
        });

        if (!outfit) {
            throw new NotFoundException('Outfit not found or unauthorized');
        }

        return this.prisma.outfit.update({
            where: { id: outfitId },
            data: { isPublic: !outfit.isPublic }
        });
    }

    async toggleLike(userId: string, outfitId: string) {
        const existingLike = await this.prisma.like.findUnique({
            where: {
                outfitId_userId: { outfitId, userId }
            }
        });

        if (existingLike) {
            return this.prisma.like.delete({
                where: { id: existingLike.id }
            });
        }

        return this.prisma.like.create({
            data: { outfitId, userId }
        });
    }

    async addComment(userId: string, outfitId: string, content: string) {
        return this.prisma.comment.create({
            data: { userId, outfitId, content },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });
    }

    async getComments(outfitId: string) {
        return this.prisma.comment.findMany({
            where: { outfitId },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

