import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class CalendarService {
    constructor(private prisma: PrismaService) {}

    async getEvents(userId: string, monthStr?: string) {
        // If monthStr is provided (YYYY-MM), we could filter. For MVP, just return all for user.
        return this.prisma.calendarEvent.findMany({
            where: { userId },
            include: {
                outfit: {
                    select: { id: true, name: true, coverUrl: true }
                }
            },
            orderBy: { date: 'asc' }
        });
    }

    async addEvent(userId: string, outfitId: string, dateStr: string) {
        const date = new Date(dateStr);
        // Overwrite if same date exists or just add a new one? MVP: Just add a new one or find existing.
        // Let's just create a new one to allow multiple outfits a day, or find first and update if we want 1 per day.
        
        // 1 per day logic:
        const existing = await this.prisma.calendarEvent.findFirst({
            where: { userId, date: { equals: date } }
        });

        if (existing) {
            return this.prisma.calendarEvent.update({
                where: { id: existing.id },
                data: { outfitId },
                include: { outfit: { select: { id: true, name: true, coverUrl: true } } }
            });
        }

        return this.prisma.calendarEvent.create({
            data: {
                userId,
                outfitId,
                date
            },
            include: { outfit: { select: { id: true, name: true, coverUrl: true } } }
        });
    }

    async deleteEvent(userId: string, id: string) {
        const event = await this.prisma.calendarEvent.findFirst({
            where: { id, userId }
        });
        if (!event) throw new NotFoundException('Event not found');

        return this.prisma.calendarEvent.delete({ where: { id } });
    }
}

