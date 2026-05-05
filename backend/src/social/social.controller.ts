import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('social')
export class SocialController {
    constructor(private readonly socialService: SocialService) {}

    @Get('feed')
    @UseGuards(AuthGuard('jwt'))
    getFeed(@Query('occasion') occasion?: string) {
        return this.socialService.getPublicFeed(occasion);
    }

    @Post('share/:id')
    @UseGuards(AuthGuard('jwt'))
    toggleShare(@Request() req: any, @Param('id') outfitId: string, @Body() body: { occasion?: string }) {
        return this.socialService.togglePublicOutfit(req.user.userId, outfitId, body?.occasion);
    }

    @Post('like/:id')
    @UseGuards(AuthGuard('jwt'))
    toggleLike(@Request() req: any, @Param('id') outfitId: string) {
        return this.socialService.toggleLike(req.user.userId, outfitId);
    }

    @Get('comments/:id')
    @UseGuards(AuthGuard('jwt'))
    getComments(@Param('id') outfitId: string) {
        return this.socialService.getComments(outfitId);
    }

    @Post('comments/:id')
    @UseGuards(AuthGuard('jwt'))
    addComment(@Request() req: any, @Param('id') outfitId: string, @Body() body: { content: string }) {
        return this.socialService.addComment(req.user.userId, outfitId, body.content);
    }
}
