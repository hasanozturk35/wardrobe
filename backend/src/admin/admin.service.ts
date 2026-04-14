import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(limit: number = 100, skip: number = 0, level?: string) {
    return this.prisma.systemLog.findMany({
      where: level && level !== 'all' ? { level } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
    });
  }

  async deleteLog(logId: string) {
    return this.prisma.systemLog.delete({
      where: { id: logId },
    });
  }

  async clearAllLogs() {
    return this.prisma.systemLog.deleteMany();
  }

  async exportLogsCSV() {
    const logs = await this.prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    const header = 'ID,Level,Message,Context,UserID,Timestamp\n';
    const rows = logs.map(log => 
      `"${log.id}","${log.level}","${log.message.replace(/"/g, '""')}","${log.context || ''}","${log.userId || ''}","${log.timestamp.toISOString()}"`
    ).join('\n');

    return header + rows;
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Statistics for Dashboard
   */
  async getStats() {
    const [totalUsers, totalItems, newUsersToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.garmentItem.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Daily activity mock (log counts)
    const logsLast7Days = await this.prisma.systemLog.groupBy({
      by: ['level'],
      _count: { _all: true },
    });

    return {
      totalUsers,
      totalItems,
      newUsersToday,
      logSummary: logsLast7Days,
    };
  }
}
