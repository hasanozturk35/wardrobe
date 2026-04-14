import { Controller, Get, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('editorial')
    async getEditorial(@Request() req: any) {
        return this.aiService.getEditorialResponse(req.user.userId);
    }

    @Post('chat')
    async chat(@Request() req: any, @Body() body: { message: string }) {
        const result = await this.aiService.getStylistResponse(req.user.userId, body.message);
        return result;
    }

    @Post('analyze-image')
    @UseInterceptors(FileInterceptor('image'))
    async analyzeImage(@UploadedFile() file: Express.Multer.File) {
        return this.aiService.analyzeGarmentImage(file);
    }
}
