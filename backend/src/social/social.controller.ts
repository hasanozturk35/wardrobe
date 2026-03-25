import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('social')
export class SocialController {
    constructor(private readonly socialService: SocialService) {}

    @Get('feed')
    @UseGuards(AuthGuard('jwt')) // Optional: Can be public, but we keep it authenticated for MVP
    getFeed() {
        return this.socialService.getPublicFeed();
    }

    @Post('share/:id')
    @UseGuards(AuthGuard('jwt'))
    toggleShare(@Request() req: any, @Param('id') outfitId: string) {
        return this.socialService.togglePublicOutfit(req.user.userId, outfitId);
    }
}
