import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('calendar')
@UseGuards(AuthGuard('jwt'))
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    @Get('events')
    getEvents(@Request() req: any, @Query('month') month?: string) {
        return this.calendarService.getEvents(req.user.userId, month);
    }

    @Post('events')
    addEvent(@Request() req: any, @Body() body: { outfitId: string, date: string }) {
        return this.calendarService.addEvent(req.user.userId, body.outfitId, body.date);
    }

    @Delete('events/:id')
    deleteEvent(@Request() req: any, @Param('id') id: string) {
        return this.calendarService.deleteEvent(req.user.userId, id);
    }
}
