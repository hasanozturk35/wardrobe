import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Avatar } from '@prisma/client';

@Injectable()
export class AvatarService {
    private readonly logger = new Logger(AvatarService.name);
    
    constructor(
        private prisma: PrismaService,
        private aiService: AiService
    ) { }

    async uploadAvatar(userId: string, fileUrl: string, originalName: string): Promise<Avatar> {
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

    async getAvatar(userId: string): Promise<Avatar> {
        const avatar = await this.prisma.avatar.findUnique({
            where: { userId }
        });
        if (!avatar) {
            return this.prisma.avatar.create({
                data: { userId, status: 'pending' },
            });
        }
        return avatar;
    }

    async updateSelfie(userId: string, selfieUrl: string): Promise<Avatar> {
        await this.getAvatar(userId); 
        return this.prisma.avatar.update({
            where: { userId },
            data: {
                url: selfieUrl,
                metadata: {
                    ...(await this.getMetadata(userId)),
                    selfie_uploaded_at: new Date().toISOString(),
                },
            },
        });
    }

    async updateBodyPhoto(userId: string, bodyPhotoUrl: string): Promise<Avatar> {
        await this.getAvatar(userId);
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

    async triggerSynthesis(userId: string): Promise<any> {
        this.logger.log(`[Queue] Pushing avatar synthesis job for user ${userId}...`);
        
        const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
        const metadata = (avatar?.metadata as any) || {};

        if (!avatar?.url || !metadata.body_photo_url) {
            throw new Error('Selfie and Body Photo must be uploaded first!');
        }

        await this.prisma.avatar.update({
            where: { userId },
            data: { status: 'processing' },
        });

        const jobResult = await this.aiService.generateAvatar(
            userId, 
            avatar.url, 
            metadata.body_photo_url
        );

        return {
            taskId: jobResult.jobId,
            status: 'processing',
            progress: 0,
            jobId: jobResult.jobId
        };
    }

    async setAvatarUrl(userId: string, url: string): Promise<Avatar> {
        return this.prisma.avatar.upsert({
            where: { userId },
            update: { url, status: 'ready' },
            create: { userId, url, status: 'ready' },
        });
    }

    private async getMetadata(userId: string): Promise<any> {
        const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
        return avatar?.metadata || {};
    }
}
