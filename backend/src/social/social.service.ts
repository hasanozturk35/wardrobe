import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { SocialGateway } from './social.gateway';

@Injectable()
export class SocialService {
    constructor(
        private prisma: PrismaService,
        private gateway: SocialGateway,
    ) {}

    async getPublicFeed(occasion?: string) {
        return this.prisma.outfit.findMany({
            where: { isPublic: true, ...(occasion ? { occasion } : {}) },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                items: {
                    include: { garmentItem: { include: { photos: true } } }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async togglePublicOutfit(userId: string, outfitId: string, occasion?: string) {
        const outfit = await this.prisma.outfit.findFirst({
            where: { id: outfitId, userId }
        });

        if (!outfit) {
            throw new NotFoundException('Outfit not found or unauthorized');
        }

        const makingPublic = !outfit.isPublic;
        const updated = await this.prisma.outfit.update({
            where: { id: outfitId },
            data: {
                isPublic: makingPublic,
                ...(makingPublic && occasion ? { occasion } : {}),
            } as any,
        });

        if (updated.isPublic) {
            const fullPost = await this.prisma.outfit.findUnique({
                where: { id: outfitId },
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    items: { include: { garmentItem: { include: { photos: true } } } },
                    _count: { select: { likes: true, comments: true } }
                }
            });
            this.gateway.emitNewPost(fullPost);
        }

        return updated;
    }

    async toggleLike(userId: string, outfitId: string) {
        const existingLike = await this.prisma.like.findUnique({
            where: { outfitId_userId: { outfitId, userId } }
        });

        if (existingLike) {
            await this.prisma.like.delete({ where: { id: existingLike.id } });
        } else {
            await this.prisma.like.create({ data: { outfitId, userId } });
        }

        const count = await this.prisma.like.count({ where: { outfitId } });
        this.gateway.emitLikeUpdate(outfitId, count);

        return { liked: !existingLike, count };
    }

    async addComment(userId: string, outfitId: string, content: string) {
        const comment = await this.prisma.comment.create({
            data: { userId, outfitId, content },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } }
            }
        });

        this.gateway.emitNewComment(outfitId, comment);

        return comment;
    }

    async getComments(outfitId: string, take = 20, skip = 0) {
        return this.prisma.comment.findMany({
            where: { outfitId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
}
