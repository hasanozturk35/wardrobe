import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvatarService {
    constructor(private prisma: PrismaService) { }

    async uploadAvatar(userId: string, fileUrl: string, originalName: string) {
        // Upsert the avatar record for the user
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
        if (!avatar) throw new NotFoundException('Avatar not found');
        return avatar;
    }
}
