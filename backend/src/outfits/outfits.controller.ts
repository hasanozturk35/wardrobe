import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('outfits')
@UseGuards(AuthGuard('jwt'))
export class OutfitsController {
    constructor(private readonly outfitsService: OutfitsService) { }

    @Get()
    async getOutfits(@Request() req: any) {
        return this.outfitsService.getOutfits(req.user.userId);
    }

    @Post()
    async createOutfit(
        @Request() req: any,
        @Body() body: { name?: string, description?: string, items: { garmentItemId: string, slot?: string }[] }
    ) {
        return this.outfitsService.createOutfit(req.user.userId, body);
    }

    @Delete(':id')
    async deleteOutfit(@Request() req: any, @Param('id') id: string) {
        return this.outfitsService.deleteOutfit(req.user.userId, id);
    }
}
