import { Controller, Get, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
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
    async chat(@Request() req: any, @Body() body: {
        message: string;
        imageBase64?: string;
        history?: { role: 'user' | 'assistant'; content: string }[];
        gender?: string;
    }) {
        const result = await this.aiService.getStylistResponse(
            req.user.userId, body.message, body.imageBase64, body.history, body.gender
        );
        return result;
    }

    @Post('analyze-image')
    @UseInterceptors(FileInterceptor('image'))
    async analyzeImage(@UploadedFile() file: Express.Multer.File) {
        return this.aiService.analyzeGarmentImage(file);
    }

    @Post('generate-outfit-from-list')
    async generateOutfitFromList(@Body() body: { items: any[], city: string, style: string, gender: string }) {
        return this.aiService.generateOutfitFromList(body.items, body.city, body.style, body.gender);
    }

    @Post('try-on')
    async virtualTryOn(@Request() req: any, @Body() body: {
        personImageUrl: string;
        garmentImageUrl: string;
        category?: string;
        brand?: string;
    }) {
        return this.aiService.virtualTryOn(req.user.userId, body);
    }

    @Get('job-status/:id')
    async getJobStatus(@Param('id') id: string) {
        return this.aiService.getJobStatus(id);
    }
}
