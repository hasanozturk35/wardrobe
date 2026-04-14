import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async updateResetToken(userId: string, token: string, expires: Date) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                resetToken: token,
                resetTokenExpires: expires,
            },
        });
    }

    async findByResetToken(token: string) {
        return this.prisma.user.findFirst({
            where: { resetToken: token },
        });
    }

    async updatePassword(userId: string, passwordHash: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null,
            },
        });
    }
}
