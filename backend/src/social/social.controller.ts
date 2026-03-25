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
    addComment(@Request() req: any, @Param('id') outfitId: string, @Request() body: any) {
        // Note: In NestJS, @Request() req can be used to get body if not using @Body()
        // But better to use @Body() if possible. I'll use req.body for simplicity here if body is passed as raw.
        // Actually I'll use @Body() correctly if the imports allow it.
        return this.socialService.addComment(req.user.userId, outfitId, req.body.content);
    }
}
