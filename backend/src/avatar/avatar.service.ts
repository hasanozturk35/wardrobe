import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AvatarGenerationStatus } from './vton-interfaces';

@Injectable()
export class AvatarService {
    constructor(private prisma: PrismaService) { }

    async uploadAvatar(userId: string, fileUrl: string, originalName: string) {
        // Upsert the avatar record for the user (Direct GLB Upload)
        return this.prisma.avatar.upsert({
            where: { userId },
            update: {
                url: fileUrl,
                status: 'ready',
                metadata: { originalName }
            },
            create: {
                userId,
                url: fileUrl,
                status: 'ready',
                metadata: { originalName }
            }
        });
    }

    async getAvatar(userId: string) {
        const avatar = await this.prisma.avatar.findUnique({
            where: { userId }
        });
        if (!avatar) {
            // Create empty avatar record if it doesn't exist (Infrastructure first)
            return this.prisma.avatar.create({
                data: { userId, status: 'pending' },
            });
        }
        return avatar;
    }

    async updateSelfie(userId: string, selfieUrl: string) {
        await this.getAvatar(userId); // Ensure record exists
        return this.prisma.avatar.update({
            where: { userId },
            data: {
                url: selfieUrl, // Using the primary 'url' field for the selfie
                metadata: {
                    ...(await this.getMetadata(userId)),
                    selfie_uploaded_at: new Date().toISOString(),
                },
            },
        });
    }

    async updateBodyPhoto(userId: string, bodyPhotoUrl: string) {
        await this.getAvatar(userId); // Ensure record exists
        return this.prisma.avatar.update({
            where: { userId },
            data: {
                metadata: {
                    ...(await this.getMetadata(userId)),
                    body_photo_url: bodyPhotoUrl,
                    body_photo_uploaded_at: new Date().toISOString(),
                },
            },
        });
    }

    async triggerSynthesisPlaceholder(userId: string): Promise<AvatarGenerationStatus> {
        console.log(`[Avatar] Triggering neural synthesis placeholder for user ${userId}`);
        
        // Update status to processing
        await this.prisma.avatar.update({
            where: { userId },
            data: { status: 'processing' },
        });

        return {
            taskId: `task_${userId}_${Date.now()}`,
            status: 'processing',
            progress: 0,
        };
    }

    private async getMetadata(userId: string): Promise<any> {
        const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
        return avatar?.metadata || {};
    }
}
