import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
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

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
    });
  }

  async getStats(userId: string) {
    const [outfitCount, wardrobeCount, publicCount] = await Promise.all([
      this.prisma.outfit.count({ where: { userId } }),
      this.prisma.garmentItem.count({ where: { wardrobe: { userId } } }),
      this.prisma.outfit.count({ where: { userId, isPublic: true } }),
    ]);
    return { outfitCount, wardrobeCount, publicCount };
  }

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) return { following: false };
    const db = this.prisma as any;
    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return { following: false };
    }
    await db.follow.create({ data: { followerId, followingId } });
    return { following: true };
  }

  async getPublicProfile(viewerId: string, targetId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const db = this.prisma as any;
    const [followerCount, followingCount, followRow, outfits] = await Promise.all([
      db.follow.count({ where: { followingId: targetId } }),
      db.follow.count({ where: { followerId: targetId } }),
      viewerId !== targetId
        ? db.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: targetId } } })
        : null,
      this.prisma.outfit.findMany({
        where: { userId: targetId, isPublic: true },
        include: { items: { include: { garmentItem: { include: { photos: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const outfitCount = outfits.length;
    return { ...user, followerCount, followingCount, outfitCount, isFollowing: !!followRow, outfits };
  }
}
